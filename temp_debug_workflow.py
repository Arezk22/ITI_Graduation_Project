import traceback
from ai_pipeline.agents.tender_graph import TenderWorkflow

try:
    workflow = TenderWorkflow(
        llm=None,
        db_connection_string='postgresql+psycopg2://postgres:1012@localhost:5433/iti_graduation_project'
    )
    initial_state = {
        'tender_id': 'test_tender_001',
        'user_query': 'Please provide a comprehensive report on the legal and financial risks.',
        'extracted_text': 'dummy',
        'extracted_boq': [],
        'chat_history': []
    }
    print('Initial state:', initial_state)
    result = workflow.run(initial_state)
    print('Result:', result)
except Exception:
    traceback.print_exc()
