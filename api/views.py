from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from api.models import Tenders
from api.serializers import TendersSerializer
from rest_framework.views import APIView

# Create your views here.
# Get all tenders
class TendersListView(APIView):
    def get(self, request):
        tenders = Tenders.objects.all()
        serializer = TendersSerializer(tenders, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = TendersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# Get single tender by id

class TenderDetailView(APIView):
    def get_object(self, pk):
        try:
            return Tenders.objects.get(pk=pk)
        except Tenders.DoesNotExist:
            return None
        
    def get(self, request, pk):
        tender = self.get_object(pk)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        serializer = TendersSerializer(tender)
        return Response(serializer.data)

    def put(self, request, pk):
        tender = self.get_object(pk)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        serializer = TendersSerializer(tender, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        tender = self.get_object(pk)
        if not tender:
            return Response(status=404, data={'message': 'Tender not found'})
        tender.delete()
        return Response(status=204, data={'message': 'Tender deleted successfully'})