#!/usr/bin/env python
"""
Quick script to set user role to contractor
Run this from project root: python fix_user_role.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from account.models import Users

# Get all users
users = Users.objects.all()

if not users.exists():
    print("❌ No users found in database")
    exit(1)

print("\n📋 Found users:")
print("-" * 60)
for i, user in enumerate(users, 1):
    print(f"{i}. {user.username} (Email: {user.email}, Role: {user.role})")

print("\n" + "-" * 60)
choice = input("Enter user number to set as contractor (or 'all' for all users): ").strip()

try:
    if choice.lower() == 'all':
        users.update(role='contractor')
        print(f"\n✅ Updated {users.count()} user(s) to contractor role")
    else:
        user_idx = int(choice) - 1
        user = list(users)[user_idx]
        user.role = 'contractor'
        user.save()
        print(f"\n✅ Updated '{user.username}' to contractor role")
except (ValueError, IndexError):
    print("\n❌ Invalid choice")
    exit(1)

print("\n🎉 Done! Now try sending a chat message again.\n")
