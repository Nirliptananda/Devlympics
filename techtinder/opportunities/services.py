from django.db.models import Q

from .models import Opportunity


def filter_opportunities(*, opportunity_type=None, source=None, skill=None, search=None):
    queryset = Opportunity.objects.filter(is_active=True)
    if opportunity_type:
        queryset = queryset.filter(type=opportunity_type)
    if source:
        queryset = queryset.filter(source__icontains=source)
    if skill:
        queryset = queryset.filter(required_skills__name__icontains=skill).distinct()
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
    return queryset.order_by("-deadline", "-created_at")
