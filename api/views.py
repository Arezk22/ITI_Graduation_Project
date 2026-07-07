from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import NotFound
from django.db import transaction
from django.db.models import Count, F, Q
from django.utils import timezone
from account.models import ContractorProfiles
from api.models import Tenders, TenderSubmissions
from api.serializers import (
    TendersSerializer,
    TenderDetailSerializer,
    TenderFilesSerializer,
    EvaluationRulesSerializer,
    TenderSubmissionsSerializer,
    CreateTenderSerializer,
    CreateSubmissionSerializer,
)
from .permissions import IsOwner, IsContractor, IsTenderOwner, IsSubmissionOwnerOrTenderOwner


class TendersListView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]

    def get(self, request):
        if request.user.role == 'owner':
            base = Tenders.objects.filter(owner=request.user)
            counts = base.aggregate(
                total=Count('id'),
                open=Count('id', filter=Q(status='open')),
                awarded=Count('id', filter=Q(status='awarded')),
                closed=Count('id', filter=Q(status='closed')),
            )
            tenders = base.annotate(submissions_count=Count('submissions'))
            serializer = TendersSerializer(tenders, many=True)
            return Response(
                {
                    'total': counts['total'],
                    'open': counts['open'],
                    'awarded': counts['awarded'],
                    'closed': counts['closed'],
                    'tenders': serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        tenders = Tenders.objects.filter(is_active=True).annotate(submissions_count=Count('submissions'))
        serializer = TendersSerializer(tenders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateTenderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            with transaction.atomic():
                tender = serializer.save(owner=request.user)
            return Response({'id': tender.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TenderDetailView(APIView):

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE"]:
            return [IsAuthenticated(), IsTenderOwner()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            raise NotFound("Tender not found.")

    def get(self, request, pk):
        tender = self.get_object(pk)
        serializer = TenderDetailSerializer(tender, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        tender = self.get_object(pk)
        self.check_object_permissions(request, tender)
        serializer = TendersSerializer(tender, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tender = self.get_object(pk)
        self.check_object_permissions(request, tender)
        tender.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenderFilesView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ['POST', 'DELETE']:
            return [IsAuthenticated(), IsOwner(), IsTenderOwner()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            return None

    def get(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        files = tender.files.all()
        serializer = TenderFilesSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        self.check_object_permissions(request, tender)
        serializer = TenderFilesSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(tender=tender)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def delete(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        self.check_object_permissions(request, tender)
        file_id = request.data.get('file_id')
        file = tender.files.filter(id=file_id).first()
        if not file:
            return Response(status=404, data={'message': 'File not found'})
        file.delete()
        return Response(status=204, data={'message': 'File deleted successfully'})


class EvaluationRulesView(APIView):
    def get_permissions(self):
        if self.request.method in ['POST', 'DELETE']:
            return [IsAuthenticated(), IsOwner(), IsTenderOwner()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            return None

    def get(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        rules = tender.evaluation_rules.all()
        serializer = EvaluationRulesSerializer(rules, many=True)
        return Response(serializer.data)

    def post(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        self.check_object_permissions(request, tender)
        serializer = EvaluationRulesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(tender=tender)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def delete(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        self.check_object_permissions(request, tender)
        rule_id = request.data.get('rule_id')
        rule = tender.evaluation_rules.filter(id=rule_id).first()
        if not rule:
            return Response(status=404, data={'message': 'Rule not found'})
        rule.delete()
        return Response(status=204, data={'message': 'Rule deleted successfully'})


class TenderSubmissionsView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsContractor()]
        return [IsAuthenticated(), IsTenderOwner()]

    def get_object(self, pk):
        try:
            return Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            return None

    def get(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        self.check_object_permissions(request, tender)
        submissions = tender.submissions.all()
        serializer = TenderSubmissionsSerializer(
            submissions,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        serializer = CreateSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            submission = serializer.save(
                tender=tender, contractor=request.user.contractor_profile
            )
            return Response(
                TenderSubmissionsSerializer(
                    submission,
                    context={"request": request},
                ).data,
                status=201,
            )
        return Response(serializer.errors, status=400)


class AwardTenderView(APIView):
    """Award a tender to a contractor (tender owner only)."""

    permission_classes = [IsAuthenticated, IsOwner, IsTenderOwner]

    def post(self, request, pk, contractor_id):
        try:
            tender = Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            raise NotFound("Tender not found.")
        self.check_object_permissions(request, tender)

        if tender.status == "awarded":
            return Response(
                {"detail": "This tender has already been awarded."},
                status=status.HTTP_409_CONFLICT,
            )

        submission = tender.submissions.filter(contractor_id=contractor_id).first()
        if submission is None:
            return Response(
                {"detail": "This contractor has no submission on this tender."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            tender.status = "awarded"
            tender.awarded_at = timezone.now()
            tender.awarded_to_id = contractor_id
            tender.save(update_fields=["status", "awarded_at", "awarded_to"])

            submission.status = "accepted"
            submission.save(update_fields=["status"])

            tender.submissions.exclude(pk=submission.pk).update(status="rejected")

            ContractorProfiles.objects.filter(pk=contractor_id).update(
                total_wins=F("total_wins") + 1
            )

        return Response(
            {
                "tender_id": tender.id,
                "status": tender.status,
                "awarded_at": tender.awarded_at,
                "winning_submission_id": submission.id,
                "contractor_id": contractor_id,
            },
            status=status.HTTP_200_OK,
        )
class MySubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contractor_profile = getattr(request.user, 'contractor_profile', None)
        if not contractor_profile:
            return Response(
                {'message': 'Contractor profile not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submissions = TenderSubmissions.objects.filter(contractor=contractor_profile)
        serializer = TenderSubmissionsSerializer(
            submissions,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class TenderSubmissionDetailView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), IsSubmissionOwnerOrTenderOwner()]

    def get_object(self, tender_id, submission_id):
        try:
            tender = Tenders.objects.get(pk=tender_id)
            return tender.submissions.filter(id=submission_id).first()
        except Tenders.DoesNotExist:
            return None

    def get(self, request, tender_id, submission_id):
        submission = self.get_object(tender_id, submission_id)
        if not submission:
            return Response(status=404, data={'message': 'Submission not found'})
        self.check_object_permissions(request, submission)
        serializer = TenderSubmissionsSerializer(
            submission,
            context={"request": request},
        )
        return Response(serializer.data)

    def put(self, request, tender_id, submission_id):
        submission = self.get_object(tender_id, submission_id)
        if not submission:
            return Response(status=404, data={'message': 'Submission not found'})
        self.check_object_permissions(request, submission)
        serializer = TenderSubmissionsSerializer(submission, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, tender_id, submission_id):
        submission = self.get_object(tender_id, submission_id)
        if not submission:
            return Response(status=404, data={'message': 'Submission not found'})
        self.check_object_permissions(request, submission)
        submission.delete()
        return Response(status=204, data={'message': 'Submission deleted successfully'})
