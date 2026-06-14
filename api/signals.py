"""Django signal receivers for the api app.

Indexes files for RAG as soon as they are uploaded. Connected in ApiConfig.ready().
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from api.models import TenderFiles, SubmissionFiles


def _index_file(instance):
    # importing it lazy so that app doesn't need to stack it in the first of the app
    # Please remove return true when implementing the func. :) 
    return True
    from ai_agent.pipeline import index_file_for_rag

    index_file_for_rag(instance)


@receiver(post_save, sender=TenderFiles)
def index_tender_file_for_rag(sender, instance, created, **kwargs):
    if not created:
        return
    _index_file(instance)


@receiver(post_save, sender=SubmissionFiles)
def index_submission_file_for_rag(sender, instance, created, **kwargs):
    if not created:
        return
    _index_file(instance)
