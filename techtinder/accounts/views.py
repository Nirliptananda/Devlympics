from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from profiles.models import Profile
from profiles.serializers import ProfileSerializer, RegisterSerializer

User = get_user_model()

#A class to use @transaction.atomic to ensure that user and profile are created in a single transaction as @transaction commits either everything or nothing
class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, profile = serializer.create_user_and_profile()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": {"id": user.id, "email": user.email}, "profile": ProfileSerializer(profile).data},
            status=status.HTTP_201_CREATED,
        )

#The view on the Login screen
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user is None or not user.check_password(password):
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        profile, _ = Profile.objects.get_or_create(user=user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": {"id": user.id, "email": user.email}, "profile": ProfileSerializer(profile).data})

#The view on the Logout screen
class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

#The view when the user is logged in and wants to see their profile
class MeView(APIView):
    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response({"user": {"id": request.user.id, "email": request.user.email}, "profile": ProfileSerializer(profile).data})
