from django.conf import settings
from django.db import models

from account.models import ContractorProfiles


class Tenders(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("awarded", "Awarded"),
        ("closed", "Closed"),
    )


    ANALYSIS_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("invalid_documents", "Invalid Documents"),
    ]

    CATEGORY_CHOICES = (
        ("construction", "Construction"),
        ("roads", "Roads & Infrastructure"),
        ("buildings", "Buildings"),
        ("electrical", "Electrical"),
        ("mechanical", "Mechanical"),
        ("water", "Water & Sewage"),
        ("it", "IT & Telecom"),
        ("consulting", "Consulting"),
        ("supplies", "Supplies & Procurement"),
        ("maintenance", "Maintenance"),
        ("other", "Other"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tenders"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    project_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    location = models.CharField(max_length=255)

    budget = models.DecimalField(max_digits=14, decimal_places=2)

    start_date = models.DateField()
    duration_months = models.PositiveIntegerField()

    deadline_at = models.DateTimeField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")

    # AI-generated outputs for the tender.
    analysis_status = models.CharField(
        max_length=20,
        choices=ANALYSIS_STATUS_CHOICES,
        default="pending",
    )

    analyzed_at = models.DateTimeField(null=True, blank=True)
    awarded_at = models.DateTimeField(null=True, blank=True)
    structured_data = models.JSONField(null=True, blank=True)
    comparison_result = models.JSONField(null=True, blank=True)
    recommendation_result = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class TenderFiles(models.Model):
    FILE_TYPE_CHOICES = (
        ("pdf", "PDF"),
        ("docx", "DOCX"),
        ("img", "Image"),
    )

    FILE_CATEGORY_CHOICES = (
            ("boq", "BOQ"),
            ("drawing", "Drawing"),
            ("specification", "Specification"),
            ("other", "Other"),
        )

    tender = models.ForeignKey(Tenders, on_delete=models.CASCADE, related_name="files")

    # Stores the uploaded file. The path is exposed through `file_url`.
    file = models.FileField(upload_to="tender_files/", null=True, blank=True)

    # Server path/URL of the file (populated from `file` on upload, or set
    # directly to an external link).
    file_url = models.CharField(max_length=500, blank=True)

    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)

    file_category = models.CharField(max_length=20, choices=FILE_CATEGORY_CHOICES, blank=True)

    # AI-extracted content and metadata from the file.
    need_review = models.BooleanField(default=False)
    extracted_data = models.JSONField(null=True, blank=True)
    extracted_meta_data = models.JSONField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

class EvaluationRules(models.Model):
    tender = models.ForeignKey(Tenders, on_delete=models.CASCADE, related_name="evaluation_rules")

    rule_name = models.CharField(max_length=255)
    rule_value = models.CharField(max_length=255)

class TenderSubmissions(models.Model):
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("under_review", "Under Review"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    )

    RECOMMENDATION_CHOICES = (
        ("Highly Recommended", "Highly Recommended"),
        ("Recommended", "Recommended"),
        ("Acceptable", "Acceptable"),
        ("Not Recommended", "Not Recommended"),
        ("Disqualified", "Disqualified"),
    )

    tender = models.ForeignKey(Tenders, on_delete=models.CASCADE, related_name="submissions")

    contractor = models.ForeignKey(
        ContractorProfiles, on_delete=models.CASCADE, related_name="contractor_submissions"
    )

    # status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="under_review")


    need_review = models.BooleanField(default=False)
    technical_score = models.FloatField(null=True, blank=True)
    financial_score = models.FloatField(null=True, blank=True)
    risk_score = models.FloatField(null=True, blank=True)
    final_score = models.FloatField(null=True, blank=True)

    rank = models.PositiveIntegerField(null=True, blank=True)

    recommendation = models.CharField(
        max_length=20, choices=RECOMMENDATION_CHOICES, null=True, blank=True
    )

    # AI-generated outputs for the submission.
    structured_data = models.JSONField(null=True, blank=True)
    justification = models.TextField(blank=True)
    validation_result = models.JSONField(null=True, blank=True)
    risk_result = models.JSONField(null=True, blank=True)
    technical_result = models.JSONField(null=True, blank=True)
    financial_result = models.JSONField(null=True, blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)

class SubmissionFiles(models.Model):
    FILE_TYPE_CHOICES = (
        ("pdf", "PDF"),
        ("docx", "DOCX"),
        ("img", "Image"),
    )

    FILE_CATEGORY_CHOICES = (
        ("technical", "Technical Proposal"),
        ("financial", "Financial Proposal"),
        ("boq", "BOQ"),
        ("certificates", "Certificates & License"),
    )

    submission = models.ForeignKey(
        TenderSubmissions, on_delete=models.CASCADE, related_name="files"
    )

    # Stores the uploaded file. The path is exposed through `file_url`.
    file = models.FileField(upload_to="submission_files/", null=True, blank=True)

    # Server path/URL of the file (populated from `file` on upload, or set
    # directly to an external link).
    file_url = models.CharField(max_length=500, blank=True)

    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    # file_category = models.CharField(max_length=10, choices=FILE_CATEGORY_CHOICES)

    # AI-extracted content and metadata from the file.
    need_review = models.BooleanField(default=False)
    extracted_data = models.JSONField(null=True, blank=True)
    extracted_meta_data = models.JSONField(null=True, blank=True)

class RiskItem(models.Model):
    submission = models.ForeignKey(
        TenderSubmissions, on_delete=models.CASCADE, related_name="risk_items"
    )
    title=models.CharField(max_length=150)
    risk_level = models.CharField(max_length=50)

    description = models.TextField()
    
class BoqItems(models.Model):
    tender = models.ForeignKey(Tenders, on_delete=models.CASCADE,related_name="boq_items")
    item_name = models.CharField(max_length=255)
    quantity = models.FloatField()
    unit = models.CharField(max_length=50)
    
class BoqPrice(models.Model):
    submission = models.ForeignKey(
        TenderSubmissions, on_delete=models.CASCADE, related_name="boq_prices"
    )
    boq_item = models.ForeignKey(BoqItems, on_delete=models.CASCADE, related_name="prices")
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)
    
class HumanReview(models.Model):
    DICISION_CHOICES = (
        ("approved", "Approved"),
        ("rejected", "Rejected")
    )
    
    submission=models.ForeignKey(TenderSubmissions,on_delete=models.CASCADE,related_name="human_reviews")
    reason=models.TextField()
    dicision=models.CharField(max_length=10,choices=DICISION_CHOICES)
    