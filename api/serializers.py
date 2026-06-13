from rest_framework import serializers
from api.models import (
    Tenders,
    TenderFiles,
    EvaluationRules,
    TenderSubmissions,
    SubmissionFiles,
    RiskItem,
    BoqItems,
    BoqPrice,
    HumanReview,
)

class TendersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenders
        fields = ['id', 'owner', 'title', 'description', 'budget', 'deadline_at', 'status', 'created_at']
        read_only_fields = ['owner', 'created_at']

class TenderFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderFiles
        fields = ['id', 'tender', 'file_url', 'file_type', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class EvaluationRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationRules
        fields = ['id', 'tender', 'rule_name', 'rule_value']

class TenderSubmissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderSubmissions
        fields = [
            'id', 'tender', 'contractor', 'status',
            'technical_score', 'financial_score', 'risk_score', 'final_score',
            'rank', 'recommendation', 'submitted_at',
        ]
        read_only_fields = [
            'tender', 'contractor',
            'technical_score', 'financial_score', 'risk_score', 'final_score',
            'rank', 'recommendation', 'submitted_at',
        ]

class SubmissionFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionFiles
        fields = ['id', 'submission', 'file_url', 'file_category']
        read_only_fields = ['file_type', 'file_category']

class RiskItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskItem
        fields = ['id', 'title', 'risk_level', 'description']
        read_only_fields = ['submission']

class BoqItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoqItems
        fields = ['id', 'item_name', 'quantity', 'unit']
        read_only_fields = ['tender', 'submission']

class BoqPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoqPrice
        fields = ['id', 'boq_item', 'unit_price']
        read_only_fields = ['submission']


class HumanReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = HumanReview
        fields = ['id', 'reason', 'dicision']
        read_only_fields = ['submission']

