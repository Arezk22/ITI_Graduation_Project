from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from ITI_Graduation_Project.api.models import TenderSubmissions, Tenders
from main_pipeline import run_tender_evaluation_job
from django.conf import settings
# @shared_task
# def send_upload_complete_signal(user_id):
#     from django.dispatch import Signal

#     upload_complete = Signal()

#     upload_complete.send(sender=None, user_id=user_id)



@shared_task
def check_due_tenders():
    """
    Runs every minute.
    Finds all tenders whose deadline has passed.
    """

    due_tenders = Tenders.objects.filter(
    deadline_at__lte=timezone.now(),
    analysis_status="pending",
)

    for tender in due_tenders:
        run_tender_analysis.delay(tender.id)
        
        
        
@shared_task
def run_tender_analysis(tender_id):
    tender = Tenders.objects.get(id=tender_id)

    tender.analysis_status = "processing"
    tender.status="closed"
    tender.save()

    try:
        run_tender_evaluation_job(tender)

        tender.analysis_status = "completed"
        tender.analyzed_at=timezone.now()

    except Exception:
        tender.analysis_status = "failed"
        raise

    finally:
        tender.save()
        
        
@shared_task
def notify(info):
    event=info.event
    if info.payload:
        payload=info.payload
    sub=TenderSubmissions.objects.get(id=info.sub_id)  
    
    if  event == 'Disqualified':
        subject="Proposal Disqualified - Missing Mandatory Requirements"
        message=f"""Dear Tender Owner,

The AI evaluation has determined that a submitted proposal has been disqualified because it did not satisfy one or more mandatory tender requirements.

Summary:
* Contractor: {sub.contractor.name}
* Tender: {sub.tender.title}
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

* Contractor: {sub.contractor.name}
* Tender: {sub.tender.title}
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

Tender: {sub.tender.title}
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