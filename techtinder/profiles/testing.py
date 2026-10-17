from django.contrib.auth import get_user_model

from catalog.models import ExperienceOption, Interest, Skill

from .models import Profile


def make_profile(
    username,
    skills=None,
    interests=(),
    experiences=None,
    display_name="",
    password="demo12345",
    discipline="software",
    experience_level="intermediate",
    bio="",
    experience_summary="Demo profile",
):
    user = get_user_model().objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password=password,
    )
    profile = Profile.objects.create(
        user=user,
        full_name=display_name or username,
        discipline=discipline,
        experience_level=experience_level,
        bio=bio,
        experience_summary=experience_summary,
    )

    if isinstance(skills, dict):
        skill_items = list(skills.items())
    else:
        skill_items = [(name, None) for name in (skills or [])]

    for name, _ in skill_items:
        skill = Skill.ensure(name)
        if skill is not None:
            profile.skills.add(skill)

    for name in interests or ():
        interest = Interest.ensure(name)
        if interest is not None:
            profile.interests.add(interest)

    for label in experiences or ():
        option = ExperienceOption.objects.filter(label__iexact=label).first()
        if option is not None:
            profile.experiences.create(option=option)

    return profile
