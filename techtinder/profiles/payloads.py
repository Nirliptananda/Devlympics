"""Plain-dict representations of profiles, reused by profile, matching and demo views."""
from .models import Level


def level_label(level):
    return Level(level).label if level else None


def profile_summary(p):
    return {
        "id": p.id,
        "display_name": str(p),
        "primary_domain": p.primary_domain,
        "secondary_domains": p.secondary_domains,
        "level": p.level,
        "level_label": level_label(p.level),
        "domain_scores": p.domain_scores,
    }


def profile_detail(p):
    data = profile_summary(p)
    data["skills"] = [
        {"id": ps.skill_id, "name": ps.skill.name, "proficiency": ps.proficiency}
        for ps in p.skills.select_related("skill")
    ]
    data["interests"] = [{"id": pi.interest_id, "name": pi.interest.name} for pi in p.interests.select_related("interest")]
    data["experiences"] = [
        {"id": pe.option_id, "label": pe.option.label} for pe in p.experiences.select_related("option")
    ]
    return data
