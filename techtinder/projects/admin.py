from django.contrib import admin

from .models import Project, ProjectSkill


class ProjectSkillInline(admin.TabularInline):
    model = ProjectSkill
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "min_level", "max_level"]
    inlines = [ProjectSkillInline]
