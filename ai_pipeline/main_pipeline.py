# main_pipeline.py
import os
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# استدعاء المكونات اللي برمجناها
from .extractors.document_processor import DocumentIntakeProcessor
from .agents.tender_graph import EvaluationWorkflow

# 🌟 التعديل الجديد: استدعاء دالة حفظ البيانات في الـ Vector Store
from .vector_store import save_documents_to_db 

def prepare_documents_for_vector_db(raw_content, base_metadata: dict = None) -> list[Document]:
    """
    دالة مساعدة لتحويل النصوص الخام أو الجداول إلى قائمة من كائنات Document 
    جاهزة للحفظ في قاعدة البيانات وتقسيم النصوص الطويلة لتجنب مشاكل الـ Tokens.
    """
    if base_metadata is None:
        base_metadata = {}
        
    docs = []
    
    # 1. إذا كان المحتوى عبارة عن نصوص (Word, PDF)
    if isinstance(raw_content, str):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=150
        )
        chunks = text_splitter.split_text(raw_content)
        for chunk in chunks:
            docs.append(Document(page_content=chunk, metadata=base_metadata.copy()))
            
    # 2. إذا كان المحتوى عبارة عن قواميس/جداول (Excel)
    elif isinstance(raw_content, dict):
        for sheet_name, rows in raw_content.items():
            for row in rows:
                # دمج بيانات الصف في نص واحد مقروء
                content_parts = [f"{k}: {v}" for k, v in row.items() if str(v).strip()]
                if not content_parts:
                    continue
                content = " | ".join(content_parts)
                row_meta = base_metadata.copy()
                row_meta["sheet_name"] = sheet_name
                docs.append(Document(page_content=content, metadata=row_meta))
                
    return docs


def run_tender_evaluation_job(
    tender_id: str, 
    tender_file_path: str, 
    contractor_files: list[dict], # مسارات ملفات المقاولين بالشكل: [{"id": "Cont_A", "path": "file.pdf"}]
    evaluation_rules: dict,       # الأوزان مثلاً {"experience": 30, "financial": 20, "technical": 50}
    db_connection_string: str = None
) -> dict:
    """
    الدالة الرئيسية (Master Function) التي تدير دورة حياة التحليل بالكامل.
    تربط بين معالجة المستندات وشبكة وكلاء التقييم.
    """
    print(f"🚀 [AI Pipeline] Starting complete evaluation for tender: {tender_id}")

    try:
        # ==========================================
        # 1. تهيئة النماذج الذكية والأنظمة
        # ==========================================
        vision_llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE")
        )
        
        text_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0, 
            api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE")
        )

        doc_processor = DocumentIntakeProcessor(vision_llm, text_llm)
        workflow_app = EvaluationWorkflow(text_llm)

        # ==========================================
        # 2. معالجة مستند المناقصة (المالك) وحفظه في الـ Vector DB
        # ==========================================
        print(f"📂 Processing Employer Tender File...")
        tender_type = doc_processor.intake_and_route(tender_file_path)
        tender_raw_content = doc_processor.extract_content(tender_file_path, tender_type)
        tender_requirements = doc_processor.structure_to_unified_json(tender_raw_content)

        # 🌟 التعديل الجديد: حفظ ملف المالك في قاعدة البيانات
        if db_connection_string:
            print(f"💾 Saving Employer Tender to Vector DB...")
            employer_docs = prepare_documents_for_vector_db(tender_raw_content, {"doc_type": "employer_tender"})
            save_documents_to_db(
                documents=employer_docs, 
                connection_string=db_connection_string, 
                tender_id=tender_id, 
                source_id="employer_tender" # تمييز الملف بأنه خاص بالمالك
            )

        # ==========================================
        # 3. معالجة مستندات المقاولين وحفظها في الـ Vector DB
        # ==========================================
        contractors_state_list = []
        for contractor in contractor_files:
            c_id = contractor["id"]
            c_path = contractor["path"]
            
            print(f"📂 Processing Proposal for Contractor: {c_id}...")
            c_type = doc_processor.intake_and_route(c_path)
            c_raw = doc_processor.extract_content(c_path, c_type)
            c_structured = doc_processor.structure_to_unified_json(c_raw)
            
            # 🌟 التعديل الجديد: حفظ ملف المقاول في قاعدة البيانات
            if db_connection_string:
                print(f"💾 Saving Proposal for {c_id} to Vector DB...")
                contractor_docs = prepare_documents_for_vector_db(c_raw, {"doc_type": "contractor_proposal"})
                save_documents_to_db(
                    documents=contractor_docs, 
                    connection_string=db_connection_string, 
                    tender_id=tender_id, 
                    source_id=c_id # تمييز الملف بالـ ID الخاص بالمقاول
                )

            # بناء الهيكل المبدئي للمقاول
            contractors_state_list.append({
                "contractor_id": c_id,
                "file_path": c_path,
                "file_type": c_type,
                "raw_extracted_content": c_raw,
                "structured_data": c_structured,
                "validation_status": {},
                "scores": {},
                "risk_items": [],
                "legal_flags": [],
                "recommendation": ""
            })

        # ==========================================
        # 4. بناء الـ Initial State وتمريره لشبكة الوكلاء (LangGraph)
        # ==========================================
        initial_state = {
            "tender_id": tender_id,
            "tender_requirements": tender_requirements,
            "evaluation_rules": evaluation_rules,
            "historical_prices": {}, 
            "contractors": contractors_state_list,
            "final_ranking": [],
            "user_query": "",
            "chat_history": [],
            "final_response": ""
        }

        print(f"🧠 Handing over data to Evaluation Agents (LangGraph)...")
        final_state = workflow_app.run(initial_state)

        # ==========================================
        # 5. التجميع النهائي وتسليم النتائج
        # ==========================================
        print(f"✅ [AI Pipeline] Tender evaluation {tender_id} completed successfully!")
        
        return {
            "status": "success",
            "tender_id": tender_id,
            "tender_requirements": final_state.get("tender_requirements", {}),
            "final_ranking": final_state.get("final_ranking", []),
            "contractors_details": final_state.get("contractors", [])
        }

    except Exception as e:
        print(f"❌ [AI Pipeline Error] A critical error occurred: {e}")
        return {
            "status": "error",
            "tender_id": tender_id,
            "error_message": str(e)
        }