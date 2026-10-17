from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from catalog.models import DISCIPLINES, EXPERIENCE_LEVELS, Interest, Skill
from profiles.models import PastProject, Profile

User = get_user_model()


class PastProjectSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=150)
    description = serializers.CharField()
    link = serializers.URLField(required=False, allow_blank=True, default="")


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()
    past_projects = serializers.SerializerMethodField()
    discipline_label = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "email",
            "full_name",
            "discipline",
            "discipline_label",
            "experience_level",
            "bio",
            "experience_summary",
            "skills",
            "interests",
            "past_projects",
            "github_url",
            "linkedin_url",
            "created_at",
        ]
        read_only_fields = fields

    def get_email(self, obj):
        return obj.user.email

    def get_skills(self, obj):
        return [skill.name for skill in obj.skills.order_by("name")]

    def get_interests(self, obj):
        return [interest.name for interest in obj.interests.order_by("name")]

    def get_past_projects(self, obj):
        return [
            {"id": item.id, "title": item.title, "description": item.description, "link": item.link}
            for item in obj.past_projects.all()
        ]

    def get_discipline_label(self, obj):
        return dict(DISCIPLINES).get(obj.discipline, obj.discipline)


class ProfileSummarySerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()
    discipline_label = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "email",
            "full_name",
            "discipline",
            "discipline_label",
            "experience_level",
            "bio",
            "skills",
            "interests",
        ]
        read_only_fields = fields

    def get_email(self, obj):
        return obj.user.email

    def get_skills(self, obj):
        return [skill.name for skill in obj.skills.order_by("name")]

    def get_interests(self, obj):
        return [interest.name for interest in obj.interests.order_by("name")]

    def get_discipline_label(self, obj):
        return dict(DISCIPLINES).get(obj.discipline, obj.discipline)


class OpportunitySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    type = serializers.CharField(read_only=True)
    source = serializers.CharField(read_only=True)
    organizer = serializers.CharField(read_only=True)
    url = serializers.URLField(read_only=True)
    description = serializers.CharField(read_only=True)
    prize = serializers.CharField(read_only=True)
    mode = serializers.CharField(read_only=True)
    deadline = serializers.DateField(read_only=True, allow_null=True)
    image_url = serializers.URLField(read_only=True, allow_blank=True)
    required_skills = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    def get_required_skills(self, obj):
        return [skill.name for skill in obj.required_skills.order_by("name")]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=120)
    discipline = serializers.ChoiceField(choices=DISCIPLINES)
    experience_level = serializers.ChoiceField(choices=EXPERIENCE_LEVELS)
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    experience_summary = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField(trim_whitespace=True), min_length=2)
    interests = serializers.ListField(child=serializers.CharField(trim_whitespace=True), min_length=1)
    past_projects = serializers.ListField(child=PastProjectSerializer(), required=False, default=list)
    github_url = serializers.URLField(required=False, allow_blank=True, default="")
    linkedin_url = serializers.URLField(required=False, allow_blank=True, default="")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_skills(self, value):
        cleaned = []
        for item in value:
            item = (item or "").strip()
            if item:
                cleaned.append(item)
        if len(cleaned) < 2:
            raise serializers.ValidationError("Please provide at least 2 skills.")
        if len(set(item.lower() for item in cleaned)) != len(cleaned):
            raise serializers.ValidationError("Skills must be unique.")
        return cleaned

    def validate_interests(self, value):
        cleaned = []
        for item in value:
            item = (item or "").strip()
            if item:
                cleaned.append(item)
        if len(cleaned) < 1:
            raise serializers.ValidationError("Please provide at least 1 interest.")
        if len(set(item.lower() for item in cleaned)) != len(cleaned):
            raise serializers.ValidationError("Interests must be unique.")
        return cleaned

    def create_user_and_profile(self):
        validated = self.validated_data
        user = User.objects.create_user(
            username=validated["email"],
            email=validated["email"],
            password=validated["password"],
        )
        profile = Profile.objects.create(
            user=user,
            full_name=validated["full_name"],
            discipline=validated["discipline"],
            experience_level=validated["experience_level"],
            bio=validated.get("bio", ""),
            experience_summary=validated["experience_summary"],
            github_url=validated.get("github_url", ""),
            linkedin_url=validated.get("linkedin_url", ""),
        )
        for skill_name in validated["skills"]:
            skill = Skill.ensure(skill_name, category=profile.discipline)
            if skill is not None:
                profile.skills.add(skill)
        for interest_name in validated["interests"]:
            interest = Interest.ensure(interest_name)
            if interest is not None:
                profile.interests.add(interest)
        for project_data in validated.get("past_projects", []):
            PastProject.objects.create(
                profile=profile,
                title=project_data["title"],
                description=project_data["description"],
                link=project_data.get("link", ""),
            )
        return user, profile


class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120, required=False)
    discipline = serializers.ChoiceField(choices=DISCIPLINES, required=False)
    experience_level = serializers.ChoiceField(choices=EXPERIENCE_LEVELS, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    experience_summary = serializers.CharField(required=False, allow_blank=False)
    skills = serializers.ListField(child=serializers.CharField(trim_whitespace=True), required=False)
    interests = serializers.ListField(child=serializers.CharField(trim_whitespace=True), required=False)
    past_projects = serializers.ListField(child=PastProjectSerializer(), required=False)
    github_url = serializers.URLField(required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)

    def validate_skills(self, value):
        cleaned = []
        for item in value:
            item = (item or "").strip()
            if item:
                cleaned.append(item)
        if not cleaned:
            return []
        if len(set(item.lower() for item in cleaned)) != len(cleaned):
            raise serializers.ValidationError("Skills must be unique.")
        return cleaned

    def validate_interests(self, value):
        cleaned = []
        for item in value:
            item = (item or "").strip()
            if item:
                cleaned.append(item)
        if not cleaned:
            return []
        if len(set(item.lower() for item in cleaned)) != len(cleaned):
            raise serializers.ValidationError("Interests must be unique.")
        return cleaned

    def save(self, profile):
        data = self.validated_data
        for field in ["full_name", "discipline", "experience_level", "bio", "experience_summary", "github_url", "linkedin_url"]:
            if field in data:
                setattr(profile, field, data[field])

        if "skills" in data:
            profile.skills.clear()
            for skill_name in data["skills"]:
                skill = Skill.ensure(skill_name, category=profile.discipline)
                if skill is not None:
                    profile.skills.add(skill)

        if "interests" in data:
            profile.interests.clear()
            for interest_name in data["interests"]:
                interest = Interest.ensure(interest_name)
                if interest is not None:
                    profile.interests.add(interest)

        if "past_projects" in data:
            profile.past_projects.all().delete()
            for project_data in data["past_projects"]:
                PastProject.objects.create(
                    profile=profile,
                    title=project_data["title"],
                    description=project_data["description"],
                    link=project_data.get("link", ""),
                )

        profile.save()
        return profile
