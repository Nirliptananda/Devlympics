"""Category scoring: turns a profile's experience, skills and interests into
per-domain scores, a primary domain, secondary domains and a level.

Priority is experience > skills > interests (see settings.TECH_TINDER).
"""
from collections import defaultdict

from django.conf import settings
from django.utils import timezone

from catalog.models import DOMAIN_CODES


def _cfg():
    return settings.TECH_TINDER


def _normalize(rows, cap):
    """Sum (domain, value) pairs per domain and scale to 0..1 against a cap."""
    totals = defaultdict(float)
    for domain, value in rows:
        totals[domain] += value
    return {d: min(1.0, totals[d] / cap) for d in DOMAIN_CODES}


def signal_scores(profile):
    """Return the three normalised signals as {"exp": {...}, "skill": {...}, "interest": {...}}."""
    caps = _cfg()["CAPS"]

    exp = _normalize(
        ((e.option.domain, e.option.points) for e in profile.experiences.select_related("option")),
        caps["exp"],
    )
    skill = _normalize(
        (
            (w.domain, ps.proficiency * w.weight)
            for ps in profile.skills.select_related("skill").prefetch_related("skill__domain_weights")
            for w in ps.skill.domain_weights.all()
        ),
        caps["skill"],
    )
    interest = _normalize(
        (
            (w.domain, w.weight)
            for pi in profile.interests.select_related("interest").prefetch_related("interest__domain_weights")
            for w in pi.interest.domain_weights.all()
        ),
        caps["interest"],
    )
    return {"exp": exp, "skill": skill, "interest": interest}


def compute_category(profile):
    cfg = _cfg()
    sig = signal_scores(profile)
    w = cfg["WEIGHTS"]

    scores = {
        d: round(w["exp"] * sig["exp"][d] + w["skill"] * sig["skill"][d] + w["interest"] * sig["interest"][d], 4)
        for d in DOMAIN_CODES
    }

    top = max(scores.values())
    if top == 0:
        return {"domain_scores": scores, "primary_domain": "", "secondary_domains": [], "level": None}

    primary = max(DOMAIN_CODES, key=lambda d: scores[d])
    secondary = [d for d in DOMAIN_CODES if d != primary and scores[d] >= cfg["SECONDARY_RATIO"] * top]

    # Level uses experience and skills only; interests never make someone "advanced".
    level_raw = 0.6 * sig["exp"][primary] + 0.4 * sig["skill"][primary]
    low, high = cfg["LEVEL_CUTS"]
    level = 1 if level_raw < low else 2 if level_raw < high else 3

    return {
        "domain_scores": scores,
        "primary_domain": primary,
        "secondary_domains": secondary,
        "level": level,
    }


def refresh_profile_category(profile):
    for field, value in compute_category(profile).items():
        setattr(profile, field, value)
    profile.scores_updated_at = timezone.now()
    profile.save()
    return profile
