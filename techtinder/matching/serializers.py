from rest_framework import serializers

from profiles.models import Profile

from .models import Swipe


class SwipeInputSerializer(serializers.Serializer):
    to_profile = serializers.PrimaryKeyRelatedField(queryset=Profile.objects.exclude(primary_domain=""))
    direction = serializers.ChoiceField(choices=Swipe.Direction.values)
