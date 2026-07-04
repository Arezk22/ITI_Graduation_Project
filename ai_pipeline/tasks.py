from celery import shared_task
import time
from django.utils import timezone
from django.core.mail import send_mail
from openai import max_retries
from api.models import TenderSubmissions, Tenders
from django.conf import settings
from openai import (RateLimitError,APITimeoutError,APIConnectionError,APIStatusError)
from google.genai import errors
from celery.exceptions import MaxRetriesExceededError , Retry


@shared_task
def hello():
    print("Hello from Celery")
    return "Hello ITI"


@shared_task
def long_task():
    print("Started...")
    time.sleep(10)
    print("Finished")
    return "Done"

@shared_task(bind=True,max_retries=3)
def index_files_task(self,files_ids,files_type):
    from ai_pipeline.main_pipeline import index_files_for_rag
    from api.models import TenderFiles,SubmissionFiles
    if files_type == "tender":
        files=TenderFiles.objects.filter(id__in=files_ids)
    elif files_type == "submission":
        files=SubmissionFiles.objects.filter(id__in=files_ids)
    else:
        raise ValueError(f"Unknown files_type: {files_type}")
    try:
        index_files_for_rag(files,files_type)
    except (errors.ClientError,errors.ServerError) as e:
        if e.code in (429, 500, 502, 503, 504):
            try:
                raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
            except MaxRetriesExceededError:
                print((f"Giving up indexing files {files_ids} after {self.max_retries} retries"))
            raise
        else:
            raise


@shared_task
def check_due_tenders():
    """
    Runs every minute.
    Finds all tenders whose deadline has passed.
    """

    print("=" * 50)
    print("CHECK DUE TENDERS IS RUNNING")
    print("=" * 50)
    
    due_tenders = Tenders.objects.filter(
    deadline_at__lte=timezone.now(),
    analysis_status="pending",
)
    print(f"Found {due_tenders.count()} due tenders")
    for tender in due_tenders:
        print(f"Running analysis for tender {tender.id}")
        updated = Tenders.objects.filter(
        id=tender.id,
        analysis_status="pending").update(analysis_status="processing")
        print("Updated:", updated)
        if updated:
            run_tender_analysis.delay(tender.id)
        else:
            print("Tender already processing")
        
        
        
@shared_task(bind=True,max_retries=3)
def run_tender_analysis(self,tender_id):
    from .main_pipeline import run_tender_evaluation_job

    Tenders.objects.filter(id=tender_id).update(status="closed")

    try:
        tender=Tenders.objects.get(id=tender_id)
        run_tender_evaluation_job(tender)

        Tenders.objects.filter(id=tender_id).update(
            analysis_status="completed",
            analyzed_at=timezone.now(),
        )

    except (RateLimitError, APITimeoutError, APIConnectionError) as e:
        try:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        except MaxRetriesExceededError:
            print(f"Giving up Run tender analysis {tender_id} after {self.max_retries} retries")
            Tenders.objects.filter(id=tender_id).update(analysis_status="failed")
            raise

    except APIStatusError as e:
        if e.status_code >= 500 or e.status_code in (408, 429):
            try:
                raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
            except MaxRetriesExceededError:
                print(f"Giving up Run tender analysis {tender_id} after {self.max_retries} retries")
                Tenders.objects.filter(id=tender_id).update(analysis_status="failed")
                raise
        else:
            raise

    except Exception:
        Tenders.objects.filter(id=tender_id).update(analysis_status="failed")
        raise
        
        
@shared_task
def notify(info):
    event=info["event"]
    if info.get("payload"):
        payload=info["payload"]
    sub=TenderSubmissions.objects.get(id=info["sub"])  
    
    if  event == 'Disqualified':
        subject="Proposal Disqualified - Missing Mandatory Requirements"
        message=f"""Dear Tender Owner,

The AI evaluation has determined that a submitted proposal has been disqualified because it did not satisfy one or more mandatory tender requirements.

Summary:
* Contractor: {sub.contractor.company_name.capitalize()}
* Tender: {sub.tender.title.capitalize()}
* Status: Disqualified
* Reason: Missing or unmet mandatory requirements.

Please log in to the system to review the detailed validation report and supporting justification.

Regards,
Tender Evaluation System"""
    
    elif event == "risk":
        subject=f"{payload["level"].capitalize()} Risk Proposal Detected"
        message=f"""Dear Tender Owner,

The AI risk assessment has identified a proposal with a High Risk rating.

Summary:

* Contractor: {sub.contractor.company_name.capitalize()}
* Tender: {sub.tender.title.capitalize()}
* Risk Level: {payload["level"].capitalize()}
* Risk Score: {payload["score"]}

The proposal may contain significant contractual, financial, or technical risks. Please review the generated risk analysis before making a final decision.

Regards,
Tender Evaluation System

        """
 
    elif event == "ANALYSIS_COMPLETED":
        subject="Tender Analysis Completed"
        message=f"""Dear Tender Owner,

The AI evaluation process for your tender has been completed successfully.

Summary:

Tender: {sub.tender.title.capitalize()}
Total Proposals: {sub.tender.submissions.count()}
Qualified Proposals: {sub.tender.submissions.exclude(recommendation ='Disqualified').count()}
Disqualified Proposals: {sub.tender.submissions.filter(recommendation='Disqualified').count()}

You can now log in to the system to review the evaluation reports, rankings, and recommendations for all submitted proposals.

Regards,
Tender Evaluation System"""

    
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[sub.tender.owner.email],
    )