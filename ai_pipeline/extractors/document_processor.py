# boq_router.py
import os
from django.db import transaction
import fitz  # PyMuPDF
import json
from typing import List, Optional, Dict, Any
import base64
import time
import pandas as pd
import pdfplumber
from io import BytesIO
from docx import Document as DocxReader
from pdf2image import convert_from_path
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
import arabic_reshaper
from bidi.algorithm import get_display
from google import genai
from dotenv import load_dotenv
from api.models import (Tenders,TenderSubmissions,EvaluationRules,BoqItems,BoqPrice)
from django.shortcuts import get_object_or_404

load_dotenv()

# تعريف الهيكل الموحد المرجو من الـ Structuring Agent باستخدام Pydantic
class ProposalBOQItem(BaseModel):
    item_name: str = Field(
        description="BOQ item name"
    )

    description: Optional[str] = Field(
        default=None, 
        description="Work description"
    )

    unit: Optional[str] = Field(
        default=None,
        description="Measurement unit"
    )

    quantity: float = Field(
        description="Proposed quantity"
    )

    unit_rate: float = Field(
        description="Price per unit"
    )

    total_amount: Optional[float] = Field(
        default=None,
        description="Total line item amount"
    )



class UnifiedStructuredProposal(BaseModel):

    contractor_name: str = Field(
        description="Official contractor or company name"
    )

    company_type: Optional[str] = Field(
        default=None,
        description="Company category such as contractor, supplier, consultant or joint venture"
    )

    experience_years: int = Field(
        default=0,
        description="Total years of experience claimed by the contractor"
    )

    previous_projects: List[str] = Field(
        default_factory=list,
        description="Relevant previous projects completed by the contractor"
    )

    financial_capacity: float = Field(
        default=0.0,
        description="Financial capability, turnover, liquidity or annual revenue"
    )

    delivery_duration_days: int = Field(
        default=0,
        description="Proposed project completion duration in days"
    )

    certificates: List[str] = Field(
        default_factory=list,
        description="Certificates submitted by the contractor"
    )

    licenses: List[str] = Field(
        default_factory=list,
        description="Licenses held by the contractor"
    )

    submitted_documents: List[str] = Field(
        default_factory=list,
        description="Documents submitted as part of the proposal"
    )

    technical_offer: List[str] = Field(
        default_factory=list,
        description="""Summary of the contractor's proposed technical solution, including offered products, 
        technologies, specifications, system features, compliance statements, and any technical 
        commitments provided in the proposal."""
    )
    
    implementation_methodology: str = Field(
        default="",
        description="""Description of the contractor's proposed implementation methodology, including execution 
        approach, project phases, work plan, deployment strategy, quality assurance process, 
        testing procedures, and project management methodology."""
    )

    warranty_period: str = Field(
        default="",
        description="The warranty period provided by the contractor for the completed works, materials, or equipment"
    )

    support_services: List[str] = Field(
        default_factory=list,
        description="Maintenance, support, training, or after-sales services provided by the contractor"
    )

    deviations: List[str] = Field(
        default_factory=list,
        description="Any technical or commercial deviations, modifications, or variations from the original tender specifications requested by the contractor"
    )

    exclusions: List[str] = Field(
        default_factory=list,
        description="Items, works, or responsibilities explicitly excluded from the contractor's scope of work or price proposal"
    )

    staff_count: Optional[int] = Field(
        default=None,
        description="Total number of available staff or employees"
    )

    key_personnel: List[str] = Field(
        default_factory=list,
        description="Key personnel proposed for the project"
    )

    equipment: List[str] = Field(
        default_factory=list,
        description="Equipment, machinery and resources available for the project"
    )

    boq_items: List[ProposalBOQItem] = Field(
        default_factory=list,
        description="Contractor pricing breakdown for all BOQ items"
    )

    custom_information: List[str] = Field(
        default_factory=list,
        description="Important extracted information that does not fit any predefined field"
    )

    notes: str = Field(
        default="",
        description="Additional proposal notes or remarks"
    )

