from django.urls import path ,include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r"chats", views.ChatViewSet, basename="chats")

urlpatterns = [
     path("", include(router.urls)),
    path('evaluate-tender/', views.evaluate_tender, name='evaluate_tender'),
    # path('search-rag/', views.search_rag, name='search_rag'),
    # path('rag-answer/', views.rag_answer, name='rag_answer'),
]
# TODO => add urls to main project