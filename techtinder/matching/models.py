from django.db import models

from profiles.models import Profile


class Swipe(models.Model):
    class Direction(models.TextChoices):
        LIKE = "like", "Like"
        PASS = "pass", "Pass"

    from_profile = models.ForeignKey(Profile, related_name="swipes_made", on_delete=models.CASCADE)
    to_profile = models.ForeignKey(Profile, related_name="swipes_received", on_delete=models.CASCADE)
    direction = models.CharField(max_length=4, choices=Direction.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_profile", "to_profile")


class Match(models.Model):
    """One row per pair. profile_a always has the smaller id, so the pair is unique."""

    profile_a = models.ForeignKey(Profile, related_name="matches_as_a", on_delete=models.CASCADE)
    profile_b = models.ForeignKey(Profile, related_name="matches_as_b", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("profile_a", "profile_b")

    @classmethod
    def for_pair(cls, p1, p2):
        a, b = sorted([p1, p2], key=lambda p: p.id)
        match, _ = cls.objects.get_or_create(profile_a=a, profile_b=b)
        return match

    def other(self, profile):
        return self.profile_b if self.profile_a_id == profile.id else self.profile_a

    def includes(self, profile):
        return profile.id in (self.profile_a_id, self.profile_b_id)
