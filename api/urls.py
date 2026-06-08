from django.urls import path
from api import views

BASE_URL = 'api/v1/'

urlpatterns = [
    path(BASE_URL + 'tenders/', views.TendersListView.as_view(), name='tenders_list'),
    path(BASE_URL + 'tenders/<int:pk>/', views.TenderDetailView.as_view(), name='tender_detail'),
]