import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Skill
from projects.models import Project, ProjectSkill

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "projects.json"


class Command(BaseCommand):
    help = "Load sample projects (run seed_catalog first)."

    @transaction.atomic
    def handle(self, *args, **options):
        for row in json.loads(DATA_FILE.read_text()):
            project, _ = Project.objects.update_or_create(
                title=row["title"],
                defaults={
                    "description": row["description"],
                    "min_level": row["levels"][0],
                    "max_level": row["levels"][1],
                },
            )
            project.project_skills.all().delete()
            for name in row["skills"]:
                try:
                    skill = Skill.objects.get(name=name)
                except Skill.DoesNotExist:
                    raise CommandError(f"Project '{row['title']}': unknown skill '{name}'. Run seed_catalog first.")
                ProjectSkill.objects.create(project=project, skill=skill)
        self.stdout.write(self.style.SUCCESS(f"Projects ready: {Project.objects.count()}."))
