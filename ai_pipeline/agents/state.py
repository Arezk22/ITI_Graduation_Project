from typing import TypedDict, Annotated, List, Dict, Any
import operator

# State for the Multi-Agent Tender Pipeline
class TenderState(TypedDict):
    tender_id: str                # معرف المناقصة
    user_query: str               # سؤال أو طلب المستخدم
    chat_history: List[Any]       # تاريخ المحادثة (للـ Document Chat)
    
    # هذه البيانات ستأتي لاحقاً من الـ Extractors
    extracted_boq: List[Dict[str, Any]]  # بيانات المقايسة
    extracted_text: str           # النصوص القانونية والشروط
    
    # مخرجات الوكلاء (Agents Outputs)
    legal_flags: Annotated[List[str], operator.add] # الثغرات والمخاطر القانونية
    financial_deviations: List[Dict[str, Any]]      # حسابات الانحراف المالي للأسعار
    
    final_response: str           # الرد النهائي الذي سيتم إرساله للـ UI