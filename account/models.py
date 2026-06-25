from django.contrib.auth.models import AbstractUser
from django.db import models


class Users(AbstractUser):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("contractor", "Contractor"),
        ("admin", "Admin"),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)


class ContractorProfiles(models.Model):
    user = models.OneToOneField(
        Users, on_delete=models.CASCADE, related_name="contractor_profile"
    )

    company_name = models.CharField(max_length=255)
    classification = models.CharField(max_length=100)
    experience_years = models.PositiveIntegerField(default=0)

    trust_score = models.FloatField(default=0)

    total_tenders = models.PositiveIntegerField(default=0)
    total_wins = models.PositiveIntegerField(default=0)

    average_rating = models.FloatField(default=0)

    def __str__(self):
        return self.company_name
