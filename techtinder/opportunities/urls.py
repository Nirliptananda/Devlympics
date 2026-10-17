from django.urls import path

from .views import OpportunityDetailView, OpportunityListView

urlpatterns = [
    path("", OpportunityListView.as_view(), name="opportunity-list"),
    path("<int:opportunity_id>/", OpportunityDetailView.as_view(), name="opportunity-detail"),
]
