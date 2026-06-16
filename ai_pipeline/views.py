import json
import os
import tempfile

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from ai_pipeline.main_pipeline import run_tender_evaluation_job
from ai_pipeline.vector_store import search_documents
from langchain_openai import ChatOpenAI


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


@csrf_exempt
@require_POST
def evaluate_tender(request):
    """API endpoint to receive tender and contractor files, then run the AI evaluation pipeline."""
    tender_file = request.FILES.get('tender_file')
    contractor_files = request.FILES.getlist('contractor_files')
    contractor_ids_raw = request.POST.get('contractor_ids')
    evaluation_rules_raw = request.POST.get('evaluation_rules')
    tender_id = request.POST.get('tender_id') or request.POST.get('tender_title') or None

    if not tender_file:
        return JsonResponse({'status': 'error', 'message': 'Missing tender_file.'}, status=400)

    if not contractor_files:
        return JsonResponse({'status': 'error', 'message': 'Missing contractor_files.'}, status=400)

    if not contractor_ids_raw:
        return JsonResponse({'status': 'error', 'message': 'Missing contractor_ids.'}, status=400)

    try:
        contractor_ids = json.loads(contractor_ids_raw)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'contractor_ids must be valid JSON list.'}, status=400)

    if len(contractor_ids) != len(contractor_files):
        return JsonResponse({
            'status': 'error',
            'message': 'Number of contractor_ids must match number of contractor_files.'
        }, status=400)

    try:
        evaluation_rules = json.loads(evaluation_rules_raw) if evaluation_rules_raw else {}
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'evaluation_rules must be valid JSON.'}, status=400)

    temp_paths = []
    try:
        tender_path = _save_uploaded_file(tender_file)
        temp_paths.append(tender_path)

        contractor_doc_list = []
        for idx, contractor_file in enumerate(contractor_files):
            contractor_path = _save_uploaded_file(contractor_file)
            temp_paths.append(contractor_path)
            contractor_doc_list.append({
                'id': contractor_ids[idx],
                'path': contractor_path,
            })

        if not tender_id:
            tender_id = os.path.splitext(os.path.basename(tender_file.name))[0]

        db_connection_string = os.getenv('VECTOR_DB_CONNECTION_STRING', None)

        result = run_tender_evaluation_job(
            tender_id=tender_id,
            tender_file_path=tender_path,
            contractor_files=contractor_doc_list,
            evaluation_rules=evaluation_rules,
            db_connection_string=db_connection_string,
        )

        return JsonResponse(result, safe=False)

    except Exception as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=500)

    finally:
        for path in temp_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except OSError:
                pass


def _build_rag_prompt(query, documents):
    """Build a prompt that includes retrieved documents and the user query."""
    docs_text = []
    for index, doc in enumerate(documents, start=1):
        metadata = doc.get('metadata', {}) or {}
        source_id = metadata.get('source_id', 'unknown')
        score = doc.get('score', None)
        doc_content = doc.get('content', '')
        docs_text.append(
            f"Document {index} (source: {source_id}, score: {score})\n{doc_content}"
        )

    return f"""You are a construction tender AI assistant.
Use ONLY the following documents to answer the question. Do NOT invent any information.
If the answer cannot be determined from the documents, say: 'There is no enough information to provide the answer.'

Context documents:
{''.join(['\n\n---\n\n' + d for d in docs_text])}

User question:
{query}

Answer in English:"""


def _run_rag_query(tender_id, query, top_k=5):
    db_connection_string = os.getenv('DATABASE_URL') or os.getenv('VECTOR_DB_CONNECTION_STRING')
    if not db_connection_string:
        raise RuntimeError('Vector DB connection string not configured.')

    documents = search_documents(db_connection_string, tender_id, query, top_k=top_k)
    if not documents:
        raise RuntimeError('No reference documents found for this tender.')

    llm = ChatOpenAI(
        model='gpt-4o-mini',
        temperature=0,
        api_key=os.getenv('OPENAI_API_KEY'),
        openai_api_base=os.getenv('OPENAI_API_BASE')
    )

    prompt = _build_rag_prompt(query, documents)
    response = llm.invoke(prompt)
    answer = getattr(response, 'content', str(response))

    return {
        'query': query,
        'answer': answer,
        'references': documents,
    }


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
        response = _run_rag_query(tender_id, query, top_k=top_k)
        return JsonResponse({'status': 'success', 'data': response})
    except Exception as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=500)

