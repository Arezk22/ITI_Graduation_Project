# state.py
from typing import TypedDict, List, Dict, Any
import operator
from .tender_graph import RiskAssessment ,TechnicalEvaluation,FinancialEvaluation,ValidationResult,ComparisonResult,RecommendationResult


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