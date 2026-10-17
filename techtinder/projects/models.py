from django.conf import settings
from django.db import models

from catalog.models import DOMAIN_CODES, Skill


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
        """Share of each domain across the required skills (sums to 1). Uses prefetch caches."""
        totals = {d: 0.0 for d in DOMAIN_CODES}
        for ps in self.project_skills.all():
            for w in ps.skill.domain_weights.all():
                totals[w.domain] += w.weight
        grand = sum(totals.values())
        return {d: (v / grand if grand else 0.0) for d, v in totals.items()}

    @property
    def covered_domains(self):
        share = settings.TECH_TINDER["PROJECT_DOMAIN_SHARE"]
        return {d for d, v in self.domain_vector().items() if v >= share}

    @property
    def is_cross_domain(self):
        return len(self.covered_domains) >= 2


class ProjectSkill(models.Model):
    project = models.ForeignKey(Project, related_name="legacy_project_skills", on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, related_name="legacy_project_links", on_delete=models.CASCADE)

    class Meta:
        unique_together = ("project", "skill")
