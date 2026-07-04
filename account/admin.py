from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ContractorProfiles, Users


@admin.register(Users)
class UsersAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_superuser", "is_active")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)

    # Extend the default UserAdmin fieldsets with the custom `role` field.
    fieldsets = UserAdmin.fieldsets + (
        ("Role", {"fields": ("role",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Role", {"fields": ("email", "role")}),
    )


@admin.register(ContractorProfiles)
class ContractorProfilesAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "user",
        "classification",
        "experience_years",
        "trust_score",
        "total_tenders",
        "total_wins",
        "average_rating",
    )
    list_filter = ("classification",)
    search_fields = ("company_name", "user__username", "user__email")
    raw_id_fields = ("user",)
