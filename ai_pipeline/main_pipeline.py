import os
from dotenv import load_dotenv
from langchain_core.documents import Document

from api.models import TenderFiles

from .extractors.document_processor import DocumentIntakeProcessor 
from .agents.tender_graph import EvaluationWorkflow
from .llm import vision_llm , text_llm , gemini_client
from .vector_store import save_documents_to_db ,prepare_documents_for_vector_db

load_dotenv()

vision_llm = vision_llm
text_llm = text_llm
gemini_client=gemini_client

db_connection_string = (
    f"postgresql+psycopg://"
    f"{os.getenv('DB_USER')}:"
    f"{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:"
    f"{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_NAME')}"
)

doc_processor = DocumentIntakeProcessor(vision_llm, text_llm,gemini_client)
workflow_app = EvaluationWorkflow(text_llm)

def run_tender_evaluation_job(tender):
    
    print(f"🚀 [AI Pipeline] Starting complete evaluation for tender: {tender_id}")
    tender_id=tender.id
    submission_ids = tender.submissions.filter(need_review=False).values_list('id', flat=True)
    
    initial_state = {
            "tender_id": tender_id,
            "submission_ids":submission_ids
        }

    print(f"🧠 Handing over data to Evaluation Agents (LangGraph)...")
    final_state = workflow_app.run(initial_state)
    
    print(f"✅ [AI Pipeline] Tender evaluation {tender_id} completed successfully!")
    

    


def index_files_for_rag(files):
    """
    Hook called (via a post_save signal) whenever a tender/submission file is uploaded.

    Intended to extract the file, chunk it, embed it, and store the vectors so the file
    can be used for RAG / multi-agent workflows.

    NOTE: the AI implementation is intentionally left as a stub for now. Wire it up to the
    extraction -> chunking -> pgvector pipeline (see process_and_store_tender) when ready,
    ideally off the request thread (e.g. a Celery task).
    """
    
    if not files.exists():
        return 

    if files[0].tender:
        type = "tender"
        id=files[0].tender.id
    else:
        type = "submission"
        id=files[0].submission.id
        
    files_data=doc_processor.process_files(files)
    
    if not files_data:
        if type=="tender":
            files[0].tender.analysis_status="invalid_documents"
        elif type == "submission":
            files[0].submission["need_review"]=True
        return
    
    structured_data = doc_processor.structure_to_unified_json(type,files_data)
    doc_processor.to_db(type,id,structured_data)
    
    if type=="tender":
        if db_connection_string:
            print(f"💾 Saving Employer Tender to Vector DB...")
            employer_docs = prepare_documents_for_vector_db(structured_data, {"doc_type": "employer_tender"})
            save_documents_to_db(
                documents=employer_docs, 
                connection_string=db_connection_string, 
                tender_id=id, 
                source_id="tender" 
            )



