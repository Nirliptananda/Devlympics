from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from profiles.testing import make_profile

DEMO_PASSWORD = "demo12345"

DEMO_USERS = {
    "alice": dict(
        skills={"Python": 2, "Django": 2, "SQL": 2, "Embedded C": 1},
        experiences=["Software internship"],
        interests=["IoT", "Web Apps"],
    ),
    "bob": dict(
        skills={"Soldering": 2, "Arduino": 3, "Embedded C": 2, "IoT Development": 2, "Python": 1},
        experiences=["Built a robot or drone"],
        interests=["IoT", "Drones"],
    ),
    "carol": dict(
        skills={"Python": 2, "Django": 2, "JavaScript": 2},
        experiences=["Software internship"],
        interests=["Web Apps"],
    ),
    "dave": dict(
        skills={"Budgeting": 1, "Project Management": 2},
        experiences=["Organized a college event"],
        interests=["Startups"],
    ),
}


class Command(BaseCommand):
    help = "Create demo users (password: demo12345). Run seed_catalog and seed_projects first."

    def handle(self, *args, **options):
        User = get_user_model()
        for username, spec in DEMO_USERS.items():
            User.objects.filter(username=username).delete()
            make_profile(username, **spec)
        for username in DEMO_USERS:
            user = User.objects.get(username=username)
            user.set_password(DEMO_PASSWORD)
            user.save()
        self.stdout.write(self.style.SUCCESS(f"Demo users ready: {', '.join(DEMO_USERS)} (password {DEMO_PASSWORD})"))
