from langchain_community.vectorstores import PGVector
from langchain_openai import OpenAIEmbeddings
import os

def get_vector_store(connection_string: str, collection_name: str):
    """
    تقوم هذه الدالة بتهيئة الاتصال بـ pgvector وإرجاع كائن VectorStore.
    يتم استدعاؤها من الـ Extractors (لإدخال البيانات) أو من الـ Agents (للبحث).
    """
    # تهيئة نموذج الـ Embeddings (مثلاً text-embedding-3-small لتقليل التكلفة)
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small", 
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # تهيئة الاتصال بـ PGVector
    vector_store = PGVector(
        connection_string=connection_string,
        embedding_function=embeddings,
        collection_name=collection_name,
        use_jsonb=True, # مفيد جداً لحفظ الـ Metadata مثل الأسعار وأرقام الصفحات
    )
    
    return vector_store

# مثال لكيفية استخدام الوكيل المالي لهذه الدالة:
# store = get_vector_store(db_url, "historical_prices")
# results = store.similarity_search_with_score("خرسانة مسلحة", k=3)