import os
from ai_pipeline.test.extractor import extract_pdf_content
from ai_pipeline.test.partitioner import chunk_documents

# اسم ملف الـ PDF اللي هنجرب عليه
PDF_PATH = "E:/Iti6month/Graduation Project/BuildTender_AI_Features.pdf"

def run_test():
    if not os.path.exists(PDF_PATH):
        print(f"❌ File '{PDF_PATH}' does not exist")
        return

    print("⏳ starting reading file and extract text ...")
    try:
        pages = extract_pdf_content(PDF_PATH)
        print(f"✅ done! procces successfull {len(pages)} pages.")
        
        if pages:
            chunks = chunk_documents(pages)
            first_page = pages[0]
            print(f"\n--- part from content page number {first_page['page_number']} ---")
            print(first_page['text'][:300] + "\n...")
            print("--------------------------------------")
            print(f"✅ done chunked file {len(chunks)} Chunks.")
            print(f"🔍 meta data to first Chunk: {chunks[0]['metadata']}")
            
    except Exception as e:
        print(f"❌ error : {e}")

if __name__ == "__main__":
    run_test()