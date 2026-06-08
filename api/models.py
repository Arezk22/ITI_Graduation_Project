from django.conf import settings
from django.db import models

from account.models import ContractorProfiles


class Tenders(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("awarded", "Awarded"),
        ("closed", "Closed"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tenders"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    budget = models.DecimalField(max_digits=14, decimal_places=2)

    deadline_at = models.DateTimeField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class TenderFiles(models.Model):
    FILE_TYPE_CHOICES = (
        ("pdf", "PDF"),
        ("docx", "DOCX"),
        ("img", "Image"),
    )

    tender = models.ForeignKey(Tenders, on_delete=models.CASCADE, related_name="files")

    file_url = models.URLField()

    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)

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
        ("qualified", "Qualified"),
        ("disqualified", "Disqualified"),
        ("under_review", "Under Review"),
    )

    tender = models.ForeignKey(Tenders, on_delete=models.CASCADE, related_name="submissions")

    contractor = models.ForeignKey(
        ContractorProfiles, on_delete=models.CASCADE, related_name="submissions"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")

    technical_score = models.FloatField(null=True, blank=True)
    financial_score = models.FloatField(null=True, blank=True)
    risk_score = models.FloatField(null=True, blank=True)
    final_score = models.FloatField(null=True, blank=True)

    rank = models.PositiveIntegerField(null=True, blank=True)

    recommendation = models.CharField(
        max_length=20, choices=RECOMMENDATION_CHOICES, null=True, blank=True
    )

    submitted_at = models.DateTimeField(auto_now_add=True)


class SubmissionFiles(models.Model):
    
    submission = models.ForeignKey(
        TenderSubmissions, on_delete=models.CASCADE, related_name="files"
    )

    file_url = models.URLField()

    file_type = models.CharField(max_length=100,null=True,blank=True)


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
    