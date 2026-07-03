#!/usr/bin/env python
"""
Test script to verify delete chat functionality
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from django.contrib.auth import get_user_model
from ai_pipeline.models import ChatSession
from ai_pipeline.services.chat_memory import ChatMemoryService
from api.models import Tenders

User = get_user_model()
memory = ChatMemoryService()

# Create test data
user = User.objects.filter(role='contractor').first()
if not user:
    print("❌ No contractor user found")
    sys.exit(1)

tender = Tenders.objects.first()
if not tender:
    print("❌ No tenders found")
    sys.exit(1)

# Create test chat
chat = ChatSession.objects.create(user=user, tender=tender, title="Test Chat for Deletion")
print(f"✓ Created test chat: {chat.id}")

# Test delete via ChatMemoryService
result = memory.delete_chat(user, chat.id)
print(f"Delete result: {result}")

# Check if chat was deleted
if ChatSession.objects.filter(id=chat.id).exists():
    print("❌ Chat still exists after delete")
    sys.exit(1)
else:
    print("✓ Chat was successfully deleted from database")