class TenderBOQItem(BaseModel):
    item_name: str = Field(
        description="BOQ item name"
    )

    description: Optional[str] = Field(
        default=None,
        description="Work description"
    )

    unit: str = Field(
        description="Measurement unit"
    )

    quantity: float = Field(
        description="Required quantity"
    )
    
    
class UnifiedStructuredTender(BaseModel):
    title: str = Field(
        default="",
        description="Official tender title or project name"
    )

    description: str = Field(
        default="",
        description="Full tender scope and project description"
    )

    estimated_budget: Optional[float] = Field(
        default=None,
        description="Estimated project budget if specified"
    )

    project_duration_days: Optional[int] = Field(
        default=None,
        description="Required completion period in days"
    )

    minimum_experience_years: Optional[int] = Field(
        default=None,
        description="Minimum years of contractor experience required"
    )

    required_certificates: List[str] = Field(
        default_factory=list,
        description="Required certificates such as ISO 9001, ISO 45001, safety or quality certificates, etc."
    )

    required_documents: List[str] = Field(
        default_factory=list,
        description="Mandatory submission documents such as tax card, commercial register, financial statements, etc."
    )

    required_licenses: List[str] = Field(
        default_factory=list,
        description="Required contractor licenses or classification grades"
    )

    technical_requirements: List[str] = Field(
        default_factory=list,
        description="Technical requirements explicitly mentioned in the tender"
    )

    custom_requirements: List[str] = Field(
        default_factory=list,
        description="Any special requirements not covered by predefined fields"
    )

    evaluation_criteria: List[dict] = Field(
        default_factory=list,
        description="Tender evaluation criteria and their corresponding weights"
    )

    boq_items: List[TenderBOQItem] = Field(
        default_factory=list,
        description="Bill of Quantities extracted from the tender documents"
    )

    notes: str = Field(
        default="",
        description="Additional notes or observations extracted from the tender"
    )

