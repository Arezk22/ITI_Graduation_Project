import os
from langchain_openai import ChatOpenAI
from google import genai

from dotenv import load_dotenv

load_dotenv()
gemini_client=genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
vision_llm = ChatOpenAI(
            model=os.getenv("MODEL"), 
            temperature=0,
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENAI_API_BASE")
        ).bind(response_format={"type": "json_object"})
        
text_llm = ChatOpenAI(
            model=os.getenv("MODEL"),
            temperature=0, 
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENAI_API_BASE")
        )