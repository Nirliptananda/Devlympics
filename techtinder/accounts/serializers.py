from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

#Username is registered as email so only one verification is required, namely of the email.
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
#Validation function for the email.
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
