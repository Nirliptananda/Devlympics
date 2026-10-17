from django.contrib import admin

from .models import PastProject, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["full_name", "discipline", "experience_level", "created_at"]
    list_filter = ["discipline", "experience_level"]
    search_fields = ["full_name", "user__email"]
    readonly_fields = ["created_at"]


@admin.register(PastProject)
class PastProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "profile", "link"]
    search_fields = ["title", "profile__full_name"]
