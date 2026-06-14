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
        read_only_fields = ['tender', 'uploaded_at']

    def validate_file_type(self, value):
        return value.lower()

class EvaluationRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationRules
        fields = ['id', 'tender', 'rule_name', 'rule_value']
        read_only_fields = ['tender']

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


class CreateTenderSerializer(serializers.ModelSerializer):
    """Creates a tender together with its files and evaluation rules in one request."""

    files = TenderFilesSerializer(many=True, required=False)
    evaluation_rules = EvaluationRulesSerializer(many=True, required=False)

    class Meta:
        model = Tenders
        fields = [
            'id', 'title', 'description', 'budget', 'deadline_at', 'status',
            'files', 'evaluation_rules',
        ]
        read_only_fields = ['id']

    def validate_status(self, value):
        return value.lower()

    def create(self, validated_data):
        files_data = validated_data.pop('files', [])
        rules_data = validated_data.pop('evaluation_rules', [])
        tender = Tenders.objects.create(**validated_data)
        # Create children one-by-one (not bulk_create) so post_save signals fire per file.
        for file_data in files_data:
            TenderFiles.objects.create(tender=tender, **file_data)
        for rule_data in rules_data:
            EvaluationRules.objects.create(tender=tender, **rule_data)
        return tender

