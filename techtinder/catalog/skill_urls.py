from django.urls import path

from .views import SkillsLookupView

urlpatterns = [
    path("", SkillsLookupView.as_view(), name="skills-list"),
]
