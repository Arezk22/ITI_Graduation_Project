from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import NotFound
from api.models import Tenders
from api.serializers import (
    TendersSerializer,
    TenderFilesSerializer,
    EvaluationRulesSerializer,
    TenderSubmissionsSerializer,
)
from .permissions import IsOwner, IsContractor, IsTenderOwner, IsSubmissionOwnerOrTenderOwner


class TendersListView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]

    def get(self, request):
        if request.user.role == 'owner':
            tenders = Tenders.objects.filter(owner=request.user)
        else:
            tenders = Tenders.objects.all()
        serializer = TendersSerializer(tenders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TendersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
        serializer = TendersSerializer(tender)
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
        serializer = TenderFilesSerializer(files, many=True)
        return Response(serializer.data)

    def post(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        self.check_object_permissions(request, tender)
        serializer = TenderFilesSerializer(data=request.data)
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
        serializer = TenderSubmissionsSerializer(submissions, many=True)
        return Response(serializer.data)

    def post(self, request, tender_id):
        tender = self.get_object(tender_id)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        serializer = TenderSubmissionsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(tender=tender, contractor=request.user.contractor_profile)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


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
        serializer = TenderSubmissionsSerializer(submission)
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
