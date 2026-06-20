# state.py
from typing import TypedDict, List, Dict, Any
import operator
from .tender_graph import RiskAssessment ,TechnicalEvaluation,FinancialEvaluation,ValidationResult,ComparisonResult,RecommendationResult
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
    tender_id: int

    submission_ids: list[int]

    validation_results: ValidationResult
    
    risk_result: RiskAssessment

    technical_evaluation:TechnicalEvaluation
    
    financial_evaluation:FinancialEvaluation
    
    evaluation_results: dict
    
    final_score:list

    final_ranking: list
    
    comparison_result:ComparisonResult

    recommendatin_result:RecommendationResult
    
    user_query: str

    final_response: str                     