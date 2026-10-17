from django.urls import path

from .views import CatalogView, InterestsLookupView, MetaDisciplinesView, MetaExperienceLevelsView, SkillsLookupView

urlpatterns = [
    path("disciplines/", MetaDisciplinesView.as_view(), name="meta-disciplines"),
    path("experience-levels/", MetaExperienceLevelsView.as_view(), name="meta-experience-levels"),
    path("", CatalogView.as_view(), name="catalog"),
]
