from django.db import models
from api.models import Tenders
from account.models import Users
# Create your models here.

class ChatSession(models.Model):
    tender = models.ForeignKey(Tenders,on_delete=models.CASCADE,related_name="chat_sessions")
    user = models.ForeignKey(Users,on_delete=models.CASCADE,related_name="chat_sessions")
    created_at=models.DateTimeField(auto_now_add=True)
    
class ChatMessage(models.Model):
    ROLE_CHOICES=(
        ("user","User"),
        ("assistant","Assistant"),
        ("system","System")
    )
    
    session=models.ForeignKey(ChatSession,on_delete=models.CASCADE,related_name="messages")
    content=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    role=models.CharField(max_length=15,choices=ROLE_CHOICES)