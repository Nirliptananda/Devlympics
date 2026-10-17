from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from profiles.testing import make_profile

from .models import Match
from .recommender import recommend_people


class MatchingTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)
        call_command("seed_projects", verbosity=0)

        # A: software developer who has dabbled in Embedded C and likes IoT
        cls.a = make_profile(
            "alice",
            skills={"Python": 2, "Django": 2, "SQL": 2, "Embedded C": 1},
            experiences=["Software internship"],
            interests=["IoT", "Web Apps"],
        )
        # B: hardware developer who writes some Python and likes IoT
        cls.b = make_profile(
            "bob",
            skills={"Soldering": 2, "Arduino": 3, "Embedded C": 2, "IoT Development": 2, "Python": 1},
            experiences=["Built a robot or drone"],
            interests=["IoT", "Drones"],
        )
        # C: another software developer
        cls.c = make_profile(
            "carol",
            skills={"Python": 2, "Django": 2, "JavaScript": 2},
            experiences=["Software internship"],
            interests=["Web Apps"],
        )
        # D: administration, nothing in common with A
        cls.d = make_profile(
            "dave",
            skills={"Budgeting": 1},
            experiences=["Organized a college event"],
            interests=["Startups"],
        )


class RecommenderTests(MatchingTestBase):
    def test_categories_are_as_expected(self):
        self.assertEqual((self.a.primary_domain, self.a.level), ("sw", 2))
        self.assertEqual((self.b.primary_domain, self.b.level), ("hw", 2))
        self.assertEqual(self.d.primary_domain, "admin")

    def test_similar_ranks_above_complementary(self):
        results = recommend_people(self.a)
        names = [r["profile"]["display_name"] for r in results]
        self.assertEqual(names, ["carol", "bob"])
        self.assertEqual(results[0]["mode"], "similar")
        self.assertEqual(results[1]["mode"], "complementary")

    def test_cross_domain_pair_is_linked_by_bridge_skill_and_interest(self):
        bob = next(r for r in recommend_people(self.a) if r["profile"]["display_name"] == "bob")
        self.assertIn("Embedded C", bob["overlap"]["shared_bridge_skills"])
        self.assertIn("IoT", bob["overlap"]["shared_interests"])
        self.assertEqual(bob["overlap"]["shared_domains"], [])

    def test_unrelated_person_not_recommended(self):
        names = [r["profile"]["display_name"] for r in recommend_people(self.a)]
        self.assertNotIn("dave", names)

    def test_mode_filter(self):
        only_comp = recommend_people(self.a, mode="complementary")
        self.assertEqual([r["profile"]["display_name"] for r in only_comp], ["bob"])
        only_sim = recommend_people(self.a, mode="similar")
        self.assertEqual([r["profile"]["display_name"] for r in only_sim], ["carol"])

    def test_level_window_excludes_far_levels(self):
        expert = make_profile(
            "expert",
            skills={"Python": 3, "Django": 3, "SQL": 3, "REST APIs": 3, "Docker": 3, "Git": 3, "Linux": 3},
            experiences=["Software internship", "Shipped an app to real users"],
            interests=["Web Apps"],
        )
        self.assertEqual(expert.level, 3)
        beginner = make_profile("beginner", skills={"Python": 1}, experiences=["Built a personal software project"])
        self.assertEqual(beginner.level, 1)
        names = [r["profile"]["display_name"] for r in recommend_people(beginner)]
        self.assertNotIn("expert", names)


class SwipeAndMatchApiTests(MatchingTestBase):
    def client_for(self, profile):
        from rest_framework.authtoken.models import Token

        token, _ = Token.objects.get_or_create(user=profile.user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        return client

    def test_discover_endpoint(self):
        res = self.client_for(self.a).get("/api/discover/people/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["results"]), 2)
        self.assertEqual(self.client_for(self.a).get("/api/discover/people/?mode=nope").status_code, 400)

    def test_incomplete_profile_cannot_discover(self):
        newbie = make_profile("blank")
        self.assertEqual(self.client_for(newbie).get("/api/discover/people/").status_code, 400)

    def test_mutual_like_creates_one_match(self):
        a, b = self.client_for(self.a), self.client_for(self.b)
        first = a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "like"}, format="json").json()
        self.assertFalse(first["matched"])
        second = b.post("/api/swipes/", {"to_profile": self.a.id, "direction": "like"}, format="json").json()
        self.assertTrue(second["matched"])
        self.assertEqual(Match.objects.count(), 1)

    def test_pass_never_matches(self):
        a, b = self.client_for(self.a), self.client_for(self.b)
        a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "like"}, format="json")
        res = b.post("/api/swipes/", {"to_profile": self.a.id, "direction": "pass"}, format="json").json()
        self.assertFalse(res["matched"])
        self.assertEqual(Match.objects.count(), 0)

    def test_duplicate_and_self_swipes_rejected(self):
        a = self.client_for(self.a)
        self.assertEqual(a.post("/api/swipes/", {"to_profile": self.a.id, "direction": "like"}, format="json").status_code, 400)
        a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "pass"}, format="json")
        self.assertEqual(a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "like"}, format="json").status_code, 409)

    def test_swiped_people_disappear_from_discover(self):
        a = self.client_for(self.a)
        a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "pass"}, format="json")
        names = [r["profile"]["display_name"] for r in a.get("/api/discover/people/").json()["results"]]
        self.assertNotIn("bob", names)

    def test_match_projects_cater_to_both_domains(self):
        a, b = self.client_for(self.a), self.client_for(self.b)
        a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "like"}, format="json")
        match_id = b.post("/api/swipes/", {"to_profile": self.a.id, "direction": "like"}, format="json").json()["match_id"]

        from_a = a.get(f"/api/matches/{match_id}/projects/").json()["results"]
        from_b = b.get(f"/api/matches/{match_id}/projects/").json()["results"]

        # Both people see the same projects in the same order
        self.assertEqual([p["id"] for p in from_a], [p["id"] for p in from_b])
        self.assertTrue(from_a)
        # The top project spans software and hardware
        self.assertTrue(from_a[0]["spans_both_domains"])
        self.assertTrue(from_a[0]["is_cross_domain"])

    def test_outsider_cannot_open_match_projects(self):
        a, b = self.client_for(self.a), self.client_for(self.b)
        a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "like"}, format="json")
        match_id = b.post("/api/swipes/", {"to_profile": self.a.id, "direction": "like"}, format="json").json()["match_id"]
        self.assertEqual(self.client_for(self.c).get(f"/api/matches/{match_id}/projects/").status_code, 404)

    def test_match_list_includes_overlap(self):
        a, b = self.client_for(self.a), self.client_for(self.b)
        a.post("/api/swipes/", {"to_profile": self.b.id, "direction": "like"}, format="json")
        b.post("/api/swipes/", {"to_profile": self.a.id, "direction": "like"}, format="json")
        results = a.get("/api/matches/").json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["with"]["display_name"], "bob")
        self.assertIn("Embedded C", results[0]["overlap"]["shared_bridge_skills"])
