from django.contrib import admin

from .models import Opportunity


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ["title", "type", "source", "is_active", "deadline"]
    list_filter = ["type", "source", "is_active"]
    search_fields = ["title", "description", "organizer"]
