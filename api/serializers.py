import json

from django.http import QueryDict
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

# Maps file extensions to the TenderFiles.FILE_TYPE_CHOICES values.
FILE_EXTENSION_MAP = {
    'pdf': 'pdf',
    'doc': 'docx', 'docx': 'docx',
    'jpg': 'img', 'jpeg': 'img', 'png': 'img', 'webp': 'img',
}


def detect_file_type(filename):
    """Return the model file_type for an uploaded file, by extension in file name."""
    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    file_type = FILE_EXTENSION_MAP.get(extension)
    if not file_type:
        raise serializers.ValidationError(
            f'Unsupported file type ".{extension}". '
            f'Allowed: {", ".join(sorted(set(FILE_EXTENSION_MAP)))}.'
        )
    return file_type

class TendersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenders
        fields = ['id', 'owner', 'title', 'description', 'budget', 'deadline_at', 'status', 'created_at']
        read_only_fields = ['owner', 'created_at']

class TenderFilesSerializer(serializers.ModelSerializer):
    # Binary upload (multipart). Stored on the server; its path is saved to
    # `file_url`. `file_type` is detected from the file extension.
    file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = TenderFiles
        fields = ['id', 'file', 'file_url', 'file_type', 'uploaded_at']
        read_only_fields = ['file_url', 'file_type', 'uploaded_at']

    def validate(self, attrs):
        upload = attrs.get('file')
        if not upload and not self.instance:
            raise serializers.ValidationError({'file': 'A file is required.'})
        if upload:
            attrs['file_type'] = detect_file_type(upload.name)
        return attrs

    def create(self, validated_data):
        instance = super().create(validated_data)
        if instance.file:
            instance.file_url = instance.file.url
            instance.save(update_fields=['file_url'])
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and instance.file_url and instance.file_url.startswith('/'):
            data['file_url'] = request.build_absolute_uri(instance.file_url)
        return data

class EvaluationRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationRules
        fields = ['id', 'rule_name', 'rule_value']


class TenderDetailSerializer(serializers.ModelSerializer):
    files = TenderFilesSerializer(many=True, read_only=True)
    evaluation_rules = EvaluationRulesSerializer(many=True, read_only=True)

    class Meta:
        model = Tenders
        fields = [
            'id', 'owner', 'title', 'description', 'budget', 'deadline_at',
            'status', 'created_at', 'files', 'evaluation_rules',
        ]
        read_only_fields = fields

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

    # Uploaded files themselves (multipart). Send one or more `files` fields;
    # each file's type is detected and its stored path saved to file_url.
    files = serializers.ListField(
        child=serializers.FileField(), write_only=True, required=False
    )
    evaluation_rules = EvaluationRulesSerializer(many=True, required=False)

    class Meta:
        model = Tenders
        fields = [
            'id', 'title', 'description', 'budget', 'deadline_at', 'status',
            'files', 'evaluation_rules',
        ]
        read_only_fields = ['id']

    def to_internal_value(self, data):
        # Normalise multipart payloads: 
        # collect repeated `files` fields
        # accept `evaluation_rules` as a JSON-encoded string.
        if isinstance(data, QueryDict):
            files = data.getlist('files')
            data = {key: data.get(key) for key in data if key != 'files'}
            if files:
                data['files'] = files
        rules = data.get('evaluation_rules')
        if isinstance(rules, str):
            try:
                data['evaluation_rules'] = json.loads(rules)
            except json.JSONDecodeError:
                raise serializers.ValidationError(
                    {'evaluation_rules': 'Must be a valid JSON array.'}
                )
        return super().to_internal_value(data)

    def validate_status(self, value):
        return value.lower()

    def create(self, validated_data):
        files = validated_data.pop('files', [])
        rules_data = validated_data.pop('evaluation_rules', [])
        tender = Tenders.objects.create(**validated_data)
        # Create children one-by-one (not bulk_create) so post_save signals fire per file.
        for upload in files:
            tender_file = TenderFiles.objects.create(
                tender=tender,
                file=upload,
                file_type=detect_file_type(upload.name),
            )
            tender_file.file_url = tender_file.file.url
            tender_file.save(update_fields=['file_url'])
        for rule_data in rules_data:
            EvaluationRules.objects.create(tender=tender, **rule_data)
        return tender

