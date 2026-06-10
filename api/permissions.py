from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    
    def has_permission(self, request, view):
        return request.user.role=="owner"
    
    

class IsContractor(BasePermission):
    
    def has_permission(self, request, view):
        return request.user.role=="contractor"


class IsTenderOwner(BasePermission):
        
    def has_permission(self, request, view,obj):
        return request.user == obj.owner