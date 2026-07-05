from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ContractorProfileAPIView,
    ContractorSubmissionsAPIView,
    EmailLoginView,
    RegisterAPIView,
    GoogleRegisterView

)

urlpatterns = [
    path("api/v1/login/", EmailLoginView.as_view(), name="login"),
    path("api/v1/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api/v1/register/", RegisterAPIView.as_view(), name="register"),
    path("api/v1/contractor/", ContractorProfileAPIView.as_view(), name="contractor-profile"),
    path("api/v1/contractor/<int:pk>/", ContractorProfileAPIView.as_view(), name="contractor-profile-detail"),
    path("api/v1/contractor/<int:contractor_id>/submissions/", ContractorSubmissionsAPIView.as_view(), name="contractor-submissions"),
    path("api/v1/google/register/",GoogleRegisterView.as_view(),name="google-register")
]
