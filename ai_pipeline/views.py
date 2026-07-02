import json
import os
import tempfile
from rest_framework import viewsets, status
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from api.models import TenderSubmissions, Tenders
from api.serializers import TenderSubmissionsSerializer, TendersSerializer
from ai_pipeline.main_pipeline import run_tender_evaluation_job
from ai_pipeline.vector_store import search_documents
from .services.rag import RagAgent
from rest_framework.decorators import action
from .services.chat_memory import ChatMemoryService
from api.permissions import IsContractor, IsTenderOwner
rag=RagAgent()
memory=ChatMemoryService()


def _serialize_chat(conv):
    return {
        "id": conv.id,
        "title": conv.title,
        "tender_id": conv.tender_id,
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
    }


def _serialize_chats(convs):
    return [_serialize_chat(c) for c in convs]

def _save_uploaded_file(uploaded_file):
    """Save uploaded file to a temporary path and return the filesystem path."""
    extension = os.path.splitext(uploaded_file.name)[1] or ''
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=extension, dir=settings.MEDIA_ROOT)
    for chunk in uploaded_file.chunks():
        tmp_file.write(chunk)
    tmp_file.flush()
    tmp_file.close()
    return tmp_file.name


@api_view(['GET'])
@permission_classes([IsTenderOwner])
def evaluate_tender(request,tender_id):
    """API endpoint to receive tender and contractor files, then run the AI evaluation pipeline."""
    if not tender_id:
        return JsonResponse({'status': 'error', 'message': 'Missing tender id.'}, status=400)

    try:
        tender=get_object_or_404(Tenders,id=tender_id)
        
        
        analysis_status=tender.analysis_status
        submissions=TenderSubmissions.objects.filter(tender=tender)
        tender_ser=TendersSerializer(tender)
        submissions_ser=TenderSubmissionsSerializer(submissions,many=True)
        
        
        
        if analysis_status == 'pending':
            return JsonResponse({"status": "pending","message": "Analysis has not started yet."}, status=200)
        elif analysis_status == 'processing':
            return JsonResponse({"status": "processing","message": "Analysis is in progress."}, status=200)
        elif analysis_status == 'failed':
            return JsonResponse({"status": "failed","message": "Analysis failed."}, status=200)
        elif analysis_status == 'completed':
            return JsonResponse({
                                "status": "completed",
                                "tender":tender_ser.data,
                                "submissions":submissions_ser.data
                                }, status=200)
        elif analysis_status== 'invalid_documents':
            return JsonResponse({
                                "status":"Invalid Documents",
                                "message":"The tender documents could not be analyzed because one or more uploaded files have low extraction confidence. Please re-upload clearer documents."}
                                ,status=200)
    except Exception as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=500)



@csrf_exempt
@require_POST
def search_rag(request):
    """API endpoint to search the vector store for an existing tender."""
    tender_id = request.POST.get('tender_id')
    query = request.POST.get('query')
    top_k_raw = request.POST.get('top_k')

    if not tender_id:
        return JsonResponse({'status': 'error', 'message': 'Missing tender_id.'}, status=400)
    if not query:
        return JsonResponse({'status': 'error', 'message': 'Missing query.'}, status=400)

    try:
        top_k = int(top_k_raw) if top_k_raw else 5
    except ValueError:
        return JsonResponse({'status': 'error', 'message': 'top_k must be an integer.'}, status=400)

    db_connection_string = os.getenv('DATABASE_URL') or os.getenv('VECTOR_DB_CONNECTION_STRING')
    if not db_connection_string:
        return JsonResponse({'status': 'error', 'message': 'Vector DB connection string not configured.'}, status=500)

    try:
        documents = search_documents(db_connection_string, tender_id, query, top_k=top_k)
        return JsonResponse({'status': 'success', 'tender_id': tender_id, 'query': query, 'results': documents})
    except Exception as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=500)


@csrf_exempt
@require_POST
def rag_answer(request):
    """API endpoint for an end-to-end RAG answer using retrieved reference documents."""
    tender_id = request.POST.get('tender_id')
    query = request.POST.get('query')
    top_k_raw = request.POST.get('top_k')

    if not tender_id:
        return JsonResponse({'status': 'error', 'message': 'Missing tender_id.'}, status=400)
    if not query:
        return JsonResponse({'status': 'error', 'message': 'Missing query.'}, status=400)

    try:
        top_k = int(top_k_raw) if top_k_raw else 5
    except ValueError:
        return JsonResponse({'status': 'error', 'message': 'top_k must be an integer.'}, status=400)

    try:
        response = rag.run_rag_query(tender_id, query, top_k=top_k)
        return JsonResponse({'status': 'success', 'data': response})
    except Exception as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=500)



class ChatViewSet(viewsets.ViewSet):
    """
    Endpoints:
        GET    /api/v1/chats/                 — list user's chats
        POST   /api/v1/chats/                 — create a new chat
                                                       (optionally bound to a tender)
        GET    /api/v1/chats/{id}/            — retrieve a chat
                                                       with its full message history
        DELETE /api/v1/chats/{id}/            — delete a chat
        POST /api/v1/chats/{id}/messages/     — send a message
    """
    permission_classes=[IsAuthenticated,IsContractor]
    
    def list(self, request):
        tender_id = request.query_params.get('tender_id')
        chats = memory.list_chats(request.user, tender=tender_id)
        return Response(_serialize_chats(chats))
    
    def create(self, request):
        tender_id = request.data.get("tender_id")
        tender = None
        if tender_id:
            try:
                tender = Tenders.objects.get(id=tender_id)
            except (Tenders.DoesNotExist, ValueError):
                return Response(
                    {"error": "Tender not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        title = (request.data.get("title") or "").strip()
        chat = memory.create_chat(
            user=request.user, tender=tender, title=title,
        )
        return Response(
            _serialize_chat(chat),
            status=status.HTTP_201_CREATED,
        )
        
        
        
    def retrieve(self, request, pk=None):
        chat = memory.get_chat(request.user, pk)
        if chat is None:
            return Response(
                {"error": "chat not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        messages = [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "source_type": m.source_type,
                "source_id": m.source_id,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in chat.messages.all().order_by("created_at")
        ]
        payload = _serialize_chat(chat)
        payload["messages"] = messages
        return Response(payload)

    def destroy(self, request, pk=None):
        ok = memory.delete_chat(request.user, pk)
        if not ok:
            return Response(
                {"error": "chat not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=["post"], url_path="messages")
    def send_message(self, request, pk=None):
        chat = memory.get_chat(request.user, pk)

        if chat is None:
            return Response(
                {"error": "Chat not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        message = (request.data.get("message") or "").strip()

        if not message:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save user message
        memory.append_message(
            chat=chat,
            role="user",
            content=message,
        )

        # Run RAG
        result = rag.run_rag_query(
            tender_id=chat.tender.id,
            query=message,
        )

        # Save assistant response
        memory.append_message(
            chat=chat,
            role="assistant",
            content=result["answer"],
        )

        return Response(
            {
                "answer": result["answer"],
                "references": result["references"],
            },
            status=status.HTTP_200_OK,
        )