import os
import json
from dotenv import load_dotenv
from ai_pipeline.main_pipeline import run_tender_analysis_job

# 1. تحميل المتغيرات البيئية من ملف .env
load_dotenv()

# التأكد من وجود مفتاح OpenAI
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("⚠️ يرجى التأكد من إضافة OPENAI_API_KEY في ملف .env")

# 2. إعداد المتغيرات الوهمية للاختبار
# ضع أي ملف PDF تجريبي في نفس المجلد وقم بتسميته هكذا:
TEST_FILE_PATH = "E:\Iti6month\Graduation Project\Graduation_project\sample-form-of-tender.pdf" 
TEST_TENDER_ID = "test_tender_001"

# رابط قاعدة البيانات المحلي
# لتجنب تعقيدات إعداد البنية التحتية محلياً، اطلب من أحمد هشام 
# توفير رابط قاعدة بيانات (PostgreSQL مع pgvector) تعمل محلياً لديك أو على سيرفر تجريبي
LOCAL_DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:1012@localhost:5433/iti_graduation_project")

def main():
    print("==================================================")
    print("🚀 Starting local AI Pipeline testing...")
    print("==================================================")

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"🔑 API Key Loaded Successfully (Length: {len(api_key)})")
        print(f"Starts with: {api_key[:12]}... Ends with: {api_key[-4:]}")
    else:
        print("❌ OPENAI_API_KEY is not set in the environment variables.")
        return
    # التأكد من وجود الملف التجريبي قبل البدء
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ File not found: {TEST_FILE_PATH}")
        print("Please add a PDF file with this name to the same directory as the script and try the command again.")
        return

    # 3. تشغيل الـ Pipeline بالكامل
    try:
        result = run_tender_analysis_job(
            tender_id=TEST_TENDER_ID,
            file_path=TEST_FILE_PATH,
            db_connection_string=LOCAL_DB_URL
        )

        # 4. طباعة النتائج بشكل منسق للتأكد من شكل الـ JSON
        print("\n==================================================")
        print("🎉 Final Result (JSON Output):")
        print("==================================================")
        # ensure_ascii=False لضمان طباعة الحروف العربية بشكل سليم بدلاً من الرموز
        print(json.dumps(result, ensure_ascii=False, indent=4))

    except Exception as e:
        print(f"\n❌ Failed to run the test due to the following error: {e}")

if __name__ == "__main__":
    main()