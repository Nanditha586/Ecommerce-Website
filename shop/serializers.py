from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Item, CartItem

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username','password','email','first_name','last_name')

    def create(self, validated_data):
        user = User(username=validated_data['username'], email=validated_data.get('email',''))
        user.set_password(validated_data['password'])
        user.save()
        return user

class ItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ('id','name','category','price','image','image_url')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

class CartItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), write_only=True, source='item')

    class Meta:
        model = CartItem
        fields = ('id','item','item_id','quantity','added_at')
