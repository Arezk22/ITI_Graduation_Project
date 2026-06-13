import os
from langchain_openai import ChatOpenAI

# استدعاء المكونات التي قمنا ببرمجتها
from .extractors.boq_router import BOQExtractionRouter
from .vector_store import save_documents_to_db
from .agents.tender_graph import TenderWorkflow
from langchain_google_genai import ChatGoogleGenerativeAI

def run_tender_analysis_job(tender_id: str, file_path: str, db_connection_string: str) -> dict:
    """
    الدالة الرئيسية (Master Function) التي تدير دورة حياة التحليل بالكامل.
    يتم استدعاؤها من داخل Django/Celery.
    """
    # print(f"🚀 [AI Pipeline] بدء تحليل المناقصة رقم: {tender_id}")
    print(f"starting analysis for tender number 🚀 {tender_id}")

    
    try:
        # 1. تهيئة النماذج الذكية
        # نستخدم gpt-4o-mini لأنه يوازن بشكل ممتاز بين الدقة والتكلفة
        llm = ChatOpenAI(
            model="meta-llama/llama-3.2-11b-vision-instruct", 
            temperature=0, # صفر لضمان دقة التحليل المالي والقانوني بدون "هلوسة"
            api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE")
        )
        # llm = ChatGoogleGenerativeAI(
        #     model="gemini-2.5-flash", 
        #     temperature=0, # صفر لضمان دقة التحليل المالي والقانوني بدون "هلوسة"
        #     api_key=os.getenv("GOOGLE_API_KEY"),
        # )
        vision_llm = ChatOpenAI(
            model="meta-llama/llama-3.2-11b-vision-instruct", 
            max_tokens=1500, 
            api_key=os.getenv("OPENAI_API_KEY"), 
            openai_api_base=os.getenv("OPENAI_API_BASE")
        )
        # vision_llm = ChatGoogleGenerativeAI(
        #     model="gemini-2.5-flash", 
        #     max_tokens=1500, 
        #     api_key=os.getenv("GOOGLE_API_KEY"),  
        # )

        # ==========================================
        # المرحلة الأولى: استخراج البيانات وتجهيزها
        # ==========================================
        # print("📂 [الخطوة 1/3] جاري استخراج البيانات من الملف...")
        print("[step 1/3] extracting data from the file 📂")
        extractor = BOQExtractionRouter(vision_llm=vision_llm)
        documents = extractor.process_document(file_path)
        
        if not documents:
            # return {"status": "error", "message": "لم يتم العثور على محتوى قابل للقراءة في الملف."}
            print("No documents extracted from the file.")
            return {"status": "error", "message": "No readable content found in the file."}


        # فصل البيانات لتناسب الـ State الخاصة بالوكلاء
        # الوكيل القانوني يحتاج نصوصاً، والوكيل المالي يحتاج JSON
        extracted_boq = [doc.metadata for doc in documents if doc.metadata.get("source_type") == "boq_table"]
        extracted_text = "\n".join([doc.page_content for doc in documents if doc.metadata.get("source_type") != "boq_table"])
        
        # إذا كان الـ PDF يحتوي فقط على جداول، نضع النصوص من الجداول كبديل مبدئي
        if not extracted_text:
            print("Not Extracted any plain text, using table data as fallback for legal analysis.")
            extracted_text = "\n".join([doc.page_content for doc in documents])

        # ==========================================
        # المرحلة الثانية: بناء الذاكرة للبحث (RAG)
        # ==========================================
        # print("🧠 [الخطوة 2/3] جاري حفظ البيانات في قاعدة المتجهات (pgvector)...")
        print("[step 2/3] loading saved data to vector store 🧠")

        db_success = save_documents_to_db(documents, db_connection_string, tender_id)
        if not db_success:
            # print("⚠️ تحذير: حدثت مشكلة في التخزين، قد يتأثر الشات لاحقاً.")
            print("⚠️ Warning: A storage issue occurred, which may affect the chat later.")

        # ==========================================
        # المرحلة الثالثة: إطلاق الوكلاء (LangGraph)
        # ==========================================
        # print("🤖 [الخطوة 3/3] جاري تشغيل الوكلاء (القانوني والمالي)...")
        print("[step 3/3] running agents 🤖")

        workflow = TenderWorkflow(llm=llm, db_connection_string=db_connection_string)
        
        # تهيئة الذاكرة المشتركة للوكلاء
        initial_state = {
            "tender_id": tender_id,
            "user_query": "Please provide a comprehensive report on the legal and financial risks.", # طلب صريح للـ Router لتشغيل التحليل
            "extracted_text": extracted_text,
            "analysis_mode": True,
            "extracted_boq": extracted_boq,
            "chat_history": []
        }

        # initial_state["analysis_mode"] = True
        
        # تشغيل شبكة الوكلاء
        final_state = workflow.run(initial_state)

        # ==========================================
        # التجميع النهائي وتسليم النتائج
        # ==========================================
        # print(f"✅ [AI Pipeline] اكتمل التحليل للمناقصة {tender_id} بنجاح!")
        print(f"✅ [AI Pipeline] Tender analysis for tender {tender_id} completed successfully!")
        
        return {
            "status": "success",
            "tender_id": tender_id,
            "legal_flags": final_state.get("legal_flags", []),
            "financial_deviations": final_state.get("financial_deviations", []),
            "executive_summary": final_state.get("final_response", "")
        }

    except Exception as e:
        # print(f"❌ [AI Pipeline Error] حدث خطأ قاتل أثناء التحليل: {e}")
        print(f"❌ [AI Pipeline Error] A critical error occurred during analysis: {e}")
        return {
            "status": "error",
            "tender_id": tender_id,
            "message": str(e)
        }