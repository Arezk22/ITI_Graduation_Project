from datetime import datetime

from requests import session

from ai_pipeline.models import ChatSession,ChatMessage


def default_title(tender):
    date= datetime.now().strftime("%b %d")
    if tender is not None:
        return f"{tender.title} chat - {date}"
    return f"chat - {date}"

def _to_openai_message(item):
    """Normalize a ConversationMessage instance OR a dict to a
    JSON-serializable OpenAI message dict: ``{"role": ..., "content": ...}``.

    Anything we cannot interpret (wrong shape, missing fields) is dropped so
    the agents never feed non-serializable objects to the LLM client.
    """
    if isinstance(item, dict):
        role = item.get("role")
        content = item.get("content")
    else:
        role = getattr(item, "role", None)
        content = getattr(item, "content", None)

    if role not in {"user", "assistant", "system"}:
        return None
    if not isinstance(content, str) or not content.strip():
        return None
    return {"role": role, "content": content}


def to_openai_messages(items):
    """Convert an iterable of ConversationMessage instances and/or dicts into
    a clean list of OpenAI message dicts, dropping any malformed entries."""
    if not items:
        return []
    out = []
    for item in items:
        msg = _to_openai_message(item)
        if msg is not None:
            out.append(msg)
    return out

class ChatMemoryService:
    
    
    def list_chats(self,user,tender=None,limit=50):
        qs=ChatSession.objects.filter(user=user)
        if tender:
            qs=qs.filter(tender=tender)
        return list(qs.order_by("-updated_at")[:limit])
    
    def get_chat(self,user,chat_id):
        if not chat_id:
            return None
        try:
            return ChatSession.objects.get(id=chat_id,user=user)
        except(ChatSession.DoesNotExist,ValueError):
            return None
        
    def create_chat(self,user,tender=None,title=''):
        if not title:
            title=default_title(tender)
        return ChatSession.objects.create(tender=tender,user=user,title=title)
    
    def get_or_create_current_chat(self,tender,user):
        
        chat=ChatSession.objects.filter(user=user,tender=tender).order_by("-updated_at").first()
        if not chat:
            chat=self.create_chat(user=user,tender=tender)
        return chat
            
            
            
    def delete_chat(self,user,chat_id):
        chat=self.get_chat(user,chat_id)
        if chat:
            chat.delete()
            return True
        return False
    
    def arrange_chat(self,chat):
        chat.save(update_fields=['updated_at'])
    
    def append_message(self,chat,role,content,source_id='',source_type=""):
        msg=ChatMessage.objects.create(
            session=chat,
            content=content,
            role=role,
            source_id=source_id,
            source_type=source_type
        )
        self.arrange_chat(chat)
        return msg
    
    def get_recent_messages(self, chat, limit=8):
        return list(chat.messages.all().order_by("-created_at")[:limit][::-1])
    
    
    def get_recent_openai_messages(self, chat, limit=8):
        """Return recent messages as JSON-safe OpenAI message dicts."""
        return to_openai_messages(self.get_recent_messages(chat, limit=limit))
    