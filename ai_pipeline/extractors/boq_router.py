import pdfplumber
import base64
import json
from io import BytesIO
from pdf2image import convert_from_path
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
import time

class BOQExtractionRouter:
    def __init__(self, vision_llm):
        # تمرير الـ Vision Model (مثلاً gpt-4o-mini لتقليل التكلفة)
        self.vision_llm = vision_llm
        
    def process_document(self, pdf_path):
        all_documents = []
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                print(f"Processing Page {page_num + 1}...")
                
                # 1. المحاولة بالطريقة المجانية أولاً
                extracted_table = self._extract_with_pdfplumber(page)
                
                # 2. التقييم (Validation)
                if self._is_table_valid(extracted_table):
                    # print("✅ نجاح الاستخراج المجاني.")
                    print("✅ Free extraction successful.")
                    structured_data = self._format_to_json(extracted_table)
                else:
                    # print("⚠️ جدول معقد أو ممسوح ضوئياً! جاري التحويل للـ Vision API...")
                    print("⚠️ Complex or scanned table detected! Converting to Vision API...")
                    time.sleep(5)
                    # تحويل الصفحة المعينة فقط إلى صورة
                    images = convert_from_path(pdf_path, first_page=page_num+1, last_page=page_num+1,poppler_path=r"C:\poppler\Library\bin")
                    page_image = images[0]
                    # استخراج البيانات باستخدام الذكاء الاصطناعي
                    structured_data = self._extract_with_vision(page_image)
                
                # 3. تحويل البيانات المستخرجة إلى LangChain Documents
                documents = self._create_document(structured_data, page_num)
                all_documents.extend(documents)
                
        return all_documents

    def _extract_with_pdfplumber(self, page):
        table = page.extract_table(table_settings={
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
        })
        return table

    def _is_table_valid(self, table):
        if not table: 
            return False
            
        header_row = table[0]
        valid_columns = [col for col in header_row if col and str(col).strip() != ""]
        
        if len(valid_columns) < 3:
            return False
            
        return True

    def _format_to_json(self, table):
        """
        دالة مساعدة لتحويل الجدول المستخرج من pdfplumber إلى قائمة من القواميس (JSON)
        """
        if not table or len(table) < 2:
            return []
            
        headers = [str(col).strip() if col else f"col_{i}" for i, col in enumerate(table[0])]
        data = []
        for row in table[1:]:
            # تنظيف الخلايا الفارغة
            clean_row = [str(cell).strip() if cell else "" for cell in row]
            # دمج الـ Headers مع القيم
            row_dict = dict(zip(headers, clean_row))
            data.append(row_dict)
            
        return data

    def _extract_with_vision(self, image):
        """
        تحويل الصورة إلى Base64 وإرسالها لـ GPT-4o Vision لاستخراج الجدول كـ JSON
        """
        # 1. تحويل الصورة إلى Base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

        # 2. بناء الـ Prompt الصارم لضمان عودة البيانات مهيكلة
        prompt_text = """
        Extract the Bill of Quantities (BOQ) table from this image.
        Return the output strictly as a JSON array of objects.
        Do not include any explanations, markdown formatting, or ```json blocks. Just the raw JSON array.
        Each object should have these keys if they exist in the table: 
        "item_no", "description", "unit", "quantity", "unit_price", "total_price".
        """

        # 3. تجهيز الرسالة للـ LLM
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt_text},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_str}"}}
            ]
        )

        try:
            # 4. إرسال الطلب واستقبال النتيجة
            response = self.vision_llm.invoke([message])
            
            # تنظيف النتيجة تحسباً لو قام النموذج بإضافة أي نصوص إضافية
            clean_json = response.content.strip().strip('```json').strip('```')
            data = json.loads(clean_json)
            return data
            
        except Exception as e:
            # print(f"❌ خطأ أثناء الـ Vision Extraction: {e}")
            print(f"❌ Error during Vision Extraction: {e}")
            return []

    def _create_document(self, data, page_num):
        """
        تحويل الـ JSON المستخرج إلى كائنات Document جاهزة للـ Embeddings
        """
        documents = []
        if not data:
            return documents

        for row in data:
            # نتخطى الصفوف الفارغة تماماً
            if not any(row.values()):
                continue

            # 1. بناء الـ page_content (النص الذي سيتم البحث فيه)
            # نقوم بدمج المفاتيح والقيم في نص واحد مقروء
            content_parts = [f"{k}: {v}" for k, v in row.items() if v]
            page_content = " | ".join(content_parts)

            # 2. بناء الـ metadata
            metadata = {
                "page": page_num + 1,
                "source_type": "boq_table",
            }
            # إضافة بيانات الصف نفسه في الـ Metadata لتسهيل الفلترة على الوكيل المالي
            metadata.update(row)

            # 3. إنشاء الـ Document
            doc = Document(page_content=page_content, metadata=metadata)
            documents.append(doc)

        return documents