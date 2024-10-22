from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Appointment

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'name', 'email', 'phone', 'age', 'location', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('name','phone', 'age', 'location')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('name','phone', 'age', 'location')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Appointment)
