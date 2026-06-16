from django.urls import path
from . import views

urlpatterns = [
    path('evaluate-tender/', views.evaluate_tender, name='evaluate_tender'),
    path('search-rag/', views.search_rag, name='search_rag'),
    path('rag-answer/', views.rag_answer, name='rag_answer'),
]
# TODO => add urls to main project