from django.db import models
from api.models import Tenders
from account.models import Users
# Create your models here.

class ChatSession(models.Model):
    tender = models.ForeignKey(Tenders,on_delete=models.CASCADE,related_name="chat_sessions")
    user = models.ForeignKey(Users,on_delete=models.CASCADE,related_name="chat_sessions")
    created_at=models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255, default="New Conversation")
    updated_at=models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    
    
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
    source_type = models.CharField(max_length=50, blank=True, default="")
    source_id = models.CharField(max_length=255, blank=True, default="")
    
    class Meta:
        ordering=["created_at"]