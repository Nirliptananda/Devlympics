from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PastProject, Profile
from .serializers import ProfileSerializer, ProfileSummarySerializer, ProfileUpdateSerializer


class ProfileMeView(APIView):
    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile)
        return Response(ProfileSerializer(profile).data)


class ProfileDetailView(APIView):
    def get(self, request, profile_id):
        profile = get_object_or_404(Profile, pk=profile_id)
        return Response(ProfileSerializer(profile).data)
