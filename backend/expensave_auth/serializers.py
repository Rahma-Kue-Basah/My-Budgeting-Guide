from rest_framework import serializers
from dj_rest_auth.serializers import UserDetailsSerializer as BaseUserDetailsSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from allauth.account.adapter import get_adapter
from allauth.account import app_settings as allauth_settings

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["full_name", "initials", "profile_color"]


class UserDetailsSerializer(BaseUserDetailsSerializer):
    profile = serializers.SerializerMethodField()

    class Meta(BaseUserDetailsSerializer.Meta):
        fields = BaseUserDetailsSerializer.Meta.fields + ("profile",)

    def get_profile(self, obj):
        try:
            return ProfileSerializer(obj.profile).data
        except Profile.DoesNotExist:
            return None


class RegisterSerializer(BaseRegisterSerializer):
    full_name = serializers.CharField(required=True, max_length=150)
    username = None  # Remove inherited username field

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["full_name"] = self.validated_data.get("full_name", "")
        return data

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)
        self.cleaned_data = self.get_cleaned_data()
        user = adapter.save_user(request, user, self)
        user.save()
        full_name = self.cleaned_data.get("full_name", "")
        if full_name:
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.full_name = full_name
            profile.save()
        self.custom_signup(request, user)
        return user
