import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

def chunk_documents(extracted_pages, chunk_size=1000, chunk_overlap=200):
    logger.info("Starting document chunking process...")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    all_chunks = []
    
    try:
        for page_data in extracted_pages:
            page_num = page_data["page_number"]
            page_text = page_data["text"]
            
            chunks = text_splitter.split_text(page_text)
            
            for chunk_index, chunk_text in enumerate(chunks):
                all_chunks.append({
                    "content": chunk_text,
                    "metadata": {
                        "page_number": page_num,
                        "chunk_index": chunk_index
                    }
                })
                
        logger.info(f"Successfully created {len(all_chunks)} chunks from {len(extracted_pages)} pages.")
        return all_chunks
        
    except Exception as e:
        logger.error(f"Failed during chunking: {str(e)}")
        raise Exception(f"Error chunking the document: {str(e)}")