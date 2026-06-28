# tender_graph.py
from django.db import transaction
import json
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser , PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Literal

from api.models import EvaluationRules, TenderSubmissions, Tenders

from .state import TenderState
from .prompts import (
    VALIDATION_AGENT_PROMPT, COMPARISON_AGENT_PROMPT, 
    RISK_AGENT_PROMPT,TECHNICAL_AGENT_PROMPT, FINANCIAL_AGENT_PROMPT,LEGAL_AGENT_PROMPT, RECOMMENDATION_AGENT_PROMPT
)

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
    
    
def get_tender_requirements(tender_id:int):
    tender_data=Tenders.objects.get(id=tender_id).structured_data
    return {
        "required_certificates": tender_data["required_certificates"],
        "required_documents": tender_data["required_documents"],
        "required_licenses": tender_data["required_licenses"],
        "technical_requirements":tender_data["technical_requirements"],
        "custom_requirements": tender_data["custom_requirements"],
    }

def get_tender_technical(tender_id:int):
    tender_data=Tenders.objects.get(id=tender_id).structured_data
    return {
        "title": tender_data["title"],

    "description": tender_data['description'],

    "project_duration_days": tender_data['project_duration_days'],

    "minimum_experience_years": tender_data['minimum_experience_years'],

    "required_certificates": tender_data['required_certificates'],

    "required_licenses": tender_data['required_licenses'],

    "technical_requirements": tender_data['technical_requirements'],

    "evaluation_criteria": tender_data['evaluation_criteria'],

    "custom_requirements": tender_data['custom_requirements']
    }

def get_tender_financial(tender_id:int):
    tender_data=Tenders.objects.get(id=tender_id).structured_data
    return {
        "estimated_budget": tender_data['estimated_budget'],
        "boq_items": tender_data['boq_items'],
        "evaluation_criteria": tender_data['evaluation_criteria']
        
    }

def get_tender_summary(tender_id:int):
    tender_data=Tenders.objects.get(id=tender_id).structured_data
    return {
        "project_name": tender_data['title'],
        "project_description": tender_data['description'],
        "minimum_experience": tender_data['minimum_experience_years']
    }

def prepare_risk_data(sub):
    proposal=sub.structured_data
    return{
        "experience_years": proposal['experience_years'],
    "previous_projects": proposal['previous_projects'],
    "financial_capacity": proposal['financial_capacity'],
    "delivery_duration_days": proposal['delivery_duration_days'],

    "certificates": proposal['certificates'],
    "licenses": proposal['licenses'],

    "technical_capabilities": proposal['technical_capabilities'],

    "staff_count": proposal['staff_count'],
    "key_personnel": proposal['key_personnel'],
    "equipment": proposal['equipment'],

    "implementation_methodology": proposal['implementation_methodology'],

    "warranty_period": proposal['warranty_period'],
    "support_services": proposal['support_services'],

    "deviations": proposal['deviations'],
    "exclusions": proposal['exclusions'],

    "notes": proposal['notes'],
    }

def prepare_technical_data(sub):
    proposal=sub.structured_data
    return {
    "contractor_name": proposal['contractor_name'],

    "experience_years": proposal['experience_years'],

    "previous_projects": proposal['previous_projects'],

    "delivery_duration_days": proposal['delivery_duration_days'],

    "certificates": proposal['certificates'],

    "licenses": proposal['licenses'],

    "technical_offer": proposal['technical_offer'],

    "implementation_methodology": proposal['implementation_methodology'],

    "warranty_period": proposal['warranty_period'],

    "support_services": proposal['support_services'],

    "deviations": proposal['deviations'],

    "exclusions": proposal['exclusions'],

    "staff_count": proposal['staff_count'],

    "key_personnel": proposal['key_personnel'],

    "equipment": proposal['equipment'],

    "custom_information": proposal['custom_information']
}


def prepare_financial_data(sub):
    proposal=sub.structured_data
    return {
    "contractor_name": proposal['contractor_name'],

    "financial_capacity": proposal['financial_capacity'],

    "boq_items": proposal['boq_items'],

    "exclusions": proposal['exclusions'],

    "deviations": proposal['deviations'],

    "custom_information": proposal['custom_information']
}
    
    
        
