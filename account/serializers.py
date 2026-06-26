from django.contrib.auth import get_user_model
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
        return data
