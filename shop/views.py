from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.contrib.auth.models import User

from .models import Item, CartItem
from .serializers import ItemSerializer, CartItemSerializer, RegisterSerializer

# Register view
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

# Item viewset (CRUD + filters)
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('id')
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q')
        category = self.request.query_params.get('category')
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(category__icontains=q))
        if category:
            qs = qs.filter(category__iexact=category)
        if price_min:
            try:
                qs = qs.filter(price__gte=float(price_min))
            except:
                pass
        if price_max:
            try:
                qs = qs.filter(price__lte=float(price_max))
            except:
                pass
        return qs

# Cart APIs
class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity")
        try:
            cart_item = CartItem.objects.get(user=request.user, item_id=item_id)
            cart_item.quantity = quantity
            cart_item.save()
            return Response(CartItemSerializer(cart_item).data, status=200)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not in cart"}, status=404)


    def get(self, request):
        items = CartItem.objects.filter(user=request.user).select_related('item')
        serializer = CartItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        # add/update cart item
        serializer = CartItemSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data['item']
        quantity = serializer.validated_data.get('quantity', 1)
        cart_item, created = CartItem.objects.get_or_create(user=request.user, item=item, defaults={'quantity': quantity})
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        return Response(CartItemSerializer(cart_item, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        # expect ?item_id=<id> to remove completely, or body with item_id
        item_id = request.query_params.get('item_id') or request.data.get('item_id')
        if not item_id:
            return Response({'detail':'item_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cart_item = CartItem.objects.get(user=request.user, item_id=int(item_id))
            cart_item.delete()
            return Response({'detail':'removed'})
        except CartItem.DoesNotExist:
            return Response({'detail':'not found'}, status=status.HTTP_404_NOT_FOUND)
    