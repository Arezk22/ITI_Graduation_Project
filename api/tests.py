from datetime import date, datetime, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from account.models import ContractorProfiles, Users
from api.models import SubmissionFiles, TenderSubmissions, Tenders
from api.serializers import TenderSubmissionsSerializer


class TenderSubmissionSerializerTests(TestCase):
    def setUp(self):
        self.owner = Users.objects.create_user(
            username="owner_user",
            email="owner@example.com",
            password="testpass123",
            role="owner",
        )
        self.contractor_user = Users.objects.create_user(
            username="contractor_user",
            email="contractor@example.com",
            password="testpass123",
            role="contractor",
        )
        self.contractor_profile = ContractorProfiles.objects.create(
            user=self.contractor_user,
            company_name="Alpha Build Co",
            classification="General Contractor",
        )
        self.tender = Tenders.objects.create(
            owner=self.owner,
            title="Road Works",
            description="Road rehabilitation project",
            project_category="roads",
            location="Cairo",
            budget=1000000,
            start_date=date.today(),
            duration_months=6,
            deadline_at=datetime.now() + timedelta(days=30),
        )

    def test_submission_defaults_to_under_review_and_exposes_company_name(self):
        submission = TenderSubmissions.objects.create(
            tender=self.tender,
            contractor=self.contractor_profile,
        )

        self.assertEqual(submission.status, "under_review")

        serializer = TenderSubmissionsSerializer(submission)
        self.assertEqual(
            serializer.data["contractor_company_name"],
            "Alpha Build Co",
        )

    def test_submission_serializer_includes_uploaded_files(self):
        submission = TenderSubmissions.objects.create(
            tender=self.tender,
            contractor=self.contractor_profile,
        )
        uploaded_file = SimpleUploadedFile(
            "proposal.pdf",
            b"%PDF-1.4",
            content_type="application/pdf",
        )
        SubmissionFiles.objects.create(
            submission=submission,
            file=uploaded_file,
            file_type="pdf",
        )

        serializer = TenderSubmissionsSerializer(submission)

        self.assertEqual(len(serializer.data["files"]), 1)
        self.assertEqual(serializer.data["files"][0]["file_type"], "pdf")

    def test_submission_serializer_returns_absolute_file_urls(self):
        submission = TenderSubmissions.objects.create(
            tender=self.tender,
            contractor=self.contractor_profile,
        )
        uploaded_file = SimpleUploadedFile(
            "proposal.pdf",
            b"%PDF-1.4",
            content_type="application/pdf",
        )
        submission_file = SubmissionFiles.objects.create(
            submission=submission,
            file=uploaded_file,
            file_type="pdf",
        )

        serializer = TenderSubmissionsSerializer(
            submission,
            context={"request": self.client.request().wsgi_request},
        )

        self.assertTrue(serializer.data["files"][0]["file_url"].startswith("http"))
        self.assertIn(str(submission_file.id), serializer.data["files"][0]["file_url"])
