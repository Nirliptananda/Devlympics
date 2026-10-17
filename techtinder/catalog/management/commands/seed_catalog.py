import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify
#These models are used to manage the skills, interests, and experience options in the catalog. They define the structure and relationships of these entities within the application.
from catalog.models import (
    DOMAIN_CODES,
    ExperienceOption,
    Interest,
    InterestDomainWeight,
    Skill,
    SkillDomainWeight,
)

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "catalog.json"

#This function checks the weights of skills and interests to ensure they sum to 1 and that the domain codes are valid. It raises a CommandError if the weights are invalid or if an unknown domain code is encountered.
def _check_weights(kind, name, weights):
    if not weights or abs(sum(weights.values()) - 1.0) > 1e-6:
        raise CommandError(f"{kind} '{name}': weights must sum to 1 (got {weights})")
    for code in weights:
        if code not in DOMAIN_CODES:
            raise CommandError(f"{kind} '{name}': unknown domain '{code}'")


class Command(BaseCommand):
    help = "Load (or refresh) the pre-generated skills, interests and experience options."

    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads(DATA_FILE.read_text())

        for row in data["skills"]:
            _check_weights("Skill", row["name"], row["weights"])
            slug = slugify(row["name"]) or row["name"]
            skill, _ = Skill.objects.update_or_create(
                slug=slug,
                defaults={"name": row["name"], "category": ""},
            )
            skill.domain_weights.all().delete()
            SkillDomainWeight.objects.bulk_create(
                SkillDomainWeight(skill=skill, domain=d, weight=w) for d, w in row["weights"].items()
            )

        for row in data["interests"]:
            _check_weights("Interest", row["name"], row["weights"])
            slug = slugify(row["name"]) or row["name"]
            interest, _ = Interest.objects.update_or_create(
                slug=slug,
                defaults={"name": row["name"]},
            )
            interest.domain_weights.all().delete()
            InterestDomainWeight.objects.bulk_create(
                InterestDomainWeight(interest=interest, domain=d, weight=w)
                for d, w in row["weights"].items()
            )

        for row in data["experiences"]:
            if row["domain"] not in DOMAIN_CODES:
                raise CommandError(f"Experience '{row['label']}': unknown domain")
            ExperienceOption.objects.update_or_create(
                label=row["label"], defaults={"domain": row["domain"], "points": row["points"]}
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog ready: {Skill.objects.count()} skills, "
                f"{Interest.objects.count()} interests, {ExperienceOption.objects.count()} experiences."
            )
        )
