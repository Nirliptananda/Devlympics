from django.urls import path

from .views import (
    PairOpportunityRecommendationsView,
    RecommendationsOpportunitiesView,
    RecommendationsProfilesView,
)

urlpatterns = [
    path("profiles/", RecommendationsProfilesView.as_view(), name="recommend-profiles"),
    path("opportunities/", RecommendationsOpportunitiesView.as_view(), name="recommend-opportunities"),
    path("pair/<int:profile_id>/opportunities/", PairOpportunityRecommendationsView.as_view(), name="pair-opportunities"),
]
