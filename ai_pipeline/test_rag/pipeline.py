# ai_agent/pipeline.py

from asyncio.log import logger
from .rag_chain import extract_pdf_content
from .rag_chain import chunk_documents
from .rag_chain import store_chunks_in_pgvector, get_chat_response_stream

def process_and_store_tender(pdf_source, connection_string, collection_name):
  """
  This function extracts the content of a PDF file, chunks it, and stores the chunks in a vector database.
  """
  pages = extract_pdf_content(pdf_source)
  chunks = chunk_documents(pages)
  vector_store = store_chunks_in_pgvector(
      chunks=chunks, 
      connection_string=connection_string, 
      collection_name=collection_name
  )

  return len(chunks)

def ask_tender_question(query, connection_string, collection_name):
  """
  This function asks a question about a tender and returns the streaming response.
  """
  try:
    return get_chat_response_stream(
      query=query, 
      connection_string=connection_string, 
      collection_name=collection_name
    )
  except Exception as e:
    logger.error(f"Error asking tender question: {str(e)}")
    raise e