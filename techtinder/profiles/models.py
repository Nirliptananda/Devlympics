from django.conf import settings
from django.db import models

from catalog.models import DOMAIN_CODES, DISCIPLINES, EXPERIENCE_LEVELS, Interest, Skill


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=120)
    discipline = models.CharField(max_length=20, choices=DISCIPLINES)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    bio = models.TextField(blank=True, default="")
    experience_summary = models.TextField()
    github_url = models.URLField(blank=True, default="")
    linkedin_url = models.URLField(blank=True, default="")
    skills = models.ManyToManyField(Skill, related_name="profiles")
    interests = models.ManyToManyField(Interest, related_name="profiles")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.full_name or self.user.email

    @property
    def discipline_label(self):
        return dict(DISCIPLINES).get(self.discipline, self.discipline)

    @property
    def is_complete(self):
        return self.skills.count() > 0 or self.interests.count() > 0

    @property
    def domain_scores(self):
        scores = {domain: 0.0 for domain in DOMAIN_CODES}
        for experience in self.experiences.select_related("option"):
            scores[experience.option.domain] = scores.get(experience.option.domain, 0.0) + float(experience.option.points)
        for skill in self.skills.all():
            for weight in skill.domain_weights.all():
                scores[weight.domain] = scores.get(weight.domain, 0.0) + float(weight.weight)
        for interest in self.interests.all():
            for weight in interest.domain_weights.all():
                scores[weight.domain] = scores.get(weight.domain, 0.0) + float(weight.weight)

        max_total = max(scores.values()) if scores else 0.0
        if max_total <= 0:
            return {domain: 0.0 for domain in DOMAIN_CODES}
        return {domain: round(value / max_total, 4) for domain, value in scores.items()}

    @property
    def domains(self):
        return {domain for domain, value in self.domain_scores.items() if value > 0}

    @property
    def primary_domain(self):
        ranked = sorted(self.domain_scores.items(), key=lambda item: item[1], reverse=True)
        if not ranked or ranked[0][1] <= 0:
            return ""
        return ranked[0][0]

    @property
    def secondary_domains(self):
        ranked = sorted(self.domain_scores.items(), key=lambda item: item[1], reverse=True)
        if not ranked:
            return []
        top = ranked[0][1]
        return [domain for domain, value in ranked[1:] if value > 0 and value >= 0.6 * top]

    @property
    def level(self):
        mapping = {"beginner": 1, "intermediate": 2, "advanced": 3}
        return mapping.get(self.experience_level)


class PastProject(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="past_projects")
    title = models.CharField(max_length=150)
    description = models.TextField()
    link = models.URLField(blank=True, default="")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title


class ProfileExperience(models.Model):
    profile = models.ForeignKey(Profile, related_name="experiences", on_delete=models.CASCADE)
    option = models.ForeignKey("catalog.ExperienceOption", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.profile} -> {self.option.label}"

    @property
    def domain(self):
        return self.option.domain

    @property
    def points(self):
        return self.option.points


class Level(models.IntegerChoices):
    BEGINNER = 1, "Beginner"
    INTERMEDIATE = 2, "Intermediate"
    ADVANCED = 3, "Advanced"
