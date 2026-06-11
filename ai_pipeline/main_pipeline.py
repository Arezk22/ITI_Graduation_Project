# داخل ai_pipeline/main_pipeline.py
from ai_pipeline.agents.state import TenderState
from ai_pipeline.agents.tender_graph import TenderWorkflow
from ai_pipeline.extractors.boq_router import BOQExtractionRouter
from langchain_openai import ChatOpenAI
# import os
# from dotenv import load_dotenv
# استدعاء نماذج LangChain المطلوبة هنا
 
def run_tender_analysis_job(tender_id: str, document_path: str, db_connection_string: str):
    """
    هذه هي الدالة التي سيقوم يوسف باستدعائها داخل مهام Celery (tasks.py)
    """
    print(f"🚀 بدء تشغيل الـ AI Pipeline للمناقصة: {tender_id}")
    
    # 1. مرحلة استخراج البيانات (Ingestion)
    # router = BOQExtractionRouter(vision_llm=...)
    # extracted_docs = router.process_document(document_path)
    
    # (هنا يتم تحويل المستندات إلى بيانات مهيكلة وحفظها في pgvector عبر get_vector_store)
    
    # بيانات وهمية مؤقتة لمحاكاة ما بعد الاستخراج
    initial_state = TenderState(
        tender_id=tender_id,
        user_query="قم بتحليل هذه المناقصة واكتشاف المخاطر",
        chat_history=[],
        extracted_boq=[{"item_no": "1", "description": "حديد تسليح", "unit_price": 35000}],
        extracted_text="يلتزم المقاول بدفع غرامة تأخير 10% في حال تجاوز المدة المحددة.",
        legal_flags=[],
        financial_deviations=[],
        final_response=""
    )
    # load_dotenv()
    # 2. تشغيل الـ LangGraph Workflow
    llm = ChatOpenAI(
        # api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o-mini", 
        temperature=0,
        # base_url="https://openrouter.ai/api/v1"
        )
    workflow = TenderWorkflow(llm=llm)
    
    print("🔄 جاري تمرير البيانات للوكلاء...")
    final_state = workflow.run(initial_state)
    
    # 3. إرجاع النتيجة النهائية
    # Celery سيأخذ هذه النتيجة ويحفظها في قاعدة بيانات Django (PostgreSQL)
    print("✅ اكتمل التحليل!")
    
    return {
        "tender_id": tender_id,
        "legal_summary": final_state.get("legal_flags"),
        "financial_summary": final_state.get("financial_deviations"),
        "report": final_state.get("final_response")
    }