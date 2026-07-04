# tender_graph.py
from django.db import transaction
import json
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser , PydanticOutputParser
from .state import RiskAssessment ,TechnicalEvaluation,FinancialEvaluation,ValidationResult,ComparisonResult,RecommendationResult


from ai_pipeline.tasks import notify
from api.models import EvaluationRules, TenderSubmissions, Tenders
from api.models import EvaluationRules, TenderSubmissions, Tenders

from .state import TenderState
from .prompts import (
    VALIDATION_AGENT_PROMPT, COMPARISON_AGENT_PROMPT, 
    RISK_AGENT_PROMPT,TECHNICAL_AGENT_PROMPT, FINANCIAL_AGENT_PROMPT,LEGAL_AGENT_PROMPT, RECOMMENDATION_AGENT_PROMPT
)

def get_tender_requirements(tender_id:int):
    tender_data=Tenders.objects.get(id=tender_id).structured_data
    return {
        "mandatory_documents": tender_data["mandatory_documents"],
        "preferred_documents": tender_data["preferred_documents"],
        "mandatory_licenses": tender_data["mandatory_licenses"],
        "preferred_licenses": tender_data["preferred_licenses"],
        "mandatory_technical_requirements":tender_data["mandatory_technical_requirements"],
        "preferred_technical_requirements":tender_data["preferred_technical_requirements"],
        "mandatory_certificates":tender_data["mandatory_certificates"],
        "preferred_certificates":tender_data["preferred_certificates"],
        "custom_requirements": tender_data["custom_requirements"],
    }

