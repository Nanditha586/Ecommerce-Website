

# Register your models here.
from django.contrib import admin
from .models import Item, CartItem

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('id','name','category','price')

@admin.register(CartItem)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id','user','item','quantity','added_at')
