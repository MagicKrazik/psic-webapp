from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)



class CustomUserCreationForm(UserCreationForm):
    name = forms.CharField(required=True, label="Nombre completo")
    email = forms.EmailField(required=True, label="Correo electrónico")
    age = forms.IntegerField(
        validators=[MinValueValidator(1)],
        label="Edad",
        widget=forms.TextInput(attrs={'type': 'number', 'step': '1', 'min': '1'})
    )
    
    class Meta:
        model = CustomUser
        fields = ("username", "name", "email", "phone", "age", "location", "password1", "password2")
        labels = {
            'username': _('Usuario'),
            'phone': _('Teléfono'),
            'age': _('Edad'),
            'location': _('Ciudad'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].label = 'Contraseña'
        self.fields['password2'].label = 'Confirmar contraseña'
        self.fields['password1'].help_text = 'Tu contraseña debe tener al menos 8 caracteres y no puede ser demasiado común.'
        self.fields['password2'].help_text = 'Ingresa la misma contraseña que antes, para verificación.'

    def clean_age(self):
        age = self.cleaned_data.get('age')
        if age is not None and age <= 0:
            raise forms.ValidationError("La edad debe ser un número positivo.")
        return age
    
    def send_admin_notification(self, user):
        subject = 'Nuevo Usuario Registrado - Psic. Susana Dávila'
        message = f"""
        Un nuevo usuario se ha registrado en la plataforma:
        
        Nombre: {user.name}
        Usuario: {user.username}
        Email: {user.email}
        Teléfono: {user.phone or 'No proporcionado'}
        Ciudad: {user.location or 'No proporcionada'}
        Edad: {user.age or 'No proporcionada'}
        Fecha de registro: {user.date_joined.strftime('%d/%m/%Y %H:%M')}
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [settings.ADMIN_EMAIL],
                fail_silently=False,
            )
            logger.info(f"New user notification email sent for user {user.username}")
            return True
        except Exception as e:
            logger.error(f"Error sending new user notification email: {str(e)}")
            return False

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.name = self.cleaned_data["name"]
        if commit:
            user.save()
            self.send_admin_notification(user)
        return user