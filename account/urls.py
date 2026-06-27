from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import EmailLoginView, RegisterAPIView

urlpatterns = [
<<<<<<< HEAD
    path("api/v1/login/", EmailLoginView.as_view(), name="login"),
    path("api/v1/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api/v1/register/", RegisterAPIView.as_view(), name="register"),
=======
    path('api/v1/login',TokenObtainPairView.as_view(),name="login"),
    path('api/v1/refresh',TokenRefreshView.as_view(),name='get_refresh')
>>>>>>> 8c392a9b0dc9d25a3bcbdc05c9fd41012fd7db29
]
