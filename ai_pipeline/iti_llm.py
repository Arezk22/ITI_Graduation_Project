import os
import requests

BASE_URL = os.getenv("ITI_BASE_URL")
API_KEY = os.getenv("ITI_API_KEY")
MODEL = os.getenv("MODEL")



def chat(messages, system_prompt=None, max_tokens=1000):

    payload = {
        "model_id": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
    }

    if system_prompt:
        payload["system_prompt"] = system_prompt

    response = requests.post(
        f"{BASE_URL}/student/chat",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    response.raise_for_status()
    return response.json() 




def vision_chat(prompt, image_b64):
    
    
    print(BASE_URL)
    print(MODEL)

    payload = {
        "model_id": MODEL,
        "messages": [
            {
                "role": "user",
                "text": prompt,
                "images": [
                    {
                        "format": "jpeg",
                        "data_base64": image_b64
                    }
                ]
            }
        ],
        "max_tokens": 2000
    }

    r = requests.post(
        f"{BASE_URL}/student/multimodal-chat",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )
    print(r.status_code)
    print(r.text)
    r.raise_for_status()

    return r.json()