from django.urls import path ,include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r"chats", views.ChatViewSet, basename="chats")
BASE_URL = 'api/v1/'

urlpatterns = [
     path("", include(router.urls)),
    path(BASE_URL + 'tenders/<int:tender_id>/evaluate', views.evaluate_tender, name='tenders_evaluation'),
    # path('search-rag/', views.search_rag, name='search_rag'),
    # path('rag-answer/', views.rag_answer, name='rag_answer'),
]
# TODO => add urls to main project