import pdfplumber
# ستحتاج مكتبة لتحويل الصفحة لصورة في حالة الـ Vision
# from pdf2image import convert_from_path 

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
                    print("✅ نجاح الاستخراج المجاني.")
                    structured_data = self._format_to_json(extracted_table)
                else:
                    print("⚠️ جدول معقد أو ممسوح ضوئياً! جاري التحويل للـ Vision API...")
                    # تحويل الصفحة المعينة فقط إلى صورة وإرسالها
                    page_image = self._convert_page_to_image(pdf_path, page_num)
                    structured_data = self._extract_with_vision(page_image)
                
                # إضافة البيانات المستخرجة كـ LangChain Document
                all_documents.append(self._create_document(structured_data, page_num))
                
        return all_documents

    def _extract_with_pdfplumber(self, page):
        # استخدام إعدادات مخصصة لاستخراج الجداول
        table = page.extract_table(table_settings={
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
        })
        return table

    def _is_table_valid(self, table):
        # شروط التحقق
        if not table: # لا يوجد جدول
            return False
            
        # التحقق من عدد الأعمدة في أول صف كمؤشر (مثلاً: البند، البيان، الكمية، السعر)
        header_row = table[0]
        valid_columns = [col for col in header_row if col and str(col).strip() != ""]
        
        # إذا كان عدد الأعمدة الواضحة أقل من 3، فالجدول غالباً مشوه
        if len(valid_columns) < 3:
            return False
            
        return True

    def _extract_with_vision(self, image):
        # هنا ستقوم ببناء الـ Chain الخاص بالـ Vision
        # ستقوم بتمرير الصورة للـ LLM مع Prompt يطلب إرجاع الجدول بصيغة JSON مهيكلة
        # مثال للـ Prompt: "Extract the Bill of Quantities table from this image. Return strictly as JSON with keys: item_no, description, unit, quantity, rate."
        pass
        
    def _create_document(self, data, page_num):
        # تحويل الـ JSON النهائي إلى Document ليتم عمل Embedding له وإدخاله في pgvector
        pass