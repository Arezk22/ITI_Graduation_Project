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
    def has_object_permission(self, request, view, obj):
        return request.user == obj.owner
    
    
class IsSubmissionOwnerOrTenderOwner(BasePermission):
    message = "You do not have access to this submission."
    def has_object_permission(self, request, view, obj):
        if request.user == obj.tender.owner:
            return True
        contractor_profile = getattr(request.user, "contractor_profile", None)
        return contractor_profile is not None and contractor_profile == obj.contractor