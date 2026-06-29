from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ContractorProfileAPIView,
    EmailLoginView,
    RegisterAPIView,

)

urlpatterns = [
    path("api/v1/login/", EmailLoginView.as_view(), name="login"),
    path("api/v1/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api/v1/register/", RegisterAPIView.as_view(), name="register"),
    path("api/v1/contractor/", ContractorProfileAPIView.as_view(), name="contractor-profile"),
    path("api/v1/contractor/<int:pk>/", ContractorProfileAPIView.as_view(), name="contractor-profile-detail"),
]
