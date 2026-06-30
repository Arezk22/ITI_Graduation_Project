import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from ai_pipeline.main_pipeline import run_tender_evaluation_job


assert callable(run_tender_evaluation_job)
print('import_ok')
