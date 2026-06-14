import os
import json
from dotenv import load_dotenv

# التعديل 1: استدعاء الدالة الجديدة بدلاً من القديمة
from ai_pipeline.main_pipeline import run_tender_evaluation_job

# 1. تحميل المتغيرات البيئية من ملف .env
load_dotenv()

# التعديل 2: التأكد من وجود مفتاح OPENAI (الذي يستخدمه الـ Pipeline الآن)
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("⚠️ يرجى التأكد من إضافة OPENAI_API_KEY في ملف .env")

# 2. إعداد المتغيرات الوهمية للاختبار
# قم بإنشاء أو وضع ملفين PDF تجريبيين في نفس المجلد وقم بتسميتهما هكذا:
TEST_TENDER_FILE = "كراسة الشروط والمواصفات.pdf"         # كراسة شروط المالك
TEST_CONTRACTOR_FILE = "العرض الفني والمالي.pdf" # العرض الفني/المالي للمقاول

TEST_TENDER_ID = "test_tender_001"

# قواعد وأوزان التقييم التي يحددها المالك (لصالح الـ Scoring Agent)
EVALUATION_RULES = {
    "experience_weight": 30,
    "financial_weight": 20,
    "technical_weight": 50
}

# رابط قاعدة البيانات المحلي (لـ pgvector)
LOCAL_DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:1012@localhost:5433/iti_graduation_project")

def main():
    print("==================================================")
    print("🚀 Starting local AI Pipeline testing (Multi-Agent Evaluation)...")
    print("==================================================")

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"🔑 API Key Loaded Successfully (Length: {len(api_key)})")
        print(f"Starts with: {api_key[:12]}... Ends with: {api_key[-4:]}")
    else:
        print("❌ OPENAI_API_KEY is not set in the environment variables.")
        return
        
    # التأكد من وجود الملفات التجريبية قبل البدء
    if not os.path.exists(TEST_TENDER_FILE):
        print(f"❌ Tender file not found: {TEST_TENDER_FILE}")
        print("Please add the Employer's PDF file and try again.")
        return
        
    if not os.path.exists(TEST_CONTRACTOR_FILE):
        print(f"❌ Contractor file not found: {TEST_CONTRACTOR_FILE}")
        print("Please add the Contractor's PDF file and try again.")
        return

    # تجهيز قائمة المقاولين المتقدمين (يمكنك إضافة أكثر من مقاول لاحقاً)
    contractor_files_list = [
        {
            "id": "Contractor_A",
            "path": TEST_CONTRACTOR_FILE
        }
    ]

    # 3. تشغيل الـ Pipeline بالكامل
    try:
        result = run_tender_evaluation_job(
            tender_id=TEST_TENDER_ID,
            tender_file_path=TEST_TENDER_FILE,
            contractor_files=contractor_files_list,
            evaluation_rules=EVALUATION_RULES,
            db_connection_string=LOCAL_DB_URL
        )

        # 4. طباعة النتائج بشكل منسق للتأكد من شكل الـ JSON
        print("\n==================================================")
        print("🎉 Final Evaluation Result (JSON Output):")
        print("==================================================")
        # ensure_ascii=False لضمان طباعة الحروف العربية بشكل سليم بدلاً من الرموز
        print(json.dumps(result, ensure_ascii=False, indent=4))

    except Exception as e:
        print(f"\n❌ Failed to run the test due to the following error: {e}")

if __name__ == "__main__":
    main()