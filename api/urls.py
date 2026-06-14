from django.urls import path
from api import views

BASE_URL = 'api/v1/'

urlpatterns = [
    # POST tenders/  -> create a tender with its files and evaluation rules (owner only)
    # Request body:
    # {
    #   "title": "Road Construction",
    #   "description": "Build new road",
    #   "budget": 1000000,
    #   "deadline_at": "2026-07-01T00:00:00Z",
    #   "status": "open",                              # optional, defaults to "open"
    #   "files": [                                     # optional
    #     {"file_url": "https://example.com/spec.pdf", "file_type": "pdf"}
    #   ],
    #   "evaluation_rules": [                          # optional
    #     {"rule_name": "Experience", "rule_value": "30"},
    #     {"rule_name": "Price", "rule_value": "70"}
    #   ]
    # }
    # Response (201):
    # { "id": 1 }
    path(BASE_URL + 'tenders/', views.TendersListView.as_view(), name='tenders_list'),
    path(BASE_URL + 'tenders/<int:pk>/', views.TenderDetailView.as_view(), name='tender_detail'),
    path(BASE_URL + 'tenders/<int:tender_id>/files/', views.TenderFilesView.as_view(), name='tender_files'),
    path(BASE_URL + 'tenders/<int:tender_id>/evaluation-rules/', views.EvaluationRulesView.as_view(), name='evaluation_rules'),
    path(BASE_URL + 'tenders/<int:tender_id>/submissions/', views.TenderSubmissionsView.as_view(), name='tender_submissions'),
    path(BASE_URL + 'tenders/<int:tender_id>/submissions/<int:submission_id>/', views.TenderSubmissionDetailView.as_view(), name='tender_submission_detail'),
    
]