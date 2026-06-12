from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.runnables import RunnablePassthrough # تم إضافة هذا الاستدعاء الهام
from pydantic import BaseModel, Field
import json

from .state import TenderState
from ..vector_store import get_vector_store
from .prompts import TENDER_CHAT_PROMPT

class LegalFlagsOutput(BaseModel):
    flags: list[str] = Field(description="List of legal risks, penalties, or hidden liabilities found in the text.")

class TenderWorkflow:
    def __init__(self, llm, db_connection_string=None):
        self.llm = llm
        self.db_string = db_connection_string
        # تهيئة الـ Graph باستخدام الـ State التي أنشأناها
        self.workflow = StateGraph(TenderState)
        self._build_graph()

    def _build_graph(self):
        # 1. تعريف العقد (Nodes) - كل عقدة تمثل وكيل أو وظيفة
        self.workflow.add_node("router", self.intent_router_node)
        self.workflow.add_node("legal_agent", self.legal_agent_node)
        self.workflow.add_node("financial_agent", self.financial_agent_node)
        self.workflow.add_node("chat_agent", self.chat_agent_node)
        self.workflow.add_node("response_generator", self.response_generator_node)

        # 2. بناء المسار (Edges)
        self.workflow.set_entry_point("router")
        
        # الـ Router يقرر المسار بناءً على رغبة المستخدم
        self.workflow.add_conditional_edges(
            "router",
            self.route_user_intent,
            {
                "legal": "legal_agent",       # مفتاح مستقل يوجه للعقدة القانونية
                "financial": "financial_agent", # مفتاح مستقل يوجه للعقدة المالية
                "chat": "chat_agent"          # يوجه لشات الـ RAG
            }
        )
        
        # بعد انتهاء الوكلاء، نذهب لمولد الردود
        self.workflow.add_edge("legal_agent", "response_generator")
        self.workflow.add_edge("financial_agent", "response_generator")
        
        # نقطة النهاية
        self.workflow.add_edge("response_generator", END)
        self.workflow.add_edge("chat_agent", END)
        
        # تجميع الـ Graph
        self.app = self.workflow.compile()

    # --- عقدة الـ Router لتحديد النية ---
    def intent_router_node(self, state: TenderState):
        # هذه العقدة مجرد جسر لتمرير الـ State وتحديد المسار
        return state
    
    def route_user_intent(self, state: TenderState):
        # إذا كان هناك مخرجات مستخرجة مسبقاً والسؤال محدد، إذن المستخدم في الشات
        if state.get("user_query") and "حلل" not in state.get("user_query"):
            return ["chat"]
        return ["legal", "financial"]

    # --- عقدة الـ RAG Chat (شغل الأسبوع الأول) ---
    def chat_agent_node(self, state: TenderState):
        # print("💬 عقدة الشات (RAG): جاري البحث والإجابة الفورية...")
        print("💬 searching the answer (RAG Node):")

        
        query = state.get("user_query")
        tender_id = state.get("tender_id")
        
        # 1. الاتصال بالـ Vector Store الخاص بهذه المناقصة
        vector_store = get_vector_store(self.db_string, collection_name=f"tender_{tender_id}")
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})
        
        # 2. صياغة الـ Prompt الخاص بالشات
        prompt = ChatPromptTemplate.from_messages([
            ("system", TENDER_CHAT_PROMPT),
            ("placeholder", "{chat_history}"),
            ("user", "{question}")
        ])

        # دالة مساعدة لتنسيق النصوص (تم نقلها هنا لتكون داخل النطاق الصحيح)
        def format_docs_with_metadata(docs):
            formatted = []
            for doc in docs:
                page = doc.metadata.get("page", "N/A")
                formatted.append(f"[المصدر: صفحة {page}]\nContext: {doc.page_content}")
            return "\n\n".join(formatted)
            
        # 3. بناء الـ Chain (تم نقله من دالة response_generator)
        rag_chain = (
            {
                "context": retriever | format_docs_with_metadata, 
                "question": RunnablePassthrough(),
                "chat_history": lambda x: state.get("chat_history", [])
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        # تنفيذ الاستعلام
        response = rag_chain.invoke(query)
        return {"final_response": response}

    # --- تعريف وظائف الوكلاء (Nodes Logic) ---
    def legal_agent_node(self, state: TenderState):
        # print("🕵️ الوكيل القانوني: جاري فحص الشروط التعاقدية...")
        print("🕵️ Legal Agent: Reviewing the contractual terms...")      

        extracted_text = state.get("extracted_text", "")
        if not extracted_text:
            # return {"legal_flags": ["لا توجد نصوص قانونية كافية للفحص."]}
            return {"legal_flags": ["There are not enough legal provisions available for review."]}
            
        parser = PydanticOutputParser(pydantic_object=LegalFlagsOutput)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert Construction Legal Advisor. 
            Your job is to review the following tender clauses and extract ONLY high-risk legal flags.
            Focus on:
            - Penalties for delays (Liquidated Damages).
            - Unfair payment terms or retention percentages.
            - Unclear scopes of liability.
            
            {format_instructions}"""),
            ("user", "Tender Text:\n{text}")
        ])
        
        legal_chain = prompt | self.llm | parser
        
        try:
            result = legal_chain.invoke({
                "text": extracted_text,
                "format_instructions": parser.get_format_instructions()
            })
            return {"legal_flags": result.flags}
        except Exception as e:
            print(f"Error occurred while processing legal analysis: {e}")
            # return {"legal_flags": ["حدث خطأ أثناء تحليل القانون."]}
            return {"legal_flags": ["An error occurred while performing the legal analysis."]}
        
    def financial_agent_node(self, state: TenderState):
        # print("💰 الوكيل المالي: جاري تحليل الأسعار وحساب الانحرافات...")
        print("💰 Financial Agent: Analyzing prices and calculating deviations...")
    
        extracted_boq = state.get("extracted_boq", [])
        deviations = []
    
        # سيتم تفعيل هذا الجزء عند ربط قاعدة البيانات
        # for item in extracted_boq:
        #     item_desc = item.get("description", "")
        #     current_price = float(item.get("unit_price", 0.0))
        #     ... (باقي كود حساب الانحراف كما هو)
                    
        return {"financial_deviations": deviations}

    def response_generator_node(self, state: TenderState):
        # print("📝 مولد الردود: جاري صياغة التقرير النهائي...")
        print("📝 Response Generator: Drafting the final report...")
    
        legal_flags = state.get("legal_flags", [])
        financial_deviations = state.get("financial_deviations", [])
        # user_query = state.get("user_query", "يرجى تقديم تقرير شامل عن المخاطر القانونية والمالية.")
        user_query = state.get("user_query","Please provide a comprehensive report on the legal and financial risks.")
    
        # تنسيق البيانات لتمريرها للـ Prompt
        # legal_summary = "\n".join([f"- {flag}" for flag in legal_flags]) if legal_flags else "لا توجد مخاطر قانونية واضحة."
        legal_summary = "\n".join([f"- {flag}" for flag in legal_flags]) if legal_flags else "No clear legal risks identified."

    
        financial_summary = ""
        if financial_deviations:
            for dev in financial_deviations:
                # financial_summary += f"- البند: {dev['description']} | الانحراف: {dev['deviation_percentage']}% ({dev['status']})\n"
                financial_summary += f"- Item: {dev['description']} | Deviation: {dev['deviation_percentage']}% ({dev['status']})\n"
        else:
            # financial_summary = "الأسعار متوافقة مع المعدلات التاريخية ولا توجد انحرافات مقلقة."
            financial_summary = "Prices are consistent with historical averages and no concerning deviations were found."

        # بناء الـ Prompt
        prompt = ChatPromptTemplate.from_template("""
        You are the Lead AI Estimator for a construction company. 
        Based on the analysis from your team, generate a professional, structured executive summary in Arabic.
    
        User Query: {query}
    
        Legal & Compliance Flags:
        {legal}
    
        Financial BOQ Deviations:
        {financial}
    
        Format the output nicely using Markdown headers, bullet points, and bold text for emphasis.
        Keep it concise and actionable.
        """)
    
        # ربط وتنفيذ الـ Chain
        response_chain = prompt | self.llm | StrOutputParser()
    
        final_answer = response_chain.invoke({
            "query": user_query,
            "legal": legal_summary,
            "financial": financial_summary
        })
    
        return {"final_response": final_answer}

    def run(self, initial_state: dict):
        return self.app.invoke(initial_state)