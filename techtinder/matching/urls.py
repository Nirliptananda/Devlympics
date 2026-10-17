from django.urls import path

from .views import DiscoverPeopleView, MatchListView, MatchProjectsView, SwipeView

urlpatterns = [
    path("discover/people/", DiscoverPeopleView.as_view(), name="discover-people"),
    path("swipes/", SwipeView.as_view(), name="swipe"),
    path("matches/", MatchListView.as_view(), name="matches"),
    path("matches/<int:match_id>/projects/", MatchProjectsView.as_view(), name="match-projects"),
]
