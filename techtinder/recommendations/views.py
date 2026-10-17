from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from opportunities.models import Opportunity
from profiles.models import Profile
from profiles.serializers import ProfileSummarySerializer
from profiles.serializers import OpportunitySerializer

from .services import score_opportunity_match, score_pair_opportunity, score_profile_match


class RecommendationsProfilesView(APIView):
    def get(self, request):
        user_profile = get_object_or_404(Profile, user=request.user)
        discipline = request.query_params.get("discipline")
        candidates = []

        profiles = Profile.objects.exclude(user=request.user)
        if discipline:
            profiles = profiles.filter(discipline=discipline)

        for profile in profiles:
            match = score_profile_match(user_profile, profile)
            if match is None:
                continue
            payload = {
                "profile": ProfileSummarySerializer(profile).data,
                **match,
            }
            candidates.append(payload)

        candidates.sort(key=lambda item: item["match_score"], reverse=True)
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(candidates, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response(candidates)


class RecommendationsOpportunitiesView(APIView):
    def get(self, request):
        user_profile = get_object_or_404(Profile, user=request.user)
        opportunity_type = request.query_params.get("type")
        opportunities = Opportunity.objects.filter(is_active=True)
        if opportunity_type:
            opportunities = opportunities.filter(type=opportunity_type)

        results = []
        for opportunity in opportunities:
            match = score_opportunity_match(user_profile, opportunity)
            if match is None:
                continue
            results.append({"opportunity": OpportunitySerializer(opportunity).data, **match})

        results.sort(key=lambda item: (-item["match_score"], item["opportunity"]["deadline"] or "9999-12-31"))
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(results, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response(results)


class PairOpportunityRecommendationsView(APIView):
    def get(self, request, profile_id):
        user_profile = get_object_or_404(Profile, user=request.user)
        if profile_id == user_profile.id:
            return Response({"detail": "Cannot compare a profile with itself."}, status=400)

        other_profile = get_object_or_404(Profile, pk=profile_id)
        opportunities = Opportunity.objects.filter(is_active=True)
        results = []

        for opportunity in opportunities:
            match = score_pair_opportunity(user_profile, other_profile, opportunity)
            if match is None:
                continue
            results.append({"opportunity": OpportunitySerializer(opportunity).data, **match})

        results.sort(key=lambda item: (-item["match_score"], item["opportunity"]["deadline"] or "9999-12-31"))
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(results, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response(results)
