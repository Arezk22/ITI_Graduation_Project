# state.py
from typing import TypedDict, List, Dict, Any
import operator

# هيكل البيانات الخاص بكل مقاول متقدم للمناقصة
class ContractorData(TypedDict):
    contractor_id: str              # معرف فريد للمقاول (مثل اسم الشركة)
    file_path: str                  # مسار ملف عرض المقاول (Tender/BOQ Proposal)
    file_type: str                  # نوع الملف (scanned_pdf, native_pdf, excel, word)
    raw_extracted_content: Any      # النصوص أو الجداول الخام المستخرجة قبل الهيكلة
    structured_data: Dict[str, Any] # البيانات بعد تنظيمها بواسطة Structuring Agent (JSON موحد)
    validation_status: Dict[str, Any] # نتيجة الفحص والامتثال (مستوفي/غير مستوفي مع الأسباب)
    scores: Dict[str, float]        # درجات التقييم الفني والمالي والخبرة
    risk_items: List[Dict[str, Any]] # عناصر المخاطر والتسعير المكتشفة
    legal_flags: List[str]          # المخالفات القانونية والشروط المعدلة من المقاول
    recommendation: str             # التوصية النهائية (Qualified أو Needs Review)

# الحالة العامة للنظام (Global Tender State)
class TenderState(TypedDict):
    tender_id: str                      # معرف المناقصة الكلية التابعة للمالك
    tender_requirements: Dict[str, Any]     # الشروط والمواصفات القانونية المستخرجة من كراسة المالك
    evaluation_rules: Dict[str, float]      # أوزان التقييم (خبرة، مالي، فني) المدخلة من المالك
    historical_prices: Dict[str, float]     # الأسعار التاريخية لبنود المقايسة (BOQ) للتحليل المالي
    
    contractors: List[ContractorData]       # قائمة المقاولين المتقدمين للمناقصة وتحليلاتهم
    final_ranking: List[Dict[str, Any]]     # الترتيب النهائي للمقاولين بعد المقارنة
    
    user_query: str                         # الاستفسارات الإضافية (إن وجدت)
    chat_history: List[Any]                 # تاريخ المحادثة
    final_response: str                     # التقرير التنفيذي الشامل والنهائي للنظام