class EvaluationWorkflow:
    def __init__(self, llm):
        self.llm = llm
        self.workflow = StateGraph(TenderState)
        self._build_graph()

    def _build_graph(self):
        # 1. تعريف العقد (Nodes)
        self.workflow.add_node("validation_agent", self.validation_node)
        self.workflow.add_node("risk_agent", self.risk_node)
        self.workflow.add_node("technical_agent", self.technical_score)
        self.workflow.add_node("financial_agent", self.financial_score)
        self.workflow.add_node("scoring_agent", self.final_scoring_node)
        # self.workflow.add_node("legal_agent", self.legal_node)
        self.workflow.add_node("comparison_agent", self.comparison_node)
        self.workflow.add_node("recommendation_agent", self.recommendation_node)
        self.workflow.add_node("save_results", self.save_to_db)
        # 2. بناء مسار التقييم
        self.workflow.set_entry_point("validation_agent")
        self.workflow.add_edge("validation_agent", "risk_agent")
        self.workflow.add_edge("risk_agent","technical_agent")
        self.workflow.add_edge("technical_agent","financial_agent")
        self.workflow.add_edge("financial_agent","scoring_agent")
        self.workflow.add_edge("scoring_agent", "comparison_agent")
        
        # بعد ما كل مقاول ياخد التوصية بتاعته، نقارنهم كلهم ببعض
        self.workflow.add_edge("comparison_agent", "recommendation_agent")
        self.workflow.add_edge("recommendation_agent", "save_results")
        self.workflow.add_edge("save_results", END)

        self.app = self.workflow.compile()

    # --- دوال مساعدة لاستدعاء الـ LLM ---
    def _run_agent(self, prompt_template, input_data , output_model=None):
        prompt = ChatPromptTemplate.from_template(prompt_template)
        
        if output_model:
            parser=PydanticOutputParser(pydantic_object=output_model)
        else:
            parser = JsonOutputParser()
            
        chain = prompt | self.llm | parser
        try:
            return chain.invoke(input_data)
        except Exception as e:
            print(f"Agent Error: {e}")
            return {}

    # --- عقدة الـ Validation ---
    def validation_node(self, state: TenderState):
        print("🔍 Validation Agent: Checking compliance...")
        tender_reqs=get_tender_requirements(state["tender_id"])
        validation_results = {}
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            result = self._run_agent(VALIDATION_AGENT_PROMPT, {
                "tender_reqs": json.dumps(tender_reqs),
                "submission_data": json.dumps(sub.structured_data)
            },ValidationResult)
            validation_results[sub.id]=result
            
        return {"validation_results": validation_results}




    # --- عقدة الـ Risk ---
    def risk_node(self, state: TenderState):
        print("⚠️ Risk Agent: Analyzing financial anomalies...")
        # hist_prices = state.get("historical_prices", {})
        risk_result = {}
        tender_reqs=get_tender_requirements(state["tender_id"])
        validation_results=state["validation_results"]
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            risk_payload=prepare_risk_data(sub)
            result = self._run_agent(RISK_AGENT_PROMPT, {
                # "historical_prices": json.dumps(hist_prices),
                "tender_reqs":json.dumps(tender_reqs),
                "validation_result":json.dumps(validation_results[sub.id]),
                "submission":json.dumps(risk_payload)
        },RiskAssessment)
            risk_result[sub.id]=result            
        return {"risk_result": risk_result}
    
    
    
    def technical_score(self,state: TenderState):
        print("🎯 Technical score Agent: Calculating scores...")
        tech_result = {}
        tender_reqs=get_tender_technical(state["tender_id"])
        validation_results=state["validation_results"]
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            tech_payload=prepare_technical_data(sub)
            result = self._run_agent(TECHNICAL_AGENT_PROMPT, {
                "tender_reqs":json.dumps(tender_reqs),
                "validation_result":json.dumps(validation_results[sub.id]),
                "submission":json.dumps(tech_payload)
        },TechnicalEvaluation)
            tech_result[sub.id]=result            
        return {"technical_evaluation": tech_result}
    
    
    def financial_score(self,state: TenderState):
        print("🎯 Financial score Agent: Calculating scores...")
        financial_result = {}
        tender_reqs=get_tender_financial(state["tender_id"])
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            financail_payload=prepare_financial_data(sub)
            result = self._run_agent(FINANCIAL_AGENT_PROMPT, {
                "tender_reqs":json.dumps(tender_reqs),
                "submission":json.dumps(financail_payload)
        },FinancialEvaluation)
            financial_result[sub.id]=result            
        return {"financial_evaluation": financial_result}
    
    
    
    
    
    
    # --- عقدة الـ Scoring ---
    def final_scoring_node(self, state: TenderState):
        print("🎯 Scoring Agent: Calculating scores...")
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        tender_data=Tenders.objects.get(id=state["tender_id"]).structured_data
        tech_scores=state["technical_evaluation"]
        fin_scores=state["financial_evaluation"]
        compilance_scores=state["validation_results"]
        required_exp=tender_data["minimum_experience_years"]
        rules={
            rule.rule_name:rule.rule_value 
            for rule in EvaluationRules.objects.filter(id=state["tender_id"])
        }
        tech_weight=rules["technical"]
        fin_weight=rules["financial"]
        compilance_weight=rules["compilance"]
        exp_weight=rules["expreience"]
        final_score=[]
        for sub in submissions:            
            if not state["validation_results"][sub.id]["mandatory_passed"]:
                overall_score=0
                sub.status="rejected"
                sub.save()
                final_score.append({
                    "submission_id":sub.id,
                    "overall_score": overall_score,
                    "status":"rejected",
                    "breakdown":{}
                })
            else:
                tech_score=tech_scores[sub.id]["technical_score"]
                fin_score=fin_scores[sub.id]["financial_score"]
                compilance_score=compilance_scores[sub.id]["compliance_score"]
                act_exp=sub.stractured_data["experience_years"]
                if required_exp:
                    exp_score=min(act_exp/required_exp , 1)*100
                else:
                    exp_score=100
                overall_score=tech_score*tech_weight+fin_score*fin_weight+compilance_score*compilance_weight+exp_score*exp_weight
                final_score.append({
                            "submission_id":sub.id,
                            "contractor":sub.contractor.company_name,
                          "overall_score": overall_score,
                          "breakdown": {
                            "technical": {
                              "score": tech_score,
                              "weight": tech_weight,
                              "contribution": tech_score*tech_weight
                            },
                            "financial": {
                              "score": fin_score,
                              "weight": fin_weight,
                              "contribution": fin_score*fin_weight
                            },
                            "compliance": {
                              "score": compilance_score,
                              "weight": compilance_weight,
                              "contribution": compilance_score*compilance_weight
                            },
                            "experience": {
                              "score": exp_score,
                              "weight": exp_weight,
                              "contribution": exp_score*exp_weight
                            }
                          }
                        })

        ranked_submissions = sorted(
            final_score, 
            key=lambda x: x["overall_score"], 
            reverse=True
        )
        
        for rank, submission in enumerate(ranked_submissions, start=1):
            submission["rank"] = rank
            
        return {"final_score":final_score,
                "final_ranking":ranked_submissions}
       


    # --- عقدة الـ Legal ---
    def legal_node(self, state: TenderState):
        print("⚖️ Legal Agent: Flagging contractual deviations...")
        tender_clauses = state.get("tender_requirements", {})
        updated_contractors = []
        
        for contractor in state.get("contractors", []):
            result = self._run_agent(LEGAL_AGENT_PROMPT, {
                "tender_clauses": json.dumps(tender_clauses),
                "contractor_data": json.dumps(contractor.get("structured_data", {}))
            })
            contractor["legal_flags"] = result.get("legal_flags", [])
            updated_contractors.append(contractor)
            
        return {"contractors": updated_contractors}


    # --- عقدة المقارنة والترتيب (Comparison) ---
    def comparison_node(self, state: TenderState):
        print("🏆 Comparison Agent: Ranking all contractors...")
        tender_summary=get_tender_summary(state["tender_id"])
        comparison_data=[]
        for sub_id in state["submission_ids"]:
            comparison_data.append({
                "submission_id": sub_id,
                "technical_summary": state["technical_evaluation"][sub_id]["summary"],
                "financial_summary": state["financial_evaluation"][sub_id]["summary"],
                "validation_summary": state["validation_results"][sub_id]["summary"],
                "risk_summary": state["risk_result"][sub_id]["summary"],
                    })
        result = self._run_agent(COMPARISON_AGENT_PROMPT, {
                "tender_summary":json.dumps(tender_summary),
                "ranking":json.dumps(state["final_ranking"]),
                "submission_summaries": json.dumps(comparison_data)
        },ComparisonResult)
        
            
        return {"comparison_result": result}

    # --- عقدة التوصية الفردية ---
    def recommendation_node(self, state: TenderState):
        print("📝 Recommendation Agent: Finalizing contractor status...")
        tender_summary=get_tender_summary(state["tender_id"])
        result = self._run_agent(RECOMMENDATION_AGENT_PROMPT, {
                "tender_summary":json.dumps(tender_summary),
                "comparison_result":json.dumps(state["comparison_result"])
        },RecommendationResult)
        
        return {"recommendatin_result": result}
    
    
    @transaction.atomic
    def save_to_db(self,state:TenderState):
        tender=Tenders.objects.get(id=state["tender_id"])
        validation_results=state["validation_results"]
        risk_result=state["risk_result"]
        technical_evaluation=state["technical_evaluation"]
        financial_evaluation=state["financial_evaluation"]
        final_ranking   =state["final_ranking"]     
        comparison_result=state["comparison_result"]
        recommendation_result=state["recommendatin_result"]
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        recommendations = {
                            r["submission_id"]: r
                            for r in recommendation_result["recommendations"]
                        }
        ranking={
            s["submission_id"]:s 
            for s in final_ranking
        }
        for sub in submissions:
            sub.technical_score=technical_evaluation[sub.id]["technical_score"]
            sub.financial_score=financial_evaluation[sub.id]["financial_score"]
            sub.risk_score =risk_result[sub.id]["risk_score"]
            sub.final_score=ranking[sub.id]["overall_score"]
            sub.rank =ranking[sub.id]["rank"]
            sub.recommendation =recommendations[sub.id]["recommendation_level"]
            sub.justification=recommendations[sub.id]["justification"]
            sub.validation_result=validation_results[sub.id]
            sub.risk_result=risk_result[sub.id]
            sub.technical_result=technical_evaluation[sub.id]
            sub.financial_result=financial_evaluation[sub.id]
            sub.save()
        tender.comparison_result=comparison_result.model_dump()
        tender.recommendation_result=recommendation_result.model_dump()
        tender.save()
        
    def run(self, initial_state: dict):
        return self.app.invoke(initial_state)