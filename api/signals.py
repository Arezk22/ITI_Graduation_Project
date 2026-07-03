"""Django signal receivers for the api app.

Indexes uploaded files for RAG once *all* files of a request are saved, rather
than once per file. Connected in ApiConfig.ready().
"""

import django.dispatch
from django.dispatch import receiver

# Fired once after a batch of TenderFiles has been saved and committed.
# Provides: files -- a TenderFiles QuerySet (carries file, file_type,
# file_category and every other model field).
tender_files_uploaded = django.dispatch.Signal()
submission_files_uploaded = django.dispatch.Signal()


def _index_files(files_ids,files_type):
    # importing it lazy so that app doesn't need to stack it in the first of the app
    # Please remove return true when implementing the func. :)
    from ai_pipeline.tasks import index_files_task

    index_files_task.delay(files_ids,files_type)


@receiver(tender_files_uploaded)
def index_tender_files_for_rag(sender, files_ids, files_type, **kwargs):
    _index_files(files_ids,files_type)


@receiver(submission_files_uploaded)
def index_submission_files_for_rag(sender, files_ids,files_type, **kwargs):
    _index_files(files_ids,files_type)
