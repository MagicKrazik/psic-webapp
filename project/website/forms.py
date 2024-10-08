from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, label="Correo electrónico")
    age = forms.IntegerField(validators=[MinValueValidator(1)], label="Edad")
    
    class Meta:
        model = CustomUser
        fields = ("username", "email", "phone", "age", "location", "password1", "password2")
        labels = {
            'username': _('Usuario'),
            'phone': _('Teléfono'),
            'age': _('Edad'),
            'location': _('Ubicación'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].label = 'Contraseña'
        self.fields['password2'].label = 'Confirmar contraseña'
        self.fields['password1'].help_text = 'Tu contraseña debe tener al menos 8 caracteres y no puede ser demasiado común.'
        self.fields['password2'].help_text = 'Ingresa la misma contraseña que antes, para verificación.'

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user