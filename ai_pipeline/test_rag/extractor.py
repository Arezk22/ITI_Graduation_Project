import pdfplumber
import logging


logger = logging.getLogger(__name__)

def extract_pdf_content(pdf_source):
    extracted_pages = []    
    logger.info("Starting PDF extraction process...")
    
    try:
        with pdfplumber.open(pdf_source) as pdf:
            total_pages = len(pdf.pages)
            logger.info(f"Successfully opened PDF. Total pages found: {total_pages}")
            
            for index, page in enumerate(pdf.pages):
                page_number = index + 1  
                
                text = page.extract_text(layout=True)
                
                if text and text.strip():
                    extracted_pages.append({
                        "page_number": page_number,
                        "text": text.strip()
                    })
                else:
                    logger.warning(f"Page {page_number} seems to be empty or unreadable (maybe it's a scanned image).")
                    
        logger.info("PDF extraction completed successfully.")
        return extracted_pages
        
    except Exception as e:
        logger.error(f"Failed to extract PDF: {str(e)}")
        raise Exception(f"Error processing the PDF file: {str(e)}")