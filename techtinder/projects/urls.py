from django.urls import path

from .views import DiscoverProjectsView

urlpatterns = [path("discover/projects/", DiscoverProjectsView.as_view(), name="discover-projects")]
