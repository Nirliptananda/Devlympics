from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Opportunity


class OpportunityListView(APIView):
    def get(self, request):
        queryset = Opportunity.objects.filter(is_active=True)
        opportunity_type = request.query_params.get("type")
        source = request.query_params.get("source")
        skill = request.query_params.get("skill")
        search = (request.query_params.get("search") or "").strip()

        if opportunity_type:
            queryset = queryset.filter(type=opportunity_type)
        if source:
            queryset = queryset.filter(source__icontains=source)
        if skill:
            queryset = queryset.filter(required_skills__name__icontains=skill).distinct()
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset.order_by("-deadline", "-created_at"), request, view=self)
        if page is not None:
            return paginator.get_paginated_response([
                self.serialize(item) for item in page
            ])
        return Response([self.serialize(item) for item in queryset])

    @staticmethod
    def serialize(obj):
        return {
            "id": obj.id,
            "title": obj.title,
            "type": obj.type,
            "source": obj.source,
            "organizer": obj.organizer,
            "url": obj.url,
            "description": obj.description,
            "prize": obj.prize,
            "mode": obj.mode,
            "deadline": obj.deadline.isoformat() if obj.deadline else None,
            "image_url": obj.image_url,
            "required_skills": [skill.name for skill in obj.required_skills.order_by("name")],
            "created_at": obj.created_at.isoformat().replace("+00:00", "Z"),
        }


class OpportunityDetailView(APIView):
    def get(self, request, opportunity_id):
        obj = Opportunity.objects.filter(pk=opportunity_id, is_active=True).first()
        if obj is None:
            return Response({"detail": "Not found."}, status=404)
        return Response(OpportunityListView.serialize(obj))
