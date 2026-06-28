import json

from django.db import transaction
from django.db.models import F
from django.http import QueryDict
from rest_framework import serializers
from account.models import ContractorProfiles
from api.signals import tender_files_uploaded, submission_files_uploaded
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
    total_submissions = serializers.SerializerMethodField()

    class Meta:
        model = Tenders
        fields = [
            'id', 'owner', 'title', 'description', 'project_category', 'location',
            'budget', 'start_date', 'duration_months', 'deadline_at', 'status',
            'total_submissions', 'created_at',
        ]
        read_only_fields = ['owner', 'created_at']

    def get_total_submissions(self, obj):
        # Use the annotated value when available (list view) to avoid N+1 counts.
        count = getattr(obj, 'submissions_count', None)
        return count if count is not None else obj.submissions.count()

class TenderFilesSerializer(serializers.ModelSerializer):
    # Binary upload (multipart). Stored on the server; its path is saved to
    # `file_url`. `file_type` is detected from the file extension.
    file = serializers.FileField(write_only=True, required=False)
    file_category = serializers.ChoiceField(choices=TenderFiles.FILE_CATEGORY_CHOICES)

    class Meta:
        model = TenderFiles
        fields = [
            'id', 'file', 'file_url', 'file_type', 'file_category',
            'extracted_data', 'extracted_meta_data', 'uploaded_at',
        ]
        read_only_fields = [
            'file_url', 'file_type', 'extracted_data', 'extracted_meta_data', 'uploaded_at',
        ]

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
        # Single-file upload path (TenderFilesView): fire the same batch signal
        # with a one-row QuerySet so indexing happens here too.
        files_qs = TenderFiles.objects.filter(id=instance.id)
        transaction.on_commit(
            lambda: tender_files_uploaded.send(sender=Tenders, files=files_qs)
        )
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
    winning_submission_id = serializers.SerializerMethodField()
    total_submissions = serializers.SerializerMethodField()

    class Meta:
        model = Tenders
        fields = [
            'id', 'owner', 'title', 'description', 'project_category', 'location',
            'budget', 'start_date', 'duration_months', 'deadline_at',
            'status', 'winning_submission_id', 'total_submissions', 'structured_data',
            'comparison_result', 'recommendation_result', 'created_at', 'files',
            'evaluation_rules',
        ]
        read_only_fields = fields

    def get_total_submissions(self, obj):
        return obj.submissions.count()

    def get_winning_submission_id(self, obj):
        if obj.status != "awarded":
            return None
        winner = obj.submissions.filter(status="accepted").first()
        return winner.id if winner else None

class TenderSubmissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderSubmissions
        fields = [
            'id', 'tender', 'contractor', 'status',
            'technical_score', 'financial_score', 'risk_score', 'final_score',
            'rank', 'recommendation', 'structured_data', 'justification',
            'validation_result', 'risk_result', 'technical_result', 'financial_result',
            'submitted_at',
        ]
        read_only_fields = [
            'tender', 'contractor',
            'technical_score', 'financial_score', 'risk_score', 'final_score',
            'rank', 'recommendation', 'structured_data', 'justification',
            'validation_result', 'risk_result', 'technical_result', 'financial_result',
            'submitted_at',
        ]

class SubmissionFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionFiles
        fields = [
            'id', 'submission', 'file_url', 'file_type',
            'extracted_data', 'extracted_meta_data',
        ]
        read_only_fields = ['file_url', 'file_type', 'extracted_data', 'extracted_meta_data']

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
    # Category per file, aligned by index with `files` (same count, same order).
    file_categories = serializers.ListField(
        child=serializers.ChoiceField(choices=TenderFiles.FILE_CATEGORY_CHOICES),
        write_only=True, required=False,
    )
    evaluation_rules = EvaluationRulesSerializer(many=True, required=False)

    class Meta:
        model = Tenders
        fields = [
            'id', 'title', 'description', 'project_category', 'location',
            'budget', 'start_date', 'duration_months', 'deadline_at', 'status',
            'files', 'file_categories', 'evaluation_rules',
        ]
        read_only_fields = ['id']

    def to_internal_value(self, data):
        # Normalise multipart payloads:
        # collect repeated `files`/`file_categories` fields
        # accept `evaluation_rules` as a JSON-encoded string.
        if isinstance(data, QueryDict):
            files = data.getlist('files')
            categories = data.getlist('file_categories')
            data = {
                key: data.get(key) for key in data
                if key not in ('files', 'file_categories')
            }
            if files:
                data['files'] = files
            if categories:
                data['file_categories'] = categories
        rules = data.get('evaluation_rules')
        if isinstance(rules, str):
            try:
                data['evaluation_rules'] = json.loads(rules)
            except json.JSONDecodeError:
                raise serializers.ValidationError(
                    {'evaluation_rules': 'Must be a valid JSON array.'}
                )
        return super().to_internal_value(data)

    def validate(self, attrs):
        files = attrs.get('files', [])
        categories = attrs.get('file_categories', [])
        if categories and len(categories) != len(files):
            raise serializers.ValidationError(
                {'file_categories': 'Must have one category per uploaded file '
                                    '(same count and order as `files`).'}
            )
        return attrs

    def validate_status(self, value):
        return value.lower()

    def create(self, validated_data):
        files = validated_data.pop('files', [])
        categories = validated_data.pop('file_categories', [])
        rules_data = validated_data.pop('evaluation_rules', [])
        tender = Tenders.objects.create(**validated_data)
        created_ids = []
        for index, upload in enumerate(files):
            tender_file = TenderFiles.objects.create(
                tender=tender,
                file=upload,
                file_type=detect_file_type(upload.name),
                file_category=categories[index] if categories else "",
            )
            tender_file.file_url = tender_file.file.url
            tender_file.save(update_fields=['file_url'])
            created_ids.append(tender_file.id)
        for rule_data in rules_data:
            EvaluationRules.objects.create(tender=tender, **rule_data)
        # Fire once, after all files are saved and the transaction commits,
        # passing the whole batch as a QuerySet.
        if created_ids:
            files_qs = TenderFiles.objects.filter(id__in=created_ids)
            transaction.on_commit(
                lambda: tender_files_uploaded.send(sender=Tenders, files=files_qs)
            )
        return tender


class CreateSubmissionSerializer(serializers.ModelSerializer):

    # Uploaded files themselves (multipart). Send one or more `files` fields;
    # each file's type is detected and its stored path saved to file_url.
    files = serializers.ListField(
        child=serializers.FileField(), write_only=True, required=False
    )

    class Meta:
        model = TenderSubmissions
        fields = ['id', 'status', 'files']
        read_only_fields = ['id', 'status']

    def to_internal_value(self, data):
        # Normalise multipart payloads: collect the repeated `files` fields.
        if isinstance(data, QueryDict):
            files = data.getlist('files')
            data = {key: data.get(key) for key in data if key != 'files'}
            if files:
                data['files'] = files
        return super().to_internal_value(data)

    def create(self, validated_data):
        files = validated_data.pop('files', [])
        submission = TenderSubmissions.objects.create(**validated_data)
        # Count this submission toward the contractor's total tenders (atomic).
        ContractorProfiles.objects.filter(pk=submission.contractor_id).update(
            total_tenders=F('total_tenders') + 1
        )
        created_ids = []
        for upload in files:
            submission_file = SubmissionFiles.objects.create(
                submission=submission,
                file=upload,
                file_type=detect_file_type(upload.name),
            )
            submission_file.file_url = submission_file.file.url
            submission_file.save(update_fields=['file_url'])
            created_ids.append(submission_file.id)
        # Fire once, after all files are saved and the transaction commits,
        # passing the whole batch as a QuerySet.
        if created_ids:
            files_qs = SubmissionFiles.objects.filter(id__in=created_ids)
            transaction.on_commit(
                lambda: submission_files_uploaded.send(
                    sender=TenderSubmissions, files=files_qs
                )
            )
        return submission
