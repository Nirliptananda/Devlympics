"""Project recommendations for one person, or for a matched pair.

Fit for one person = (0.5 * domain similarity + 0.5 * skill coverage) * level fit.
For a pair, the project must work for both people, and projects that span both
people's primary domains get a bonus (that's the "cater to both domains" rule).
"""
from django.conf import settings

from catalog.models import DOMAIN_CODES
from common.vectors import cosine

from .models import Project

PAIR_DOMAIN_BONUS = 0.1


def projects_queryset():
    return Project.objects.prefetch_related("project_skills__skill__domain_weights")


def level_fit(level, project):
    if level is None:
        return 0.0
    if project.min_level <= level <= project.max_level:
        return 1.0
    gap = project.min_level - level if level < project.min_level else level - project.max_level
    return 0.5 if gap == 1 else 0.0


def skill_ids_of(profile):
    return set(profile.skills.values_list("skill_id", flat=True))


def fit_for_profile(profile, project, skill_ids):
    """Return (score 0..1, vector) for one person and one project."""
    lf = level_fit(profile.level, project)
    vector = project.domain_vector()
    if lf == 0.0:
        return 0.0, vector
    domain_fit = cosine(profile.domain_scores, vector, DOMAIN_CODES)
    required = {s.id for s in project.required_skills()}
    skill_fit = len(required & skill_ids) / len(required) if required else 0.0
    return round((0.5 * domain_fit + 0.5 * skill_fit) * lf, 4), vector


def _project_payload(project, vector, skill_ids):
    required = project.required_skills()
    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "levels": [project.min_level, project.max_level],
        "domain_vector": {d: round(v, 3) for d, v in vector.items()},
        "is_cross_domain": project.is_cross_domain,
        "required_skills": [s.name for s in required],
        "you_have": [s.name for s in required if s.id in skill_ids],
        "you_need": [s.name for s in required if s.id not in skill_ids],
    }


def recommend_projects(profile, limit=10):
    skill_ids = skill_ids_of(profile)
    results = []
    for project in projects_queryset():
        score, vector = fit_for_profile(profile, project, skill_ids)
        if score <= 0:
            continue
        results.append({**_project_payload(project, vector, skill_ids), "score": score})
    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]


def recommend_projects_for_pair(me, other, limit=10):
    """Projects both people can work on, with a bonus when they span both primary domains."""
    share = settings.TECH_TINDER["PROJECT_DOMAIN_SHARE"]
    my_skills, their_skills = skill_ids_of(me), skill_ids_of(other)
    results = []
    for project in projects_queryset():
        mine, vector = fit_for_profile(me, project, my_skills)
        theirs, _ = fit_for_profile(other, project, their_skills)
        if mine <= 0 or theirs <= 0:
            continue
        score = 0.5 * min(mine, theirs) + 0.5 * (mine + theirs) / 2
        spans_both = (
            me.primary_domain != other.primary_domain
            and vector.get(me.primary_domain, 0) >= share
            and vector.get(other.primary_domain, 0) >= share
        )
        if spans_both:
            score += PAIR_DOMAIN_BONUS
        payload = _project_payload(project, vector, my_skills)
        payload["you_have_them"] = [s.name for s in project.required_skills() if s.id in their_skills]
        results.append(
            {
                **payload,
                "score": round(score, 4),
                "fit_you": mine,
                "fit_them": theirs,
                "spans_both_domains": spans_both,
            }
        )
    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]
