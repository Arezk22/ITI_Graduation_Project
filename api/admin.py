from django.contrib import admin

from .models import (
    BoqItems,
    BoqPrice,
    EvaluationRules,
    HumanReview,
    RiskItem,
    SubmissionFiles,
    TenderFiles,
    Tenders,
    TenderSubmissions,
)


class TenderFilesInline(admin.TabularInline):
    model = TenderFiles
    extra = 0


class EvaluationRulesInline(admin.TabularInline):
    model = EvaluationRules
    extra = 0


class BoqItemsInline(admin.TabularInline):
    model = BoqItems
    extra = 0


@admin.register(Tenders)
class TendersAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "project_category",
        "status",
        "analysis_status",
        "budget",
        "deadline_at",
        "created_at",
    )
    list_filter = ("status", "analysis_status", "project_category")
    search_fields = ("title", "description", "location", "owner__username")
    raw_id_fields = ("owner",)
    date_hierarchy = "created_at"
    inlines = (TenderFilesInline, EvaluationRulesInline, BoqItemsInline)


@admin.register(TenderFiles)
class TenderFilesAdmin(admin.ModelAdmin):
    list_display = ("tender", "file_type", "file_category", "need_review", "uploaded_at")
    list_filter = ("file_type", "file_category", "need_review")
    search_fields = ("tender__title", "file_url")
    raw_id_fields = ("tender",)


class SubmissionFilesInline(admin.TabularInline):
    model = SubmissionFiles
    extra = 0


class RiskItemInline(admin.TabularInline):
    model = RiskItem
    extra = 0


class HumanReviewInline(admin.TabularInline):
    model = HumanReview
    extra = 0


@admin.register(TenderSubmissions)
class TenderSubmissionsAdmin(admin.ModelAdmin):
    list_display = (
        "tender",
        "contractor",
        "status",
        "final_score",
        "rank",
        "recommendation",
        "need_review",
        "submitted_at",
    )
    list_filter = ("status", "recommendation", "need_review")
    search_fields = ("tender__title", "contractor__company_name")
    raw_id_fields = ("tender", "contractor")
    date_hierarchy = "submitted_at"
    inlines = (SubmissionFilesInline, RiskItemInline, HumanReviewInline)


@admin.register(SubmissionFiles)
class SubmissionFilesAdmin(admin.ModelAdmin):
    list_display = ("submission", "file_type", "file_category", "need_review")
    list_filter = ("file_type", "file_category", "need_review")
    raw_id_fields = ("submission",)


@admin.register(EvaluationRules)
class EvaluationRulesAdmin(admin.ModelAdmin):
    list_display = ("tender", "rule_name", "rule_value")
    search_fields = ("rule_name", "tender__title")
    raw_id_fields = ("tender",)


@admin.register(RiskItem)
class RiskItemAdmin(admin.ModelAdmin):
    list_display = ("submission", "title", "risk_level")
    list_filter = ("risk_level",)
    raw_id_fields = ("submission",)


@admin.register(BoqItems)
class BoqItemsAdmin(admin.ModelAdmin):
    list_display = ("tender", "item_name", "quantity", "unit")
    search_fields = ("item_name", "tender__title")
    raw_id_fields = ("tender",)


@admin.register(BoqPrice)
class BoqPriceAdmin(admin.ModelAdmin):
    list_display = ("submission", "boq_item", "unit_price")
    raw_id_fields = ("submission", "boq_item")


@admin.register(HumanReview)
class HumanReviewAdmin(admin.ModelAdmin):
    list_display = ("submission", "dicision", "reason")
    list_filter = ("dicision",)
    raw_id_fields = ("submission",)
