from django.urls import path
from api import views

BASE_URL = 'api/v1/'

urlpatterns = [
    # POST tenders/  -> create a tender with its files and evaluation rules (owner only)
    #
    # To upload files, send the request as multipart/form-data:
    #   title=Road Construction
    #   description=Build new road
    #   budget=1000000
    #   deadline_at=2026-07-01T00:00:00Z
    #   status=open                                    # optional, defaults to "open"
    #   files=<file>                                   # optional, repeat for multiple files
    #   files=<file>                                   #   file_type is detected automatically
    #   evaluation_rules=[{"rule_name":"Price","rule_value":"70"}]   # optional, JSON string
    #
    # Without files, a plain JSON body also works (omit the `files` field).
    # Response (201):
    # { "id": 1 }
    path(BASE_URL + 'tenders', views.TendersListView.as_view(), name='tenders_list'),
    path(BASE_URL + 'tenders/<int:pk>', views.TenderDetailView.as_view(), name='tender_detail'),
    path(BASE_URL + 'tenders/<int:tender_id>/files', views.TenderFilesView.as_view(), name='tender_files'),
    path(BASE_URL + 'tenders/<int:tender_id>/evaluation-rules', views.EvaluationRulesView.as_view(), name='evaluation_rules'),
    path(BASE_URL + 'tenders/<int:tender_id>/submissions', views.TenderSubmissionsView.as_view(), name='tender_submissions'),
    path(BASE_URL + 'tenders/<int:tender_id>/submissions/<int:submission_id>', views.TenderSubmissionDetailView.as_view(), name='tender_submission_detail'),
    # POST tenders/<id>/award/<contractor_id>  -> award the tender to a contractor (tender owner only)
    path(BASE_URL + 'tenders/<int:pk>/award/<int:contractor_id>', views.AwardTenderView.as_view(), name='award_tender'),

    path(BASE_URL + 'submissions/my', views.MySubmissionsView.as_view(), name='my_submissions'),
]