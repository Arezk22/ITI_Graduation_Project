import os
from langchain_openai import ChatOpenAI
from google import genai


gemini_client=genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
vision_llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE")
        )
        
text_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0, 
            api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE")
        )