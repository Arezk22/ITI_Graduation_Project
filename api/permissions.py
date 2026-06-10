from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    message = "Only owners can create or manage tenders."
    def has_permission(self, request, view):
        return request.user.role=="owner"
    
    

class IsContractor(BasePermission):
    message = "Only contractors can submit tender offers."
    def has_permission(self, request, view):
        return request.user.role=="contractor"


class IsTenderOwner(BasePermission):
    message = "You are not the owner of this tender."    
    def has_permission(self, request, view,obj):
        return request.user == obj.owner