# boq_router.py
import os
from django.db import transaction
import json
from typing import List, Optional, Dict, Any
import base64
import pandas as pd
import pdfplumber
from io import BytesIO
from docx import Document as DocxReader
from pdf2image import convert_from_path
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from bidi.algorithm import get_display
from dotenv import load_dotenv
from api.models import (Tenders,TenderSubmissions,EvaluationRules,BoqItems,BoqPrice)
from django.shortcuts import get_object_or_404
from ai_pipeline.iti_llm import chat , vision_chat
load_dotenv()

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

    quantity: Optional[float] = Field(
        description="Proposed quantity",
        default=None
    )

    unit_rate: Optional[float] = Field(
        description="Price per unit",
        default=None,
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

    unit: Optional[str] = Field(
        default=None,
        description="Measurement unit"
    )

    quantity: Optional[float] = Field(
        default=None,
        description="Required quantity"
    )
    
class EvaluationRule(BaseModel):
    name: str = Field(description="Evaluation criterion name")
    weight: float = Field(description="Weight of this criterion")
    
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

    mandatory_certificates: List[str] = Field(
    default_factory=list,
    description="Certificates explicitly marked as mandatory or required."
)

    preferred_certificates: List[str] = Field(
        default_factory=list,
        description="Certificates explicitly marked as preferred, optional, recommended or desirable."
    )
    
    mandatory_documents: List[str] = Field(
    default_factory=list,
    description="Documents explicitly marked as mandatory or required such as tax card, commercial register, financial statements, etc.."
)

    preferred_documents: List[str] = Field(
        default_factory=list,
        description="Documents explicitly marked as preferred, optional, recommended or desirable."
    )
    
    mandatory_licenses: List[str] = Field(
    default_factory=list,
    description="contractor licenses or classification grades explicitly marked as mandatory or required"
)

    preferred_licenses: List[str] = Field(
        default_factory=list,
        description="contractor licenses or classification grades explicitly marked as preferred, optional, recommended or desirable."
    )

    
    mandatory_technical_requirements: List[str]= Field(
        default_factory=list,
        description="Technical requirements explicitly marked as mandatory or required mentioned in the tender"
    )
    

    preferred_technical_requirements: List[str]= Field(
        default_factory=list,
        description="Technical requirements explicitly marked as preferred, optional, recommended or desirable. mentioned in the tender"
    )
    

    custom_requirements: List[str] = Field(
        default_factory=list,
        description="Any special requirements not covered by predefined fields"
    )

    evaluation_criteria: List[EvaluationRule] = Field(
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
        file_path=file.file.path
        category=file.file_category
        print(f"🔺from intake .. {category} file")
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
    
            for element in doc.element.body:
                if element.tag.endswith('p'):
                    from docx.text.paragraph import Paragraph
                    para = Paragraph(element, doc)
                    if para.text.strip():
                        full_text.append(para.text)
                        
                elif element.tag.endswith('tbl'):
                    from docx.table import Table
                    table = Table(element, doc)
                    for row in table.rows:
                        text_row = []
                        for cell in row.cells:
                            text_row.append(cell.text.strip())
                        
                        row_string = " | ".join(text_row)
                        if row_string.strip(): 
                            full_text.append(row_string)
                            
            return full_text
            
        elif file_type == "pdf":
            # with pdfplumber.open(file_path) as pdf:
            #     full_text = []
            #     for page_num, page in enumerate(pdf.pages,start=1):
                    # text=page.extract_text()
                    # tables=page.extract_tables()
                    # if len(text.strip())>50 or tables:
                    #     full_text.append({
                    #     "page":page_num,
                    #     "type":"digital",
                    #     "content":text,
                    #     "tables":tables
                    # })
                    # else:
                #         poppler_path=os.getenv("POPPLER_PATH")
                #         page_image=convert_from_path(file_path,first_page=page_num,last_page=page_num,poppler_path=poppler_path)[0]
                #         ocr_data=self._extract_scanned_pdf_via_vision(page_image)
                #         full_text.append({
                #             "page":page_num,
                #             "type":"scanned",
                #             "extraction_metadata":{
                #                 "confidence_score": ocr_data["confidence_score"],
                #                 "needs_human_review": ocr_data["needs_human_review"],
                #                 "review_reason": ocr_data["review_reason"],
                #                 "unclear_sections": ocr_data["unclear_sections"],
                #             },
                #             "content":ocr_data["extracted_text"],
                #             "tables":ocr_data["tables"]
                #         })
                # return full_text
            
                
            # sending all file to vision
            ocr_data=self._extract_scanned_pdf_via_vision(file_path)
            return ocr_data
        else:
            return "Unsupported file content format."

    def _extract_scanned_pdf_via_vision(self, file_path):
        """دالة مساعدة لتحويل صفحات الـ Scanned PDF لصور وتمريرها للـ Vision LLM"""
        prompt="""You are an expert OCR engine specialized in construction, engineering, procurement, tender, BOQ, technical proposal, financial proposal, and contractor qualification documents.

Your ONLY job is to extract every piece of visible information exactly as it appears.

==========================
PRIMARY OBJECTIVE
==========================

Your highest priority is MAXIMUM RECALL.

Missing information is considered a critical failure.

Never summarize.
Never simplify.
Never shorten.
Never ignore information because it appears unimportant.

If text exists anywhere on the page, extract it.

==========================
OCR EXTRACTION RULES
==========================

Perform two internal OCR passes before producing the final JSON.

Pass 1:
Extract every visible text region.

Pass 2:
Review the entire page again looking only for information that may have been missed in pass 1.

The final output must include the union of both passes.

Extract ALL visible text from the document.
This includes text appearing inside:

- paragraphs
- tables
- headers
- footers
- side notes
- stamps
- signatures
- company logos
- scanned certificates
- licenses
- appendices
- attachments
- handwritten notes (when readable)
- engineering drawings
- title blocks
- callout boxes
- watermarks (if readable)

Never ignore text because of its location.

False positives are acceptable.

False negatives are not acceptable.

When uncertain whether text exists,
prefer extracting it rather than omitting it.
==========================
DO NOT OMIT
==========================

Pay special attention to extracting ALL occurrences of:

- contractor names
- client names
- project names
- certificate names
- license names
- document names
- company registration numbers
- ISO certificates
- contractor classifications
- financial values
- quantities
- units
- dates
- percentages
- BOQ items
- equipment names
- personnel names
- project references
- material specifications
- technical specifications
- standards
- compliance requirements

Never keep only the "important" ones.

Extract ALL of them.

==========================
NUMBERS
==========================

Numbers are extremely important.

Never modify numbers.

Never round values.

Never calculate totals.

Never convert currencies.

Preserve exactly:

585000

17,367,200

17.367.200

17 367 200

SAR 350,000

25%

10 m²

150 mm

etc.

==========================
TABLE EXTRACTION
==========================

Tables are critical.

Never summarize a table.

Never convert a table into normal text.

Never merge tables together.

Every table must be extracted independently.

Preserve:

- row order
- column order
- merged cells (best effort)
- empty cells
- duplicated rows

Return tables exactly as:

{
    "header":[...],
    "rows":[...]
}

Never change this schema.

==========================
MULTI PAGE RULES
==========================

Process EVERY page independently.

Never merge pages.

Never skip pages.

Never reorder pages.

If the PDF has N pages,
the output MUST contain exactly N page objects.

==========================
QUALITY ASSESSMENT
==========================

For every page evaluate:

- OCR confidence
- blur
- cut text
- unreadable areas
- missing regions
- damaged scans
- rotated text
- table readability

If important information is unreadable:

needs_human_review = true

If confidence < 80:

needs_human_review = true

Never invent missing text.

==========================
LANGUAGE
==========================

Preserve the original language.

Do NOT translate.

Do NOT normalize.

Keep Arabic exactly as Arabic.

Keep English exactly as English.

==========================
SPECIAL RULES
==========================

If the same certificate appears multiple times,
extract every occurrence.

If the same document appears on different pages,
extract every occurrence.

If text is uncertain,
extract your best reading.

Do NOT delete uncertain text.

Mention uncertainty inside:

unclear_sections    

==========================
OUTPUT FORMAT
==========================

Return ONLY valid JSON.

Do not return markdown.

Do not return explanations.

Do not return comments.

Return exactly:

{
  "pages":[
    {
      "page":1,
      "type":"scanned",
      "extraction_metadata":{
        "confidence_score":95,
        "needs_human_review":false,
        "review_reason":"",
        "unclear_sections":[]
      },
      "content":"...",
      "tables":[
        {
          "header":[
            "Column1",
            "Column2"
          ],
          "rows":[
            [
              "A",
              "B"
            ]
          ]
        }
      ]
    }
  ]
}"""
        try:
            
        # # ITI_GATEWAY
        # buffered = BytesIO()
        # img.save(buffered, format="JPEG")
        # img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        # res = vision_chat(prompt, img_str)
        # return res
        # res = self.vision_llm.invoke([message])
        # response_text = res.content
        # clean_json = response_text.replace("```json", "").replace("```", "").strip()
        # clean_json = response_text.strip()
        # ocr_data = json.loads(clean_json)
        # print(ocr_data)
        # return ocr_data   
            
            
        # in gemini model 
            uploaded_file=self.ai_client.files.upload(
                file=file_path
            )
            vision_response = self.ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                uploaded_file, 
                prompt
            ]
        )
            response_text = vision_response.text
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            ocr_data = json.loads(clean_json)
            self.ai_client.files.delete(name=uploaded_file.name)
            return ocr_data["pages"]
            
            # in openai model
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
        # response_text = res.content
        # clean_json = response_text.replace("```json", "").replace("```", "").strip()
        # clean_json = response_text.strip()
        # ocr_data = json.loads(clean_json)
        # print(ocr_data)
        # return ocr_data
        
        
        
        
        
    
        
        except Exception as e:
            print(f"❌ Error during Vision PDF extraction: {e}")
            raise
            # return [
            #     {
            #     "page":"all pages",
            #     "type":"scanned",
            #     "extraction_metadata":{
            #         "confidence_score": 0,
            #         "needs_human_review": True ,
            #         "review_reason": "Didnot extract successfully",
            #         "unclear_sections": [],
            #     },
            #     "content":"",
            #     "tables":[]
            #     }
            # ]
        
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
                        file.file.path,
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
            doc_context = """Focus on extracting EVERY owner requirement.

Pay special attention to:

- mandatory certificates
- preferred certificates
- mandatory documents
- preferred documents
- mandatory licenses
- preferred licenses
- mandatory technical requirements
- preferred technical requirements
- custom requirements
- evaluation criteria and weights
- project duration
- experience requirements
- project description
- budget
- complete BOQ tables

Do not summarize requirements.

Extract every individual requirement separately.
Do not extract only mandatory requirements.

Extract ALL owner requirements.
If an important statement does not belong to any field above,
place it in custom_requirements.

Never leave important requirements unclassified.
Later classify them into:

- mandatory
- preferred

based on the wording used in the tender.

If no wording indicates that a requirement is preferred,
assume it is mandatory.
            """
        elif type == "submission":
            parser = JsonOutputParser(pydantic_object=UnifiedStructuredProposal)
            doc_context = """Focus on extracting EVERY contractor capability.

Pay special attention to:

- contractor name
- company information
- experience
- previous projects
- financial capacity
- certificates
- licenses
- submitted documents
- technical offer
- implementation methodology
- equipment
- key personnel
- warranty
- support services
- deviations
- exclusions
- complete priced BOQ tables

Do not summarize lists.

Extract every item individually.

Never ignore certificates, licenses, or documents even if they appear only once.
Extract every capability the contractor claims.

Even if the capability is mentioned inside:

- certificates
- project references
- CVs
- methodology
- appendices
- cover letters

it must still appear in the appropriate schema field."""
            
        prompt = f"""You are an expert construction, procurement, and tender document analysis specialist.

Your task is to convert raw OCR text into ONE structured JSON object that strictly follows the provided schema.

==========================
PRIMARY OBJECTIVE
==========================

Your highest priority is MAXIMUM RECALL.

Never omit information.

Never summarize unless the schema explicitly requires a summary.

Every relevant piece of information found in the raw text must appear somewhere in the output schema.

Missing information is considered a critical failure.

==========================
GENERAL EXTRACTION RULES
==========================

- Read the ENTIRE raw content before producing the JSON.
- Information may be spread across multiple pages and multiple uploaded files.
- Merge duplicated information.
- Never discard additional information.
- If two files contain complementary information, combine them.
- Preserve factual accuracy.
- Never invent values.
- Never infer information that is not explicitly stated.
- If a field is not mentioned, leave it empty instead of guessing.
- Preserve the original meaning even if wording differs.
-   If the same information appears multiple times,
    merge duplicates instead of removing information.
    Never lose information because it appeared more than once.
- If information could reasonably belong to more than one schema field,
    prefer storing it in multiple relevant fields rather than omitting it.

==========================
DOCUMENT TYPE
==========================

{doc_context}


==========================
SEMANTIC MATCHING
==========================

Do NOT rely on exact wording.

Treat equivalent names as the same entity.

Examples:

ISO9001
ISO 9001
ISO-9001
ISO9001:2015

are the same certificate.

Commercial Register
Commercial Registration
السجل التجاري

represent the same document.

VAT Registration
VAT Certificate
ضريبة القيمة المضافة

represent the same document.

==========================
DO NOT IGNORE
==========================

Pay special attention to extracting ALL occurrences of:

• certificates
• licenses
• submitted documents
• contractor classifications
• evaluation criteria
• technical specifications
• mandatory requirements
• preferred requirements
• project duration
• experience requirements
• company capabilities
• equipment
• methodology
• support services
• deviations
• exclusions
• key personnel
• previous projects
• BOQ items
• financial values
• quantities
• units
• percentages
• currencies
• dates

Every occurrence matters.

==========================
TABLES
==========================

Information inside tables is often more important than normal paragraphs.

Inspect every table carefully.

Never ignore table rows.

Many BOQ items, certificates, personnel, equipment,
pricing, and project references exist only inside tables.

==========================
MULTIPLE OCCURRENCES
==========================

If multiple certificates exist:

Extract ALL of them.

If multiple licenses exist:

Extract ALL of them.

If multiple previous projects exist:

Extract ALL of them.

If multiple equipment items exist:

Extract ALL of them.

Do NOT keep only representative examples.

==========================
NUMBERS
==========================

Never modify numbers.

Never calculate totals.

Never round values.

Preserve:

- prices
- quantities
- percentages
- years
- durations
- budgets

exactly as stated.

==========================
CLASSIFICATION RULES
==========================

Mandatory and preferred requirements must never be mixed.

If the tender explicitly says:

must
mandatory
required
shall
يجب
يلتزم
شرط أساسي

→ classify as Mandatory.

If the tender says:

preferred
recommended
optional
desirable
يفضل
يُفضل
من المستحسن

→ classify as Preferred.

Never promote preferred requirements into mandatory ones.

==========================
CUSTOM REQUIREMENTS
==========================

If you find any important owner requirement that cannot be classified as:

- mandatory certificate
- preferred certificate
- mandatory document
- preferred document
- mandatory license
- preferred license
- mandatory technical requirement
- preferred technical requirement
- evaluation criterion
- BOQ item

then DO NOT ignore it.

Store it inside:

custom_requirements

Examples include:

- contractual conditions
- legal conditions
- owner reservations
- award conditions
- payment conditions
- acceptance conditions
- submission conditions
- general obligations
- penalties
- guarantees
- insurance obligations
- execution constraints
- special instructions

Never discard important requirements simply because no predefined field exists.
==========================
FIELD MAPPING
==========================

Always try to map extracted information into the most appropriate schema field.

Only use notes or custom_information when absolutely no dedicated field exists.

Never move certificates, documents, licenses, technical requirements, BOQ items, personnel, equipment, methodology, support services, evaluation criteria, pricing information, or project information into notes.
==========================
COMPLETENESS CHECK
==========================

Before generating the JSON, perform an internal review.

Verify that:

✓ every certificate has been extracted

✓ every submitted document has been extracted

✓ every license has been extracted

✓ every BOQ item has been extracted

✓ every project reference has been extracted

✓ every equipment item has been extracted

✓ every key person has been extracted

✓ every financial value has been extracted

✓ every technical requirement has been extracted

Only after this review produce the final JSON.

==========================
OUTPUT RULES
==========================

- Produce ONE JSON object only.
- The output MUST strictly follow the provided schema.
- Never invent fields.
- Never remove fields.
- Never output Markdown.
- Never output explanations.
- Return ONLY valid JSON.

Format Instructions:

{parser.get_format_instructions()}

Raw Content:

{raw_content_text[:50000]}
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
                
                if boq_item is None:
                    print(f"BOQ item not found: {item['item_name']}")
                    continue
                
                BoqPrice.objects.create(
                    submission=submission,
                    boq_item=boq_item,
                    unit_price=item["unit_rate"],
                )
    
    # used in vector store 
    @staticmethod           
    def table_to_text(table: list) -> str:
    
        if not table:
            return ""

        # الشكل الجديد
        if isinstance(table, dict):
            headers = table.get("header", [])
            rows = table.get("rows", [])

        # الشكل القديم
        elif isinstance(table, list):
            headers = table[0]
            rows = table[1:]

        else:
            return ""

        lines = []

        for row in rows:
            row_parts = []

            for header, value in zip(headers, row):
                if value:
                    row_parts.append(f"{header}: {value}")

            if row_parts:
                lines.append(" | ".join(row_parts))

        return "\n".join(lines)