import os
import logging
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import PGVector
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

logger = logging.getLogger(__name__)

def get_embeddings():
  return OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

def get_vector_store(connection_string, collection_name="tender_documents"):
  return PGVector(
    connection_string=connection_string,
    embedding=get_embeddings(),
    collection_name=collection_name,
    use_jsonb=True
  )

def store_chunks_in_pgvector(chunks, connection_string, collection_name="tender_documents"):
  logger.info("Starting embedding and storing chunks in pgvector...")
  try:
    documents = [
      Document(page_content=chunk["text"], metadata=chunk["metadata"]) for chunk in chunks
    ]    
    vector_store = PGVector.from_documents(
      documents=documents,
      embedding=get_embeddings(),
      collection_name=collection_name,
      connection_string=connection_string,
      pre_delete_collection=False
    )
    logger.info(f"Successfully stored {len(documents)} chunks in database.")
    return vector_store
  except Exception as e:
    logger.error(f"Failed to store chunks in database: {str(e)}")
    raise e

# =============================== RAG CHAIN ===============================

RAG_SYSTEM_PROMPT = """
You are an expert engineering and legal assistant specialized in analyzing construction tenders.
Use the following pieces of retrieved context to answer the question.
If you don't know the answer or the answer is not in the context, say "I cannot find the answer in the provided document."
Do not invent or hallucinate information.

Context:
{context}

Question:
{question}

Answer in Arabic unless requested otherwise. Always mention the page number(s) you relied on at the end of your answer based on the context metadata.
"""

def format_docs(docs):
  formatted_texts = []
    for doc in docs:
        page_num = doc.metadata.get("page_number", "Unknown")
        formatted_texts.append(f"[Page {page_num}]: {doc.page_content}")
    return "\n\n".join(formatted_texts)

# search in pdf and get response streaming to real time feel in UI
def get_chat_response_stream(query, connection_string, collection_name="tender_documents"):
  logger.info(f"Processing query: {query}")
  vector_store = get_vector_store(connection_string, collection_name)
  retriever = vector_store.as_retriever(search_kwargs={"k": 4}) # Get the top 4 most relevant documents
  llm=ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    streaming=True,
    api_key=os.getenv("OPENAI_API_KEY")
  )
  prompt = ChatPromptTemplate.from_template(RAG_SYSTEM_PROMPT)
  rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

  return rag_chain.stream(query)