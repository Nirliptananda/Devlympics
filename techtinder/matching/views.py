from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from profiles.models import Profile
from profiles.payloads import profile_summary
from projects.services import recommend_projects_for_pair

from .models import Match, Swipe
from .recommender import build_overlap, load_snapshot, recommend_people
from .serializers import SwipeInputSerializer


def _my_complete_profile(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    return profile if profile.is_complete else None


INCOMPLETE = {"detail": "Complete your profile first."}


class DiscoverPeopleView(APIView):
    """GET /api/discover/people/?mode=both|similar|complementary&limit=20"""

    def get(self, request):
        profile = _my_complete_profile(request)
        if profile is None:
            return Response(INCOMPLETE, status=400)
        mode = request.query_params.get("mode", "both")
        if mode not in ("both", "similar", "complementary"):
            return Response({"detail": "mode must be both, similar or complementary."}, status=400)
        limit = min(int(request.query_params.get("limit", 20)), 50)
        return Response({"results": recommend_people(profile, mode, limit)})


class SwipeView(APIView):
    """POST /api/swipes/ {"to_profile": <id>, "direction": "like"|"pass"}"""

    @transaction.atomic
    def post(self, request):
        me = _my_complete_profile(request)
        if me is None:
            return Response(INCOMPLETE, status=400)

        serializer = SwipeInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other = serializer.validated_data["to_profile"]
        direction = serializer.validated_data["direction"]

        if other.pk == me.pk:
            return Response({"detail": "You cannot swipe on yourself."}, status=400)

        _, created = Swipe.objects.get_or_create(
            from_profile=me, to_profile=other, defaults={"direction": direction}
        )
        if not created:
            return Response({"detail": "You already swiped on this person."}, status=409)

        match = None
        if direction == Swipe.Direction.LIKE and Swipe.objects.filter(
            from_profile=other, to_profile=me, direction=Swipe.Direction.LIKE
        ).exists():
            match = Match.for_pair(me, other)

        return Response({"matched": match is not None, "match_id": match.id if match else None})


class MatchListView(APIView):
    """GET /api/matches/ with the overlap between you and each match."""

    def get(self, request):
        me = _my_complete_profile(request)
        if me is None:
            return Response(INCOMPLETE, status=400)
        my_snap = load_snapshot(me)
        matches = (
            Match.objects.filter(Q(profile_a=me) | Q(profile_b=me))
            .select_related("profile_a__user", "profile_b__user")
            .order_by("-created_at")
        )
        results = []
        for match in matches:
            other = match.other(me)
            results.append(
                {
                    "match_id": match.id,
                    "created_at": match.created_at,
                    "with": profile_summary(other),
                    "overlap": build_overlap(my_snap, load_snapshot(other)),
                }
            )
        return Response({"results": results})


class MatchProjectsView(APIView):
    """GET /api/matches/<id>/projects/ - the shared project feed for a matched pair."""

    def get(self, request, match_id):
        me = _my_complete_profile(request)
        if me is None:
            return Response(INCOMPLETE, status=400)
        match = get_object_or_404(Match, pk=match_id)
        if not match.includes(me):
            return Response({"detail": "Not found."}, status=404)
        other = match.other(me)
        limit = min(int(request.query_params.get("limit", 10)), 50)
        return Response(
            {"with": profile_summary(other), "results": recommend_projects_for_pair(me, other, limit)}
        )
