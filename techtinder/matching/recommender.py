"""People recommendations.

Two modes:
  similar        same or shared domains, ranked by domain-vector similarity plus
                 shared skills and interests
  complementary  different primary domains, linked by shared "bridge" skills
                 (skills that belong to more than one domain) and shared interests

`build_overlap` is also the payload the frontend uses to draw the overlap visuals.
"""
from django.conf import settings

from catalog.models import DOMAIN_CODES
from common.vectors import cosine, jaccard
from profiles.models import Profile
from profiles.payloads import profile_summary

from .models import Swipe

PREFETCH = ("skills__skill__domain_weights", "interests__interest")


class Snapshot:
    """A profile plus its skills and interests, read once from prefetch caches."""

    def __init__(self, profile):
        self.profile = profile
        self.skills = {ps.skill_id: ps.skill for ps in profile.skills.all()}
        self.interests = {pi.interest_id: pi.interest for pi in profile.interests.all()}


def load_snapshot(profile):
    return Snapshot(Profile.objects.prefetch_related(*PREFETCH).get(pk=profile.pk))


def build_overlap(me, other):
    """Everything needed to draw how two people overlap."""
    shared_skill_ids = set(me.skills) & set(other.skills)
    shared_interest_ids = set(me.interests) & set(other.interests)
    shared_skills = sorted(
        ({"id": i, "name": me.skills[i].name, "is_bridge": me.skills[i].is_bridge} for i in shared_skill_ids),
        key=lambda s: (not s["is_bridge"], s["name"]),
    )
    return {
        "domain_similarity": round(cosine(me.profile.domain_scores, other.profile.domain_scores, DOMAIN_CODES), 3),
        "shared_domains": sorted(me.profile.domains & other.profile.domains),
        "shared_skills": shared_skills,
        "shared_bridge_skills": [s["name"] for s in shared_skills if s["is_bridge"]],
        "shared_interests": sorted(me.interests[i].name for i in shared_interest_ids),
        "me_scores": me.profile.domain_scores,
        "them_scores": other.profile.domain_scores,
    }


def _similar(me, other, overlap):
    if not overlap["shared_domains"]:
        return None
    skill_j = jaccard(set(me.skills), set(other.skills))
    interest_j = jaccard(set(me.interests), set(other.interests))
    return round(0.6 * overlap["domain_similarity"] + 0.25 * skill_j + 0.15 * interest_j, 4)


def _complementary(me, other, overlap):
    if me.profile.primary_domain == other.profile.primary_domain:
        return None
    bridge_n = len(overlap["shared_bridge_skills"])
    interest_n = len(overlap["shared_interests"])
    if bridge_n == 0 and interest_n == 0:
        return None
    score = (
        0.45 * min(1.0, bridge_n / 2)
        + 0.35 * min(1.0, interest_n / 2)
        + 0.20 * (1 - overlap["domain_similarity"])
    )
    return round(score, 4)


def recommend_people(profile, mode="both", limit=20):
    me = load_snapshot(profile)
    window = settings.TECH_TINDER["LEVEL_WINDOW"]
    already_swiped = Swipe.objects.filter(from_profile=profile).values_list("to_profile_id", flat=True)

    candidates = (
        Profile.objects.exclude(pk=profile.pk)
        .exclude(pk__in=already_swiped)
        .exclude(primary_domain="")
        .filter(level__range=(profile.level - window, profile.level + window))
        .prefetch_related(*PREFETCH)
        .select_related("user")
    )

    results = []
    for candidate in candidates:
        other = Snapshot(candidate)
        overlap = build_overlap(me, other)

        options = []
        if mode in ("both", "similar"):
            score = _similar(me, other, overlap)
            if score is not None:
                options.append(("similar", score))
        if mode in ("both", "complementary"):
            score = _complementary(me, other, overlap)
            if score is not None:
                options.append(("complementary", score))
        if not options:
            continue

        best_mode, best_score = max(options, key=lambda o: o[1])
        results.append(
            {"profile": profile_summary(candidate), "mode": best_mode, "score": best_score, "overlap": overlap}
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]
