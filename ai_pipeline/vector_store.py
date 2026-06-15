import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import PGVector
from langchain_google_genai import GoogleGenerativeAIEmbeddings

def get_vector_store(connection_string: str, collection_name: str) -> PGVector:
    """
    تهيئة الاتصال بـ pgvector وإرجاع كائن VectorStore.
    """
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small", 
        api_key=os.getenv("OPENAI_API_KEY"),
        openai_api_base=os.getenv("OPENAI_API_BASE")
    )

    # تهيئة الاتصال بقاعدة بيانات PostgreSQL بملحق pgvector
    vector_store = PGVector(
        connection_string=connection_string,
        embedding_function=embeddings,
        collection_name=collection_name,
        use_jsonb=True, # 🌟 تفعيل هذا الخيار ضروري جداً لتخزين الـ Metadata كـ JSON 
    )
    
    return vector_store

def save_documents_to_db(documents: list, connection_string: str, tender_id: str, source_id: str = "employer_tender") -> bool:
    """
    دالة مساعدة لحفظ الـ Documents في قاعدة البيانات مع تمييز مصدرها (مالك أو مقاول).
    """
    if not documents:
        print(f"⚠️ No documents extracted to save for source: {source_id}.")
        return False
        
    # حقن الـ source_id والـ tender_id في الـ Metadata لكل مستند عشان نقدر نفلتر بيهم وقت الشات
    for doc in documents:
        if isinstance(doc.metadata, dict):
            doc.metadata["source_id"] = source_id
            doc.metadata["tender_id"] = tender_id
            
    collection_name = f"tender_{tender_id}"
    print(f"saving {len(documents)} documents to the database (Collection: {collection_name} | Source: {source_id})...")
    
    try:
        vector_store = get_vector_store(connection_string, collection_name)
        vector_store.add_documents(documents)
        print(f"Data successfully stored in pgvector for {source_id} ✅.")
        return True
    except Exception as e:
        print(f"❌ Error occurred while saving {source_id} to the database: {e}")
        return False


def search_documents(connection_string: str, tender_id: str, query: str, top_k: int = 5) -> list[dict]:
    """Search the vector store for a tender and return the top matching documents."""
    collection_name = f"tender_{tender_id}"
    vector_store = get_vector_store(connection_string, collection_name)

    try:
        results = vector_store.similarity_search(query, k=top_k)
    except Exception:
        try:
            results = vector_store.similarity_search_with_score(query, k=top_k)
        except Exception as exc:
            raise RuntimeError(f"Vector search failed: {exc}")

    output = []
    for item in results:
        if isinstance(item, tuple) and len(item) == 2:
            doc, score = item
        else:
            doc, score = item, None

        output.append({
            "content": getattr(doc, "page_content", ""),
            "metadata": getattr(doc, "metadata", {}),
            "score": score,
        })
    return output