from django.db import models
from django.utils.text import slugify

DISCIPLINES = [
    ("hardware", "Hardware / Electronics"),
    ("software", "Software"),
    ("design", "Design"),
    ("business", "Business / Marketing"),
    ("data_ai", "Data / AI"),
    ("research", "Research"),
    ("other", "Other"),
]

EXPERIENCE_LEVELS = [
    ("beginner", "Beginner"),
    ("intermediate", "Intermediate"),
    ("advanced", "Advanced"),
]

OPPORTUNITY_TYPES = [
    ("competition", "Competition"),
    ("hackathon", "Hackathon"),
    ("project", "Project"),
    ("other", "Other"),
]

OPPORTUNITY_MODES = [
    ("online", "Online"),
    ("offline", "Offline"),
    ("hybrid", "Hybrid"),
]


class Skill(models.Model):
    name = models.CharField(max_length=60)
    slug = models.SlugField(max_length=60, unique=True)
    category = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return self.name

    @classmethod
    def ensure(cls, name, category=""):
        value = (name or "").strip()
        if not value:
            return None
        slug = slugify(value)
        if not slug:
            return None
        obj, _ = cls.objects.get_or_create(
            slug=slug,
            defaults={"name": value, "category": category},
        )
        if obj.name != value:
            obj.name = value
        if category and not obj.category:
            obj.category = category
        if obj.name != value or (category and not obj.category):
            obj.save(update_fields=["name", "category"])
        return obj


class Interest(models.Model):
    name = models.CharField(max_length=60)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @classmethod
    def ensure(cls, name):
        value = (name or "").strip()
        if not value:
            return None
        slug = slugify(value)
        if not slug:
            return None
        obj, _ = cls.objects.get_or_create(slug=slug, defaults={"name": value})
        if obj.name != value:
            obj.name = value
            obj.save(update_fields=["name"])
        return obj


class Domain(models.TextChoices):
    HARDWARE = "hw", "Hardware"
    SOFTWARE = "sw", "Software"
    ADMIN = "admin", "Administration"


DOMAIN_CODES = [d.value for d in Domain]


class SkillDomainWeight(models.Model):
    skill = models.ForeignKey(Skill, related_name="domain_weights", on_delete=models.CASCADE)
    domain = models.CharField(max_length=5, choices=Domain.choices)
    weight = models.FloatField()

    class Meta:
        unique_together = ("skill", "domain")

    @property
    def is_bridge(self):
        return True


class InterestDomainWeight(models.Model):
    interest = models.ForeignKey(Interest, related_name="domain_weights", on_delete=models.CASCADE)
    domain = models.CharField(max_length=5, choices=Domain.choices)
    weight = models.FloatField()

    class Meta:
        unique_together = ("interest", "domain")


class ExperienceOption(models.Model):
    label = models.CharField(max_length=120, unique=True)
    domain = models.CharField(max_length=5, choices=Domain.choices)
    points = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["domain", "points", "label"]

    def __str__(self):
        return self.label


Skill.is_bridge = property(lambda self: len(self.domain_weights.all()) > 1)
Skill.domain_dict = property(lambda self: {w.domain: w.weight for w in self.domain_weights.all()})
Interest.is_bridge = property(lambda self: len(self.domain_weights.all()) > 1)
Interest.domain_dict = property(lambda self: {w.domain: w.weight for w in self.domain_weights.all()})
