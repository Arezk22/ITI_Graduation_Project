from django.urls import path
from api import views

BASE_URL = 'api/v1/'

urlpatterns = [
    path(BASE_URL + 'tenders/', views.TendersListView.as_view(), name='tenders_list'),
    path(BASE_URL + 'tenders/<int:pk>/', views.TenderDetailView.as_view(), name='tender_detail'),
    path(BASE_URL + 'tenders/<int:tender_id>/files/', views.TenderFilesView.as_view(), name='tender_files'),
    path(BASE_URL + 'tenders/<int:tender_id>/evaluation-rules/', views.EvaluationRulesView.as_view(), name='evaluation_rules'),
    path(BASE_URL + 'tenders/<int:tender_id>/submissions/', views.TenderSubmissionsView.as_view(), name='tender_submissions'),
    path(BASE_URL + 'tenders/<int:tender_id>/submissions/<int:submission_id>/', views.TenderSubmissionDetailView.as_view(), name='tender_submission_detail'),
    
]