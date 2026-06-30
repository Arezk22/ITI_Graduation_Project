# state.py
from typing import TypedDict, List, Dict, Any
from pydantic import BaseModel, Field
from typing import List, Literal


class ValidationResult(BaseModel):
    mandatory_passed: bool = Field(
        description="True if all mandatory tender requirements are satisfied."
    )

    compliance_score: int = Field(
        ge=0,
        le=100,
        description="Overall compliance score."
    )

    missing_documents: list[str] = Field(default_factory=list)

    missing_certificates: list[str] = Field(default_factory=list)

    missing_licenses: list[str] = Field(default_factory=list)

    technical_gaps: list[str] = Field(default_factory=list)

    warnings: list[str] = Field(
        default_factory=list,
        description="Optional recommendations or minor issues."
    )

    summary: str = Field(
        description="Short explanation of the compliance evaluation."
    )

class RiskAssessment(BaseModel):
    risk_score: int = Field(ge=0, le=100)

    overall_risk: Literal[
        "Very Low",
        "Low",
        "Moderate",
        "High",
        "Critical"
    ]

    summary: str

    top_risks: List[str]
    
class TechnicalEvaluation(BaseModel):
    technical_score: int = Field(ge=0, le=100)

    summary: str

    strengths: List[str]

    weaknesses: List[str]
    
    
class FinancialEvaluation(BaseModel):

    financial_score: int = Field(ge=0, le=100)

    total_bid_price: float

    budget_compliance: bool

    summary: str

    strengths: List[str]

    weaknesses: List[str]

    observations: List[str]

class SubmissionAnalysis(BaseModel):
    contractor: str
    strengths: list[str]
    weaknesses: list[str]


class ComparisonSection(BaseModel):
    best_submission: str
    summary: str


class ComparisonResult(BaseModel):
    submission_analysis: list[SubmissionAnalysis]

    comparisons: dict[str, ComparisonSection]

    overall_summary: str
    

class ProposalRecommendation(BaseModel):
    submission_id: int
    rank: int

    recommendation_level: Literal[
        "Highly Recommended",
        "Recommended",
        "Acceptable",
        "Not Recommended",
        "Disqualified"
    ]

    justification: str


class RecommendationResult(BaseModel):

    recommended_submission_id: int | None

   
    award_recommended: bool

    executive_summary: str

    recommendations: list[ProposalRecommendation]

    notes: list[str]
    
    



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