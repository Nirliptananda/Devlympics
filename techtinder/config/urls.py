from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/v1/meta/", include("catalog.urls")),
    path("api/meta/", include("catalog.urls")),
    path("api/v1/skills/", include("catalog.skill_urls")),
    path("api/skills/", include("catalog.skill_urls")),
    path("api/v1/interests/", include("catalog.interest_urls")),
    path("api/interests/", include("catalog.interest_urls")),
    path("api/v1/profiles/", include("profiles.urls")),
    path("api/profiles/", include("profiles.urls")),
    path("api/v1/recommendations/", include("recommendations.urls")),
    path("api/recommendations/", include("recommendations.urls")),
    path("api/v1/opportunities/", include("opportunities.urls")),
    path("api/opportunities/", include("opportunities.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("demo/", TemplateView.as_view(template_name="demo.html")),
]