def get_tender_technical(tender_id:int):
    tender_data=Tenders.objects.get(id=tender_id).structured_data
    return {
        "title": tender_data["title"],

    "description": tender_data['description'],

    "project_duration_days": tender_data['project_duration_days'],

    "minimum_experience_years": tender_data['minimum_experience_years'],

    "mandatory_licenses": tender_data["mandatory_licenses"],
    "preferred_licenses": tender_data["preferred_licenses"],
    "mandatory_technical_requirements":tender_data["mandatory_technical_requirements"],
    "preferred_technical_requirements":tender_data["preferred_technical_requirements"],
    "mandatory_certificates":tender_data["mandatory_certificates"],
    "preferred_certificates":tender_data["preferred_certificates"],
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

    "technical_capabilities": proposal['technical_offer'],

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
        
        
        if output_model:
            parser=PydanticOutputParser(pydantic_object=output_model)
            prompt = ChatPromptTemplate.from_template(prompt_template + "\n\n{format_instructions}")
            input_data["format_instructions"] = parser.get_format_instructions()
        else:
            parser = JsonOutputParser()
            prompt = ChatPromptTemplate.from_template(prompt_template)
            
        chain = prompt | self.llm | parser
        try:
            return chain.invoke(input_data)
        except Exception as e:
            print(f"Agent Error: {e}")
            return None

    # --- عقدة الـ Validation ---
    def validation_node(self, state: TenderState):
        print("🔍 Validation Agent: Checking compliance...")
        tender_reqs=get_tender_requirements(state["tender_id"])
        validation_results = {}
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            sub.structured_data["submission_letter"] = "System Submission"
            result = self._run_agent(VALIDATION_AGENT_PROMPT, {
                "tender_reqs": json.dumps(tender_reqs),
                "submission_data": json.dumps(sub.structured_data)
            },ValidationResult)
            validation_results[sub.id]=result
            print("=" * 40)
            print(f"Submission {sub.id}")
            print(result)
            print("=" * 40)
        #     if not result.mandatory_passed:
        #         sub.recommendation="Disqualified"
        #         sub.justification="Failed mandatory requirements"
        #         sub.save(update_fields=["recommendation", "justification"])
        #         state["submission_ids"].remove(sub.id)
        #         notify.delay({
        #             "event":"Disqualified",
        #             "sub":sub.id,
        #         })
        # print(state["submission_ids"])
        return {"validation_results": validation_results,
                "submission_ids": state["submission_ids"],}




    # --- عقدة الـ Risk ---
    def risk_node(self, state: TenderState):
        print("⚠️ Risk Agent: Analyzing financial anomalies...")
        # hist_prices = state.get("historical_prices", {})
        risk_result = {}
        tender_reqs=get_tender_requirements(state["tender_id"])
        validation_results=state["validation_results"]
        
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            print(f"⭕risk ai for sub {sub.id}")
            risk_payload=prepare_risk_data(sub)
            result = self._run_agent(RISK_AGENT_PROMPT, {
                # "historical_prices": json.dumps(hist_prices),
                "tender_reqs":json.dumps(tender_reqs),
                "validation_result":validation_results[sub.id].model_dump_json(),
                "submission":json.dumps(risk_payload)
        },RiskAssessment)
            risk_result[sub.id]=result
            print(result)
            if result.overall_risk in ["High", "Critical"]:
                notify.delay({
                    "event":"risk",
                    "sub":sub.id,
                    "payload":{
                        "score":result.risk_score,
                        "level":result.overall_risk
                    }
                })
        return {"risk_result": risk_result}
    
    
    
    def technical_score(self,state: TenderState):
        print("🎯 Technical score Agent: Calculating scores...")
        tech_result = {}
        tender_reqs=get_tender_technical(state["tender_id"])
        validation_results=state["validation_results"]
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            print(f"⭕tech ai for sub {sub.id}")
            tech_payload=prepare_technical_data(sub)
            result = self._run_agent(TECHNICAL_AGENT_PROMPT, {
                "tender_reqs":json.dumps(tender_reqs),
                "validation_result": validation_results[sub.id].model_dump_json(),
                "submission":json.dumps(tech_payload)
        },TechnicalEvaluation)
            tech_result[sub.id]=result     
            print(result)       
        return {"technical_evaluation": tech_result}
    
    
    def financial_score(self,state: TenderState):
        print("🎯 Financial score Agent: Calculating scores...")
        financial_result = {}
        tender_reqs=get_tender_financial(state["tender_id"])
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        for sub in submissions:
            print(f"⭕fin ai for sub {sub.id}")
            financail_payload=prepare_financial_data(sub)
            result = self._run_agent(FINANCIAL_AGENT_PROMPT, {
                "tender_reqs":json.dumps(tender_reqs),
                "submission":json.dumps(financail_payload)
        },FinancialEvaluation)
            financial_result[sub.id]=result 
            print(result)           
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
            for rule in EvaluationRules.objects.filter(tender_id=state["tender_id"])
        }
        tech_weight=float(rules["Technical"])/100
        fin_weight=float(rules["Price"])/100
        compilance_weight=float(rules["Compliance"])/100
        exp_weight=float(rules["Experience"])/100
        final_score=[]
        for sub in submissions:  
            print(f"⭕final score for sub {sub.id}")          
            # if not state["validation_results"][sub.id]["mandatory_passed"]:
            #     overall_score=0
            #     sub.status="rejected"
            #     sub.save()
            #     final_score.append({
            #         "submission_id":sub.id,
            #         "overall_score": overall_score,
            #         "status":"rejected",
            #         "breakdown":{}
            #     })
            # else:
            tech_score=tech_scores[sub.id].model_dump()["technical_score"]
            fin_score=fin_scores[sub.id].model_dump()["financial_score"]
            compilance_score=compilance_scores[sub.id].model_dump()["compliance_score"]
            act_exp=sub.structured_data["experience_years"]
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
        print(ranked_submissions)
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
                "technical_summary": state["technical_evaluation"][sub_id].model_dump()["summary"],
                "financial_summary": state["financial_evaluation"][sub_id].model_dump()["summary"],
                "validation_summary": state["validation_results"][sub_id].model_dump()["summary"],
                "risk_summary": state["risk_result"][sub_id].model_dump()["summary"],
                    })
        result = self._run_agent(COMPARISON_AGENT_PROMPT, {
                "tender_summary":json.dumps(tender_summary),
                "ranking":json.dumps(state["final_ranking"]),
                "submission_summaries": json.dumps(comparison_data)
        },ComparisonResult)
        
        print(result)  
        return {"comparison_result": result}

    # --- عقدة التوصية الفردية ---
    def recommendation_node(self, state: TenderState):
        print("📝 Recommendation Agent: Finalizing contractor status...")
        tender_summary=get_tender_summary(state["tender_id"])
        result = self._run_agent(RECOMMENDATION_AGENT_PROMPT, {
                "tender_summary":json.dumps(tender_summary),
                "comparison_result":state["comparison_result"].model_dump_json()
        },RecommendationResult)
        print(result)
        return {"recommendatin_result": result}
    
    
    @transaction.atomic
    def save_to_db(self,state:TenderState):
        print("📁.. Saving into db ..")
        validation_results=state["validation_results"]
        risk_result=state["risk_result"]
        technical_evaluation=state["technical_evaluation"]
        financial_evaluation=state["financial_evaluation"]
        final_ranking =state["final_ranking"]     
        comparison_result=state["comparison_result"]
        recommendation_result=state["recommendatin_result"]
        submissions=TenderSubmissions.objects.filter(id__in=state["submission_ids"])
        recommendations = {
                            r.submission_id: r
                            for r in recommendation_result.recommendations
                        }
        ranking={
            s["submission_id"]:s 
            for s in final_ranking
        }
        for sub in submissions:
            tech = technical_evaluation[sub.id]
            fin = financial_evaluation[sub.id]
            risk = risk_result[sub.id]
            validation = validation_results[sub.id]
            rec = recommendations[sub.id]
            rank = ranking[sub.id]

            sub.technical_score = tech.technical_score
            sub.financial_score = fin.financial_score
            sub.risk_score = risk.risk_score

            sub.final_score = rank["overall_score"]
            sub.rank = rank["rank"]

            sub.recommendation = rec.recommendation_level
            sub.justification = rec.justification

            sub.validation_result = validation.model_dump()
            sub.risk_result = risk.model_dump()
            sub.technical_result = tech.model_dump()
            sub.financial_result = fin.model_dump()
            sub.save()
        Tenders.objects.filter(id=state["tender_id"]).update(
            comparison_result=comparison_result.model_dump(),
            recommendation_result=recommendation_result.model_dump(),
        )
        print("📁.. Saving into db Successfully .. ✅")
        
    def run(self, initial_state: dict):
        return self.app.invoke(initial_state)