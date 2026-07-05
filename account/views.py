from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from account.models import ContractorProfiles ,Users
from api.models import TenderSubmissions
from api.serializers import TenderSubmissionsSerializer
from .serializers import (
    ContractorProfileSerializer,
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    GoogleRegisterSerializer
)
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings

# POST /api/v1/google/register/
class GoogleRegisterView(APIView):

    permission_classes=[AllowAny]

    def post(self,request):

        serializer=GoogleRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        google_token = serializer.validated_data["id_token"]
        role = serializer.validated_data.get("role")
        info = id_token.verify_oauth2_token(
                google_token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
        email = info["email"]
        name = info.get("name", "")
        email_verified = info.get("email_verified", False)
        
        if not email_verified:
            return Response(
                {"error": "Google account email is not verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        user = Users.objects.filter(email=email).first()
        if user:
            refresh = RefreshToken.for_user(user)
            response = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": user.role,
                "first_name": user.first_name,
                "is_new_user": False,
            }

            if user.role == "contractor" and hasattr(user, "contractor_profile"):
                response["company_name"] = user.contractor_profile.company_name
            elif user.role == "owner":
                response["company_name"] = user.last_name
            else:
                response["company_name"] = ""

            return Response(response)
            
        if not role:
            return Response(    
                            {"error": "Role is required for first-time registration."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
        from uuid import uuid4
        username = f"{email.split('@')[0]}_{uuid4().hex[:8]}"
        user = Users.objects.create(
                            username=username,
                            email=email,
                            role=role,
                            first_name=name
                        )
        user.set_unusable_password()
        user.save()
        
        if role == "contractor":
            ContractorProfiles.objects.create(
                user=user,
                company_name=name
            )
        refresh = RefreshToken.for_user(user)
        response = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,
            "first_name": user.first_name,
            "is_new_user": True,
        }

        if user.role == "contractor" and hasattr(user, "contractor_profile"):
            response["company_name"] = user.contractor_profile.company_name
        elif user.role == "owner":
            response["company_name"] = user.last_name
        else:
            response["company_name"] = ""

        return Response(response)

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            company_name = (
                user.contractor_profile.company_name
                if user.role == "contractor"
                else user.last_name
            )
            return Response(
                {
                    "message": "User created successfully",
                    "role": user.role,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "first_name": user.first_name,
                    "company_name": company_name,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class ContractorProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            profile = ContractorProfiles.objects.filter(pk=pk).first()
        else:
            if request.user.role != "contractor":
                raise PermissionDenied("Only contractors can access this resource.")

            profile = ContractorProfiles.objects.filter(user=request.user).first()

        if profile is None:
            raise NotFound("Contractor profile not found.")

        serializer = ContractorProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContractorSubmissionsAPIView(APIView):
    """Get all submissions for a specific contractor (accessible to any authenticated user)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, contractor_id):
        contractor = ContractorProfiles.objects.filter(pk=contractor_id).first()
        if contractor is None:
            raise NotFound("Contractor profile not found.")

        submissions = TenderSubmissions.objects.filter(
            contractor_id=contractor_id
        ).select_related("tender", "tender__owner", "contractor")
        
        serializer = TenderSubmissionsSerializer(
            submissions,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
