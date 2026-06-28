# """
# URL configuration for config project.

# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/6.0/topics/http/urls/
# """
# from django.conf import settings
# from django.conf.urls.static import static
# from django.contrib import admin
# <<<<<<< HEAD
# from django.urls import include, path

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     # add account urls
#     path('', include('account.urls'))
# =======
# from django.urls import path, include
# from rest_framework.permissions import AllowAny
# from drf_spectacular.views import (
#     SpectacularAPIView,
#     SpectacularSwaggerView,
#     SpectacularRedocView,
# )

# urlpatterns = [
#     path('admin/', admin.site.urls),

#     # API endpoints
#     path('', include('account.urls')),
#     path('', include('api.urls')),

#     # API documentation
#     path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
#     path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
#     path('api/redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[AllowAny]), name='redoc'),
# >>>>>>> origin/features/api
# ]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

"""
URL configuration for config project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import AllowAny
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path("", include("account.urls")),
    path("", include("api.urls")),

    path("api/schema/", SpectacularAPIView.as_view(permission_classes=[AllowAny]), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[AllowAny]), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema", permission_classes=[AllowAny]), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)