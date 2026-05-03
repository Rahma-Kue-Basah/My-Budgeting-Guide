import random
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

PROFILE_COLOR_CHOICES = [
    ("accent", "Blue"),
    ("warning", "Orange"),
    ("danger", "Red"),
    ("success", "Indigo"),
    ("graphite", "Graphite"),
]


def _random_color():
    return random.choice([c[0] for c in PROFILE_COLOR_CHOICES])


def _generate_initials(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return parts[0][:2].upper() if parts and parts[0] else "?"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=150)
    initials = models.CharField(max_length=5, blank=True)
    profile_color = models.CharField(
        max_length=20, choices=PROFILE_COLOR_CHOICES, default=_random_color
    )

    def save(self, *args, **kwargs):
        self.initials = _generate_initials(self.full_name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"
