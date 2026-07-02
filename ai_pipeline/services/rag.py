import os
from dotenv import load_dotenv
from ai_pipeline.vector_store import search_documents
from ai_pipeline.llm import text_llm


load_dotenv()
class RagAgent:
    
    def __init__(self):
        self.llm= text_llm
        self.db_connection_string = (
    f"postgresql+psycopg://"
    f"{os.getenv('DB_USER')}:"
    f"{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:"
    f"{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_NAME')}"
)
    
    def _build_rag_prompt(self,query, documents):
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

    """


    def run_rag_query(self,tender_id, query, top_k=5):
        db_connection_string = self.db_connection_string
        if not db_connection_string:
            raise RuntimeError('Vector DB connection string not configured.')

        documents = search_documents(db_connection_string, tender_id, query, top_k=top_k)
        if not documents:
            raise RuntimeError('No reference documents found for this tender.')


        prompt = self._build_rag_prompt(query, documents)
        response = self.llm.invoke(prompt)
        answer = getattr(response, 'content', str(response))

        return {
            'query': query,
            'answer': answer,
            'references': documents,
        }


    