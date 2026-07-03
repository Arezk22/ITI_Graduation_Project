from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from account.models import ContractorProfiles
from api.models import TenderSubmissions
from api.serializers import TenderSubmissionsSerializer
from .serializers import (
    ContractorProfileSerializer,
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
)


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
