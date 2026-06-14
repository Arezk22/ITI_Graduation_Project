# tender_graph.py
import json
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from .state import TenderState
from .prompts import (
    VALIDATION_AGENT_PROMPT, SCORING_AGENT_PROMPT, 
    RISK_AGENT_PROMPT, LEGAL_AGENT_PROMPT, RECOMMENDATION_AGENT_PROMPT
)

class EvaluationWorkflow:
    def __init__(self, llm):
        self.llm = llm
        self.workflow = StateGraph(TenderState)
        self._build_graph()

    def _build_graph(self):
        # 1. تعريف العقد (Nodes)
        self.workflow.add_node("validation_agent", self.validation_node)
        self.workflow.add_node("scoring_agent", self.scoring_node)
        self.workflow.add_node("risk_agent", self.risk_node)
        self.workflow.add_node("legal_agent", self.legal_node)
        self.workflow.add_node("recommendation_agent", self.recommendation_node)
        self.workflow.add_node("comparison_agent", self.comparison_node)

        # 2. بناء مسار التقييم
        self.workflow.set_entry_point("validation_agent")
        self.workflow.add_edge("validation_agent", "scoring_agent")
        self.workflow.add_edge("scoring_agent", "risk_agent")
        self.workflow.add_edge("risk_agent", "legal_agent")
        self.workflow.add_edge("legal_agent", "recommendation_agent")
        
        # بعد ما كل مقاول ياخد التوصية بتاعته، نقارنهم كلهم ببعض
        self.workflow.add_edge("recommendation_agent", "comparison_agent")
        self.workflow.add_edge("comparison_agent", END)

        self.app = self.workflow.compile()

    # --- دوال مساعدة لاستدعاء الـ LLM ---
    def _run_agent(self, prompt_template, input_data):
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm | JsonOutputParser()
        try:
            return chain.invoke(input_data)
        except Exception as e:
            print(f"Agent Error: {e}")
            return {}

    # --- عقدة الـ Validation ---
    def validation_node(self, state: TenderState):
        print("🔍 Validation Agent: Checking compliance...")
        tender_reqs = state.get("tender_requirements", {})
        updated_contractors = []
        
        for contractor in state.get("contractors", []):
            result = self._run_agent(VALIDATION_AGENT_PROMPT, {
                "tender_reqs": json.dumps(tender_reqs),
                "contractor_data": json.dumps(contractor.get("structured_data", {}))
            })
            contractor["validation_status"] = result
            updated_contractors.append(contractor)
            
        return {"contractors": updated_contractors}

    # --- عقدة الـ Scoring ---
    def scoring_node(self, state: TenderState):
        print("🎯 Scoring Agent: Calculating scores...")
        rules = state.get("evaluation_rules", {})
        updated_contractors = []
        
        for contractor in state.get("contractors", []):
            result = self._run_agent(SCORING_AGENT_PROMPT, {
                "evaluation_rules": json.dumps(rules),
                "contractor_data": json.dumps(contractor.get("structured_data", {}))
            })
            contractor["scores"] = result
            updated_contractors.append(contractor)
            
        return {"contractors": updated_contractors}

    # --- عقدة الـ Risk ---
    def risk_node(self, state: TenderState):
        print("⚠️ Risk Agent: Analyzing financial anomalies...")
        hist_prices = state.get("historical_prices", {})
        updated_contractors = []
        
        for contractor in state.get("contractors", []):
            boq_data = contractor.get("structured_data", {}).get("boq_items", [])
            result = self._run_agent(RISK_AGENT_PROMPT, {
                "historical_prices": json.dumps(hist_prices),
                "contractor_boq": json.dumps(boq_data)
            })
            # قد يرجع المصفوفة مباشرة أو داخل مفتاح
            contractor["risk_items"] = result if isinstance(result, list) else result.get("risk_items", [])
            updated_contractors.append(contractor)
            
        return {"contractors": updated_contractors}

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

    # --- عقدة التوصية الفردية ---
    def recommendation_node(self, state: TenderState):
        print("📝 Recommendation Agent: Finalizing contractor status...")
        updated_contractors = []
        
        for contractor in state.get("contractors", []):
            result = self._run_agent(RECOMMENDATION_AGENT_PROMPT, {
                "contractor_name": contractor.get("contractor_id", "Unknown"),
                "validation": json.dumps(contractor.get("validation_status", {})),
                "scores": json.dumps(contractor.get("scores", {})),
                "risks": json.dumps(contractor.get("risk_items", [])),
                "legal_flags": json.dumps(contractor.get("legal_flags", []))
            })
            contractor["recommendation"] = result.get("recommendation", "Needs Review")
            contractor["justification"] = result.get("justification", "")
            updated_contractors.append(contractor)
            
        return {"contractors": updated_contractors}

    # --- عقدة المقارنة والترتيب (Comparison) ---
    def comparison_node(self, state: TenderState):
        print("🏆 Comparison Agent: Ranking all contractors...")
        contractors = state.get("contractors", [])
        
        # ترتيب برمجي (بدون LLM لتوفير التكلفة وضمان الدقة الرياضية)
        # سيتم الترتيب بناءً على Total Score اللي رجع من وكيل التسجيل
        ranked_contractors = sorted(
            contractors, 
            key=lambda x: x.get("scores", {}).get("total_score", 0), 
            reverse=True
        )
        
        final_ranking = []
        for index, c in enumerate(ranked_contractors):
            final_ranking.append({
                "rank": index + 1,
                "contractor_id": c.get("contractor_id"),
                "total_score": c.get("scores", {}).get("total_score", 0),
                "recommendation": c.get("recommendation")
            })
            
        return {"final_ranking": final_ranking}

    def run(self, initial_state: dict):
        return self.app.invoke(initial_state)