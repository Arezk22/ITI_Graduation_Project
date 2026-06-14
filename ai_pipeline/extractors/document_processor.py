# boq_router.py
import os
import re
import fitz  # PyMuPDF
import json
from typing import Any
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
# تعريف الهيكل الموحد المرجو من الـ Structuring Agent باستخدام Pydantic
class UnifiedStructuredProposal(BaseModel):
    contractor_name: str = Field(description="Name of the contractor or construction company")
    experience_years: int = Field(description="Total years of experience indicated in the profile")
    financial_capacity: float = Field(description="Turnover, liquidity or financial capacity value in numbers")
    delivery_duration_days: int = Field(description="Proposed project completion duration in days")
    boq_items: list[dict] = Field(description="List of BOQ items, each containing: item_no, description, unit, quantity, unit_rate, total_amount")

class DocumentIntakeProcessor:
    def __init__(self, vision_llm, text_llm):
        self.vision_llm = vision_llm  # نموذج الرؤية (مثل Llama-Vision أو GPT-4o-mini)
        self.text_llm = text_llm      # نموذج النصوص القياسي للهيكلة

    # 1. Intake Agent: تحديد نوع الملف وتوجيهه للمسار الصحيح
    def intake_and_route(self, file_path: str) -> str:
        """وظيفة الـ Routing ومعرفة نوع الملف بالضبط"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at: {file_path}")
            
        ext = os.path.splitext(file_path)[1].lower()
        if ext in ['.xlsx', '.xls']:
            return "excel"
        elif ext in ['.docx', '.doc']:
            return "word"
        elif ext == '.pdf':
            # فحص إضافي لمعرفة هل الـ PDF نصي أم ممسوح ضوئياً (Scanned)
            try:
                with pdfplumber.open(file_path) as pdf:
                    text = "".join([page.extract_text() or "" for page in pdf.pages[:3]])
                    if len(text.strip()) > 100:
                        return "native_pdf"
                    else:
                        return "scanned_pdf"
                # doc = fitz.open(file_path)
                # text = ""
                # for page in doc[:3]:
                #     text += page.get_text()
                # doc.close()
                # if len(text.strip()) > 100:
                #     return "native_pdf"
                # else:
                #     return "scanned_pdf"
            except:
                return "scanned_pdf"
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
            return "\n".join(full_text)
            
        elif file_type == "native_pdf":
            with pdfplumber.open(file_path) as pdf:
                full_text = []
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    # 🌟 التعديل هنا: إصلاح مشكلة اللغة العربية المعكوسة
                    reshaped_text = arabic_reshaper.reshape(text)
                    bidi_text = get_display(reshaped_text)
                    full_text.append(bidi_text)
                return "\n".join(full_text)
                
                # 🌟 استخدام PyMuPDF لاستخراج النصوص العربية بدقة وبدون تشويه
            # try:
            #     doc = fitz.open(file_path)
            #     full_text = []
            #     for page in doc:
            #         full_text.append(page.get_text())
            #     doc.close()
            #     return "\n".join(full_text)
            # except Exception as e:
            #     print(f"❌ Error reading PDF: {e}")
            #     return ""
            
        elif file_type == "scanned_pdf":
            return self._extract_scanned_pdf_via_vision(file_path)
            
        else:
            return "Unsupported file content format."
    # 3. Structuring Agent: تحويل البيانات الخام العشوائية لـ JSON موحد ومتوافق
    def structure_to_unified_json(self, raw_content: Any) -> dict:
        print("⏳ Structuring Agent active. Formatting data to unified JSON structure...")
        parser = JsonOutputParser(pydantic_object=UnifiedStructuredProposal)
        
        prompt = f"""You are a data standardization expert. Your job is to take the following raw extracted content from a contractor's proposal and convert it strictly into the required unified JSON schema.
        
        Requirements:
        - Carefully find the contractor name, total experience years, financial parameters, delivery timeframe, and any bill of quantities (BOQ) tables.
        - Normalize pricing figures to numbers.
        
        Format Instructions:
        {parser.get_format_instructions()}
        
        Raw Content:
        {str(raw_content)[:40000]}  # حماية السلسلة من تخطي الـ Context limit
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

    def _extract_scanned_pdf_via_vision(self, pdf_path):
        """دالة مساعدة لتحويل صفحات الـ Scanned PDF لصور وتمريرها للـ Vision LLM"""
        extracted_parts = []
        try:
            images = convert_from_path(pdf_path, dpi=150)
            for i, img in enumerate(images):
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                
                # إرسال الصورة للـ Vision LLM لاستخراج النصوص والجداول بدقة
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": "Extract all readable text and tables from this page image. Maintain structure if possible."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                    ]
                )
                res = self.vision_llm.invoke([message])
                extracted_parts.append(res.content)
            return "\n\n".join(extracted_parts)
        except Exception as e:
            print(f"❌ Error during Vision PDF extraction: {e}")
            return ""