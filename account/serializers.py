

from rest_framework import serializers
from account.models import Users

class RegisterSerializer(serializers.ModelSerializer):
    CHOICES=[
        choice for choice in Users.ROLE_CHOICES
            if choice != 'admin' 
    ]
    role=serializers.ChoiceField(choices=CHOICES)
    
    class Meta:
        model=Users
        fields=['username','password','email','role']
        extra_kwargs={
            "password":{"write_only":True}
        }
        
    def create(self, validated_data):
        return Users.objects.create_user(**validated_data)
    