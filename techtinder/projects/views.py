from rest_framework.response import Response
from rest_framework.views import APIView

from profiles.models import Profile

from .services import recommend_projects


class DiscoverProjectsView(APIView):
    """Projects ranked for the current user (level fit, domain fit, skill coverage)."""

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if not profile.is_complete:
            return Response({"detail": "Complete your profile first."}, status=400)
        limit = min(int(request.query_params.get("limit", 10)), 50)
        return Response({"results": recommend_projects(profile, limit)})
