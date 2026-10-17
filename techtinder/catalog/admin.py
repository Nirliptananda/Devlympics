from django.contrib import admin

from .models import (
    ExperienceOption,
    Interest,
    InterestDomainWeight,
    Skill,
    SkillDomainWeight,
)


class SkillWeightInline(admin.TabularInline):
    model = SkillDomainWeight
    extra = 0


class InterestWeightInline(admin.TabularInline):
    model = InterestDomainWeight
    extra = 0


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    inlines = [SkillWeightInline]
    search_fields = ["name"]


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    inlines = [InterestWeightInline]
    search_fields = ["name"]


@admin.register(ExperienceOption)
class ExperienceOptionAdmin(admin.ModelAdmin):
    list_display = ["label", "domain", "points"]
    list_filter = ["domain"]
