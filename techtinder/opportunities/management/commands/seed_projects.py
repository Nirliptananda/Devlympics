import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Skill
from opportunities.models import Opportunity, Project, ProjectSkill

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "projects.json"


class Command(BaseCommand):
    help = "Load sample opportunities and legacy project records (run seed_catalog first)."

    @transaction.atomic
    def handle(self, *args, **options):
        for row in json.loads(DATA_FILE.read_text()):
            skill_names = []
            for name in row["skills"]:
                try:
                    skill = Skill.objects.get(name=name)
                except Skill.DoesNotExist:
                    raise CommandError(f"Project '{row['title']}': unknown skill '{name}'. Run seed_catalog first.")
                skill_names.append(skill)

            opportunity, _ = Opportunity.objects.update_or_create(
                title=row["title"],
                defaults={
                    "type": "project",
                    "source": "seed_demo",
                    "organizer": "Sparkmatch Demo",
                    "url": "",
                    "description": row["description"],
                    "prize": "",
                    "mode": "online",
                    "deadline": None,
                    "image_url": "",
                    "is_active": True,
                },
            )
            opportunity.required_skills.set(skill_names)

            project, _ = Project.objects.update_or_create(
                title=row["title"],
                defaults={
                    "description": row["description"],
                    "min_level": row["levels"][0],
                    "max_level": row["levels"][1],
                },
            )
            project.project_skills.all().delete()
            for skill in skill_names:
                ProjectSkill.objects.create(project=project, skill=skill)
        self.stdout.write(self.style.SUCCESS(f"Projects ready: {Project.objects.count()} legacy projects and {Opportunity.objects.count()} opportunities."))
