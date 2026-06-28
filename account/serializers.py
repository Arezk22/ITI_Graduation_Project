from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from account.models import ContractorProfiles

Users = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    ROLE_CHOICES = [
        choice[0]
        for choice in Users.ROLE_CHOICES
        if choice[0] != "admin"
    ]

    role = serializers.ChoiceField(choices=ROLE_CHOICES)
    first_name = serializers.CharField(required=True, max_length=150)
    company_name = serializers.CharField(required=True, max_length=255, write_only=True)
    username = serializers.CharField(required=False, max_length=150)

    class Meta:
        model = Users
        fields = ["username", "password", "email", "role", "first_name", "company_name"]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def _generate_username(self, email):
        base = email.split("@")[0].replace(".", "_")
        username = base
        counter = 1

        while Users.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1

        return username

    def create(self, validated_data):
        company_name = validated_data.pop("company_name")
        password = validated_data.pop("password")
        role = validated_data["role"]

        if not validated_data.get("username"):
            validated_data["username"] = self._generate_username(validated_data["email"])

        user = Users.objects.create_user(password=password, **validated_data)

        if role == "owner":
            user.last_name = company_name
            user.save(update_fields=["last_name"])
        elif role == "contractor":
            ContractorProfiles.objects.create(
                user=user,
                company_name=company_name,
                classification="General",
            )

        return user


class ActiveProposalSerializer(serializers.Serializer):
    """A single active proposal (TenderSubmissions) for the contractor dashboard."""

    id = serializers.IntegerField()
    tender_id = serializers.IntegerField(source="tender.id")
    tender_title = serializers.CharField(source="tender.title")
    status = serializers.CharField()
    deadline_at = serializers.DateTimeField(source="tender.deadline_at")
    submitted_at = serializers.DateTimeField()
    accepted_at = serializers.SerializerMethodField()

    def get_accepted_at(self, obj):
        if obj.status == "accepted":
            return obj.tender.awarded_at
        return None


class ContractorProfileSerializer(serializers.ModelSerializer):
    ai_avg_rate = serializers.FloatField(source="average_rating", read_only=True)
    win_rate = serializers.SerializerMethodField()
    active_proposals_count = serializers.SerializerMethodField()
    active_proposals = serializers.SerializerMethodField()

    class Meta:
        model = ContractorProfiles
        fields = [
            "id",
            "company_name",
            "experience_years",
            "total_tenders",
            "total_wins",
            "ai_avg_rate",
            "win_rate",
            "active_proposals_count",
            "active_proposals",
        ]
        read_only_fields = fields

    def get_win_rate(self, obj):
        if not obj.total_tenders:
            return 0.0
        return round((obj.total_wins / obj.total_tenders) * 100, 2)

    def _active_proposals(self, obj):
        return (
            obj.contractor_submissions.select_related("tender")
            .filter(
                status__in=["under_review", "accepted"],
                tender__deadline_at__gt=timezone.now(),
            )
            .order_by("-submitted_at")
        )

    def get_active_proposals_count(self, obj):
        return self._active_proposals(obj).count()

    def get_active_proposals(self, obj):
        return ActiveProposalSerializer(self._active_proposals(obj), many=True).data


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"] = serializers.EmailField()
        self.fields.pop("username", None)

    


    def validate(self, attrs):
        email = attrs.pop("email")
        password = attrs.get("password")

        try:
            user = Users.objects.get(email=email)
        except Users.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "No active account found with the given credentials"}
            )

        attrs["username"] = user.username
        data = super().validate(attrs)


        data["role"] = self.user.role
        data["first_name"] = self.user.first_name
        if self.user.role == "contractor" and hasattr(self.user, "contractor_profile"):
            data["company_name"] = self.user.contractor_profile.company_name
        elif self.user.role == "owner":
            data["company_name"] = self.user.last_name
        else:
            data["company_name"] = ""
        return data
