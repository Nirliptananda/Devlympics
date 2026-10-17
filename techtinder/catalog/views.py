from django.db.models import Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import DISCIPLINES, EXPERIENCE_LEVELS, Interest, Skill


class MetaDisciplinesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response([{"value": value, "label": label} for value, label in DISCIPLINES])


class MetaExperienceLevelsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response([{"value": value, "label": label} for value, label in EXPERIENCE_LEVELS])


class SkillsLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        limit = min(int(request.query_params.get("limit", 10) or 10), 50)
        queryset = Skill.objects.all()
        if search:
            queryset = queryset.filter(name__icontains=search)
        return Response([
            {"id": skill.id, "name": skill.name, "category": skill.category or ""}
            for skill in queryset[:limit]
        ])


class InterestsLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        limit = min(int(request.query_params.get("limit", 10) or 10), 50)
        queryset = Interest.objects.all()
        if search:
            queryset = queryset.filter(name__icontains=search)
        return Response([{"id": interest.id, "name": interest.name} for interest in queryset[:limit]])


class CatalogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "disciplines": [{"value": value, "label": label} for value, label in DISCIPLINES],
            "experience_levels": [{"value": value, "label": label} for value, label in EXPERIENCE_LEVELS],
            "skills": [{"id": skill.id, "name": skill.name, "category": skill.category or ""} for skill in Skill.objects.all()[:50]],
            "interests": [{"id": interest.id, "name": interest.name} for interest in Interest.objects.all()[:50]],
        })
