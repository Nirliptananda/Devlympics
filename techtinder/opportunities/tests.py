from django.core.management import call_command
from django.test import TestCase

from profiles.testing import make_profile

from .models import Project
from .services import level_fit, recommend_projects


class ProjectTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)
        call_command("seed_projects", verbosity=0)

    def test_domain_vector_sums_to_one(self):
        for project in Project.objects.prefetch_related("project_skills__skill__domain_weights"):
            self.assertAlmostEqual(sum(project.domain_vector().values()), 1.0)

    def test_cross_domain_flag(self):
        dashboard = Project.objects.get(title="IoT Sensor Dashboard")
        toolkit = Project.objects.get(title="Open Source Dev Toolkit")
        self.assertTrue(dashboard.is_cross_domain)
        self.assertFalse(toolkit.is_cross_domain)

    def test_level_fit(self):
        p = Project(min_level=2, max_level=2)
        self.assertEqual(level_fit(2, p), 1.0)
        self.assertEqual(level_fit(1, p), 0.5)
        self.assertEqual(level_fit(3, p), 0.5)
        self.assertEqual(level_fit(None, p), 0.0)
        self.assertEqual(level_fit(1, Project(min_level=3, max_level=3)), 0.0)

    def test_recommendations_respect_domain_and_report_missing_skills(self):
        dev = make_profile(
            "dev",
            skills={"Python": 2, "Django": 2, "SQL": 2, "Git": 2},
            experiences=["Software internship"],
        )
        results = recommend_projects(dev)
        self.assertTrue(results)
        titles = [r["title"] for r in results]
        # A pure software person should see the software toolkit, and not the hardware launch kit first
        self.assertIn("Open Source Dev Toolkit", titles)
        self.assertEqual(titles[0], "Open Source Dev Toolkit")
        top = results[0]
        self.assertEqual(set(top["you_have"]) | set(top["you_need"]), set(top["required_skills"]))
