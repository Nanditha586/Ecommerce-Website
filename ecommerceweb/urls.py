from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('shop.urls')),
    # Serve single page
   
    path('', TemplateView.as_view(template_name='shop/index.html'), name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


