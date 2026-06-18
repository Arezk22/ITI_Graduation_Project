from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import EmailLoginView, RegisterAPIView

urlpatterns = [
    path("api/v1/login/", EmailLoginView.as_view(), name="login"),
    path("api/v1/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api/v1/register/", RegisterAPIView.as_view(), name="register"),
]