class DocumentIntakeProcessor:
    def __init__(self, vision_llm =None, text_llm=None,gemini_client=None):
        self.vision_llm = vision_llm  # نموذج الرؤية (مثل Llama-Vision أو GPT-4o-mini)
        self.text_llm = text_llm      # نموذج النصوص القياسي للهيكلة
        self.ai_client=gemini_client
    # 1. Intake Agent: تحديد نوع الملف وتوجيهه للمسار الصحيح
    def intake_and_route(self, file) -> str:
        """وظيفة الـ Routing ومعرفة نوع الملف بالضبط"""
        file_path=file.file_url
        category=file.file_category
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at: {file_path}")
        
        if category == 'drawing':
            return "drawing file" 
            
        ext = os.path.splitext(file_path)[1].lower()
        if ext in ['.xlsx', '.xls']:
            return "excel"
        elif ext in ['.docx', '.doc']:
            return "word"
        elif ext == '.pdf':
            return "pdf"
        return "unknown"

    # 2. Extraction Agent: استخراج المحتوى الخام بناءً على النوع المستهدف

    def extract_content(self, file_path: str, file_type: str) -> Any:
        print(f"⏳ Extraction Agent active. Extracting content from [{file_type}] file...")
        
        if file_type == "excel":
            excel_data = pd.read_excel(file_path, sheet_name=None)
            combined_tables = {}
            for sheet_name, df in excel_data.items():
                df = df.fillna("")
                combined_tables[sheet_name] = df.to_dict(orient="records")
            return combined_tables
            
        elif file_type == "word":
            doc = DocxReader(file_path)
            full_text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text)
            for table in doc.tables:
                for row in table.rows:
                    text_row = [cell.text.strip() for cell in row.cells]
                    full_text.append(" | ".join(text_row))
            return full_text
            
        elif file_type == "pdf":
            with pdfplumber.open(file_path) as pdf:
                full_text = []
                for page_num, page in enumerate(pdf.pages,start=1):
                    text=page.extract_text()
                    tables=page.extract_tables()
                    if len(text.strip())>50 or tables:
                        full_text.append({
                        "page":page_num,
                        "type":"digital",
                        "content":text,
                        "tables":tables
                    })
                    else:
                        poppler_path=os.getenv("POPPLER_PATH")
                        page_image=convert_from_path(file_path,first_page=page_num,last_page=page_num,poppler_path=poppler_path)[0]
                        ocr_data=self._extract_scanned_pdf_via_vision(page_image)
                        full_text.append({
                            "page":page_num,
                            "type":"scanned",
                            "extraction_metadata":{
                                "confidence_score": ocr_data["confidence_score"],
                                "needs_human_review": ocr_data["needs_human_review"],
                                "review_reason": ocr_data["review_reason"],
                                "unclear_sections": ocr_data["unclear_sections"],
                            },
                            "content":ocr_data["extracted_text"],
                            "tables":ocr_data["tables"]
                        })
                return full_text
        else:
            return "Unsupported file content format."

    def _extract_scanned_pdf_via_vision(self, img):
        """دالة مساعدة لتحويل صفحات الـ Scanned PDF لصور وتمريرها للـ Vision LLM"""
        try:
            prompt="""You are an OCR engine specialized in construction documents.

        Extract all visible text from this image.

        After extraction, evaluate the quality of the extracted result.

        Consider:
        - Image clarity
        - Readability
        - Missing text
        - Blurry areas
        - Table quality
        - OCR certainty

        Return JSON file only without any text except shown below:

        {
            "confidence_score": 0-100,
            "needs_human_review": true/false,
            "review_reason": "",
            "unclear_sections": [],
            "extracted_text": "",
            "tables":[]
        }

        Rules:
        - If any important part is unreadable, set needs_human_review to true.
        - If confidence is below 80, set needs_human_review to true.
        - Do not invent missing text.
        - Preserve numbers exactly.
        - Preserve the original language.
        -If tables exist:
            - Extract them separately.
            - Preserve rows and columns.
            - Do not merge table data into normal text.
            - Return tables inside the "tables" field.
            - Each table should be represented as a list of rows."""
            
            
            vision_response = self.ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                img, 
                prompt
            ]
        )
            response_text = vision_response.text
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            ocr_data = json.loads(clean_json)
            return ocr_data
            # إرسال الصورة للـ Vision LLM لاستخراج النصوص والجداول بدقة
            # buffered = BytesIO()
            # img.save(buffered, format="JPEG")
            # img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            # message = HumanMessage(
            #     content=[
            #         {"type": "text", "text": prompt},
            #         {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
            #     ]
            # )
            # res = self.vision_llm.invoke([message])
            # extracted_parts.append(res.content)
            # return "\n\n".join(extracted_parts)
        except Exception as e:
            print(f"❌ Error during Vision PDF extraction: {e}")
            return ""
        
    def analyze_extraction_quality(self,extracted_pages):

        review_required = False
        review_reasons = []
        confidences = []

        for page in extracted_pages:

            metadata = page.get("extraction_metadata")

            if not metadata:
                continue

            confidences.append(metadata["confidence_score"])

            if metadata["needs_human_review"]:
                review_reasons.append({
                    "page": page["page"],
                    "reason": metadata["review_reason"]
                })

        average_confidence = (
            sum(confidences) / len(confidences)
            if confidences else 0
        )
        
        if average_confidence < 80:
            review_required=True

        return {
            "needs_human_review": review_required,
            "review_reasons": review_reasons,
            "average_confidence": average_confidence
        }
        
    def clean_raw_data(self,raw_data):
        cleaned_raw_data=[]
        for page in raw_data:
            cleaned_raw_data.append({
        "page": page["page"],
        "content": page["content"],
        "tables": page["tables"]
    })
        return cleaned_raw_data
    
    # main function uses all the above 
    def process_files(self,files):
        all_files_cleaned_data=[]
        for file in files:
            try:
                file_type = self.intake_and_route(file)
                if not file_type=="drawing file": # edit to suit model
                    raw_data = self.extract_content(
                        file.file_url,
                        file_type
                    )

                    file_meta_data = self.analyze_extraction_quality(raw_data)

                    cleaned_data = self.clean_raw_data(raw_data)

                    file.extracted_data = cleaned_data
                    file.extracted_meta_data = file_meta_data
                    file.need_review=file_meta_data["needs_human_review"]
                    file.save()
                    if file_meta_data["needs_human_review"]:
                        return None
                    all_files_cleaned_data.append({
                        "file_id": file.id,
                        "file_category": file.file_category,
                        "content": cleaned_data
                    })
                else:
                    continue

            except Exception as e:
                print(f"Error processing file {file.id}: {e}")

        return all_files_cleaned_data
    
     # 3. Structuring Agent: تحويل البيانات الخام العشوائية لـ JSON موحد ومتوافق
    
    
    def structure_to_unified_json(self, type: str,raw_content: List) -> dict:
        print("⏳ Structuring Agent active. Formatting data to unified JSON structure...")
        
        raw_content_text = json.dumps(
            raw_content,
            ensure_ascii=False,
            indent=2
        )
        if type == "tender":
            parser = JsonOutputParser(pydantic_object=UnifiedStructuredTender)
            doc_context = """
            - Focus on finding the client/owner requirements, project scope, technical specifications, and the empty/blank Bill of Quantities (BOQ) tables.
            - Extract any rules, deadlines, or general compliance conditions set by the owner.
            """
        elif type == "Submission":
            parser = JsonOutputParser(pydantic_object=UnifiedStructuredProposal)
            doc_context = """
            - Carefully find the contractor name, total experience years, financial bids, pricing parameters, delivery timeframe, and the priced Bill of Quantities (BOQ) tables.
            - Normalize pricing and bidding figures strictly to numbers.
            """
            
        prompt = f"""You are an expert construction data standardization specialist. Your job is to take the raw extracted content and convert it strictly into the required unified JSON schema.
        
        Extraction Strategy:
        {doc_context}
        - Maintain data integrity; ensure item numbers, quantities, and text metrics align perfectly.
        - Ignore irrelevant conversational or layout filler text.
        Raw Content Notes:
        - Each object represents one uploaded file.
        - file_category indicates the purpose of the file.
        - Information may be distributed across multiple files.
        - Merge all available information into one final unified schema.
        - Do not create multiple outputs.
        - Produce a single complete JSON object.
        Format Instructions:
        {parser.get_format_instructions()}
        
        Raw Content:
        {raw_content_text[:40000]}
        """
        
        try:
            response = self.text_llm.invoke(prompt)
            # استخراج الـ JSON النظيف من استجابة النموذج
            clean_json = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        except Exception as e:
            print(f"❌ Error during data structuring: {e}")
            return {
                "contractor_name": "Unknown",
                "experience_years": 0,
                "financial_capacity": 0.0,
                "delivery_duration_days": 0,
                "boq_items": []
            }
    
    
    @transaction.atomic        
    def to_db(self,type:str,id:int,files:dict):
        if type == "tender":
            tender=get_object_or_404(Tenders,id=id)
            tender.structured_data=files
            tender.save()
            # tender.evaluation_rules.all().delete()
            for rule in files["evaluation_criteria"]:
                EvaluationRules.objects.create(
                    tender=tender,
                    rule_name=rule["name"],
                    rule_value=rule["weight"]
                )
                #  check if boq items exist
            if tender.boq_items.all():
                tender.boq_items.all().delete()    
            for item in files["boq_items"]:
                BoqItems.objects.create(
                    tender=tender,
                    item_name=item["item_name"],
                    quantity=item["quantity"],
                    unit=item["unit"]
                )
        elif type == "submission":
            submission=get_object_or_404(TenderSubmissions,id=id)
            submission.structured_data=files
            submission.contractor.experience_years=files["experience_years"]
            submission.save()
            for item in files["boq_items"]:
                boq_item = BoqItems.objects.filter(
                        tender=submission.tender,
                        item_name=item["item_name"]
                    ).first()
                BoqPrice.objects.create(
                    submission=submission,
                    boq_item=boq_item,
                    unit_price=item["unit_rate"],
                )
    
    # used in vector store            
    def table_to_text(self,table: list) -> str:
    
        if not table:
            return ""

        headers = table[0]

        lines = []

        for row in table[1:]:

            row_parts = []

            for header, value in zip(headers, row):
                if value:
                    row_parts.append(f"{header}: {value}")

            if row_parts:
                lines.append(" | ".join(row_parts))

        return "\n".join(lines)