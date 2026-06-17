from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView , TokenRefreshView
from .views import RegisterAPIView
urlpatterns = [
    path('api/v1/login',TokenObtainPairView.as_view(),name="login"),
    path('api/v1/refresh/',TokenRefreshView.as_view(),name='get_refresh'),
    # add register url
    path('api/v1/register/', RegisterAPIView.as_view(), name='register')
]
