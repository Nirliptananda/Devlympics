from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Skill

from .models import Profile
from .testing import make_profile


class CatalogSeedTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def test_weights_sum_to_one_and_bridges_exist(self):
        for skill in Skill.objects.prefetch_related("domain_weights"):
            self.assertAlmostEqual(sum(skill.domain_dict.values()), 1.0)
        self.assertTrue(Skill.objects.get(name="Embedded C").is_bridge)
        self.assertFalse(Skill.objects.get(name="Python").is_bridge)

    def test_seed_is_idempotent(self):
        before = Skill.objects.count()
        call_command("seed_catalog", verbosity=0)
        self.assertEqual(Skill.objects.count(), before)


class ScoringTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def test_software_person_is_software_intermediate(self):
        p = make_profile(
            "sw", skills={"Python": 2, "Django": 2, "SQL": 2}, experiences=["Software internship"], interests=["Web Apps"]
        )
        self.assertEqual(p.primary_domain, "sw")
        self.assertEqual(p.level, 2)
        self.assertEqual(p.secondary_domains, [])

    def test_beginner_level(self):
        p = make_profile("newbie", skills={"Python": 1}, experiences=["Built a personal software project"])
        self.assertEqual(p.primary_domain, "sw")
        self.assertEqual(p.level, 1)

    def test_secondary_domain_for_mixed_profile(self):
        p = make_profile(
            "mixed",
            skills={"Python": 2, "Django": 2, "Arduino": 2, "Soldering": 2, "Embedded C": 2},
            experiences=["Software internship", "Built a robot or drone"],
            interests=["IoT"],
        )
        self.assertEqual(len(p.secondary_domains), 1)
        self.assertIn({p.primary_domain, *p.secondary_domains}, [{"sw", "hw"}])

    def test_experience_outweighs_skills(self):
        # Equal-sized signals in different domains: experience (0.5) beats skills (0.3).
        p = make_profile(
            "tiebreak",
            skills={"Soldering": 3, "Arduino": 3, "PCB Design": 3},
            experiences=["Software internship", "Shipped an app to real users"],
        )
        self.assertEqual(p.primary_domain, "sw")

    def test_empty_profile_has_no_category(self):
        p = make_profile("empty")
        self.assertEqual(p.primary_domain, "")
        self.assertIsNone(p.level)
        self.assertFalse(p.is_complete)


class ProfileApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def setUp(self):
        self.client = APIClient()
        token = self.client.post(
            "/api/auth/register/", {"username": "aaryan", "password": "longenough1"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_catalog_is_public(self):
        res = APIClient().get("/api/catalog/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual({d["code"] for d in res.json()["domains"]}, {"hw", "sw", "admin"})

    def test_setup_computes_category(self):
        ids = {s.name: s.id for s in Skill.objects.all()}
        res = self.client.put(
            "/api/profile/",
            {"skills": [{"id": ids["Python"], "proficiency": 2}, {"id": ids["Django"], "proficiency": 3}]},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["primary_domain"], "sw")
        self.assertEqual(Profile.objects.get(user__username="aaryan").level, res.json()["level"])

    def test_rejects_unknown_ids_and_empty_input(self):
        self.assertEqual(
            self.client.put("/api/profile/", {"skills": [{"id": 99999, "proficiency": 2}]}, format="json").status_code, 400
        )
        self.assertEqual(self.client.put("/api/profile/", {}, format="json").status_code, 400)

    def test_duplicate_skills_rejected(self):
        sid = Skill.objects.get(name="Python").id
        res = self.client.put(
            "/api/profile/",
            {"skills": [{"id": sid, "proficiency": 1}, {"id": sid, "proficiency": 2}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_auth_required(self):
        self.assertEqual(APIClient().get("/api/profile/").status_code, 401)
