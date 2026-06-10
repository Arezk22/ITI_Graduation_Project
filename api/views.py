from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import NotFound
from api.models import Tenders
from api.serializers import TendersSerializer
from .permissions import IsOwner,IsContractor,IsTenderOwner


class TendersListView(APIView):
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(),IsOwner()]
        return [IsAuthenticated()] 
    
    
    def get(self, request):
        if request.user.role == 'owner':
            tenders= Tenders.objects.filter(owner=request.user)
        else:
            tenders = Tenders.objects.all()
        serializer = TendersSerializer(tenders, many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = TendersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TenderDetailView(APIView):
    
    def get_permissions(self):
        if self.request.method in ["PUT","DELETE"]:
            return [IsAuthenticated(),IsTenderOwner()]
        return [IsAuthenticated()] 
    
    def get_object(self, pk):
        try:
            return Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            raise NotFound("Tender not found.")
        
    def get(self, request, pk):
        tender = self.get_object(pk)
        serializer = TendersSerializer(tender)
        return Response(serializer.data)

    def put(self, request, pk):
        tender = self.get_object(pk)    
        self.check_object_permissions(request,tender)
        serializer = TendersSerializer(tender, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tender = self.get_object(pk)
        self.check_object_permissions(request,tender)
        tender.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)