from .chat_memory import ChatMemoryService


memory=ChatMemoryService()    

class ChatService:
    
    
    def send_message(self,user,tender,message,chat_id=None):
        chat=memory.get_chat(tender,user,chat_id)
        
        memory.append_message(chat,"user",message)
        recent_msgs=memory.get_recent_openai_messages(chat)
        
        