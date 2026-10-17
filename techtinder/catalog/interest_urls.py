from django.urls import path

from .views import InterestsLookupView

urlpatterns = [
    path("", InterestsLookupView.as_view(), name="interests-list"),
]
