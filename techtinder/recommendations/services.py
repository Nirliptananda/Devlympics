from __future__ import annotations

from typing import Optional

from catalog.models import Interest, Skill
from opportunities.models import Opportunity
from profiles.models import Profile


def _slug_names(items, lookup):
    return [lookup.get(item, item) for item in sorted(items)]


def _skill_names_for(profile):
    skills = profile.skills.all()
    return {skill.slug: skill.name for skill in skills}


def _interest_names_for(profile):
    interests = profile.interests.all()
    return {interest.slug: interest.name for interest in interests}


def score_profile_match(user_profile: Profile, other_profile: Profile):
    user_skills = set(user_profile.skills.values_list("slug", flat=True))
    other_skills = set(other_profile.skills.values_list("slug", flat=True))
    shared_skills = sorted(user_skills & other_skills)
    complementary_skills = sorted(other_skills - user_skills)

    if len(shared_skills) < 1 or len(complementary_skills) < 2:
        return None

    user_interests = set(user_profile.interests.values_list("slug", flat=True))
    other_interests = set(other_profile.interests.values_list("slug", flat=True))
    shared_interests = sorted(user_interests & other_interests)
    union_interests = user_interests | other_interests

    skill_lookup = {**_skill_names_for(user_profile), **_skill_names_for(other_profile)}
    interest_lookup = {**_interest_names_for(user_profile), **_interest_names_for(other_profile)}

    overlap_ratio = len(shared_skills) / max(1, len(user_skills))
    complement_ratio = len(complementary_skills) / max(1, len(other_skills))
    discipline_bonus = 1 if user_profile.discipline != other_profile.discipline else 0
    interest_ratio = len(shared_interests) / max(1, len(union_interests))

    match_score = round(
        100
        * (
            0.35 * overlap_ratio
            + 0.35 * complement_ratio
            + 0.15 * discipline_bonus
            + 0.15 * interest_ratio
        )
    )

    shared_skill_names = [skill_lookup.get(skill, skill) for skill in shared_skills]
    complementary_names = [skill_lookup.get(skill, skill) for skill in complementary_skills[:4]]
    shared_interest_names = [interest_lookup.get(item, item) for item in shared_interests]

    if shared_skill_names and complementary_names:
        reason = f"You both know {shared_skill_names[0]}. They also bring {', '.join(complementary_names)}."
    else:
        reason = "Strong potential match based on shared interests and complementary skills."

    return {
        "match_score": match_score,
        "shared_skills": shared_skill_names,
        "complementary_skills": complementary_names,
        "shared_interests": shared_interest_names,
        "reason": reason,
    }


def score_opportunity_match(user_profile: Profile, opportunity: Opportunity):
    required = set(opportunity.required_skills.values_list("slug", flat=True))
    user_skills = set(user_profile.skills.values_list("slug", flat=True))
    matched = sorted(user_skills & required)
    missing = sorted(required - user_skills)

    if not matched:
        return None

    opportunity_skill_lookup = {skill.slug: skill.name for skill in opportunity.required_skills.all()}
    score = round(100 * len(matched) / max(1, len(required)))
    return {
        "match_score": score,
        "matched_skills": [opportunity_skill_lookup.get(skill, skill) for skill in matched],
        "missing_skills": [opportunity_skill_lookup.get(skill, skill) for skill in missing],
    }


def score_pair_opportunity(user_profile: Profile, other_profile: Profile, opportunity: Opportunity):
    required = set(opportunity.required_skills.values_list("slug", flat=True))
    if not required:
        return None

    user_skills = set(user_profile.skills.values_list("slug", flat=True))
    other_skills = set(other_profile.skills.values_list("slug", flat=True))
    you_cover = sorted(user_skills & required)
    they_cover = sorted(other_skills & required)
    combined = sorted((user_skills | other_skills) & required)
    uncovered = sorted(required - ((user_skills | other_skills) & required))

    if not you_cover or not they_cover:
        return None

    contributes = sum(1 for skill in combined if (skill in you_cover) ^ (skill in they_cover))
    if contributes < 1:
        return None

    opportunity_skill_lookup = {skill.slug: skill.name for skill in opportunity.required_skills.all()}
    match_score = round(100 * len(combined) / max(1, len(required)))
    return {
        "match_score": match_score,
        "you_cover": [opportunity_skill_lookup.get(skill, skill) for skill in you_cover],
        "they_cover": [opportunity_skill_lookup.get(skill, skill) for skill in they_cover],
        "uncovered": [opportunity_skill_lookup.get(skill, skill) for skill in uncovered],
    }
