import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import PGVector
from langchain_google_genai import GoogleGenerativeAIEmbeddings

def get_vector_store(connection_string: str, collection_name: str) -> PGVector:
    """
    تهيئة الاتصال بـ pgvector وإرجاع كائن VectorStore.
    يتم استدعاء هذه الدالة عند الحفظ (Ingestion) أو عند البحث (Retrieval).
    """
    # استخدام نموذج text-embedding-3-small لأنه أسرع وأرخص بـ 5 مرات من الإصدار القديم
    # مع الحفاظ على كفاءة ممتازة في البحث الدلالي
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small", 
        api_key=os.getenv("OPENAI_API_KEY"),
        openai_api_base=os.getenv("OPENAI_API_BASE")
    )
    # embeddings = GoogleGenerativeAIEmbeddings(
    #     model="models/text-embedding-004", 
    #     api_key=os.getenv("GOOGLE_API_KEY"),        
    # )

    # تهيئة الاتصال بقاعدة بيانات PostgreSQL بملحق pgvector
    vector_store = PGVector(
        connection_string=connection_string,
        embedding_function=embeddings,
        collection_name=collection_name,
        use_jsonb=True, # 🌟 تفعيل هذا الخيار ضروري جداً لتخزين الـ Metadata كـ JSON 
    )
    
    return vector_store

def save_documents_to_db(documents: list, connection_string: str, tender_id: str) -> bool:
    """
    دالة مساعدة لاستلام الـ Documents من الـ Extractor وحفظها في قاعدة البيانات.
    سيتم استدعاؤها في الـ Pipeline الرئيسي.
    """
    if not documents:
        # print("⚠️ لا توجد مستندات مستخرجة لحفظها.")
        print("⚠️ No documents extracted to save.")
        return False
        
    collection_name = f"tender_{tender_id}"
    # print(f"⏳ جاري حفظ {len(documents)} مستند في قاعدة البيانات (Collection: {collection_name})...")
    print(f"saving {len(documents)} documents to the database (Collection: {collection_name})...")
    
    try:
        vector_store = get_vector_store(connection_string, collection_name)
        vector_store.add_documents(documents)
        # print("✅ تم تخزين البيانات بنجاح في pgvector.")
        print("Data successfully stored in pgvector ✅.")
        return True
    except Exception as e:
        # print(f"❌ حدث خطأ أثناء الحفظ في قاعدة البيانات: {e}")
        print(f"❌ Error occurred while saving to the database: {e}")
        return False