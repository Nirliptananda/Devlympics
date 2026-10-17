from django.conf import settings
from django.db import models

from catalog.models import DOMAIN_CODES, OPPORTUNITY_MODES, OPPORTUNITY_TYPES, Skill


class Opportunity(models.Model):
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=OPPORTUNITY_TYPES)
    source = models.CharField(max_length=40)
    organizer = models.CharField(max_length=150, blank=True, default="")
    url = models.URLField()
    description = models.TextField()
    prize = models.CharField(max_length=100, blank=True, default="")
    mode = models.CharField(max_length=10, choices=OPPORTUNITY_MODES, default="online")
    deadline = models.DateField(null=True, blank=True)
    image_url = models.URLField(blank=True, default="")
    required_skills = models.ManyToManyField(Skill, related_name="opportunities")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Project(models.Model):
    title = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    min_level = models.PositiveSmallIntegerField(default=1)
    max_level = models.PositiveSmallIntegerField(default=3)

    def __str__(self):
        return self.title

    def required_skills(self):
        return [ps.skill for ps in self.project_skills.all()]

    def domain_vector(self):
        totals = {domain: 0.0 for domain in DOMAIN_CODES}
        for ps in self.project_skills.all():
            for weight in ps.skill.domain_weights.all():
                totals[weight.domain] += float(weight.weight)
        grand = sum(totals.values())
        if grand == 0:
            return {domain: 0.0 for domain in DOMAIN_CODES}
        return {domain: round(value / grand, 4) for domain, value in totals.items()}

    @property
    def covered_domains(self):
        share = getattr(settings, "TECH_TINDER", {}).get("PROJECT_DOMAIN_SHARE", 0.25)
        return {domain for domain, value in self.domain_vector().items() if value >= share}

    @property
    def is_cross_domain(self):
        return len(self.covered_domains) >= 2


class ProjectSkill(models.Model):
    project = models.ForeignKey(Project, related_name="project_skills", on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, related_name="opportunity_project_links", on_delete=models.CASCADE)

    class Meta:
        unique_together = ("project", "skill")
