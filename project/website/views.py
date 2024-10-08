from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import CustomUserCreationForm
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from .models import Availability, Appointment
from django.views.decorators.http import require_http_methods
import json



def is_staff_or_superuser(user):
    return user.is_staff or user.is_superuser

# Create your views here.
def home(request):
    return render(request, 'home.html')

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
    else:
        form = CustomUserCreationForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')  # Redirect to home page after successful login
        else:
            messages.error(request, 'Usuario o contraseña inválidos')
    return render(request, 'login.html')


@login_required
def logout_view(request):
    logout(request)
    messages.success(request, 'Has cerrado sesión exitosamente')
    return redirect('home')  # Redirect to the home page after logout
    
@login_required
def about_me(request):
    return render(request, 'aboutme.html')

@login_required
def services(request):
    return render(request, 'services.html')


@login_required
def contact(request):
    return render(request, 'contact.html')


def custom_permission_denied_view(request, exception):
    return render(request, '403.html', status=403)

@login_required
@user_passes_test(is_staff_or_superuser)
def admin_panel(request):
    appointments = Appointment.objects.all().order_by('-created_at')
    return render(request, 'panel.html', {'appointments': appointments})


@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def add_availability(request):
    data = json.loads(request.body)
    availability = Availability.objects.create(
        date=data['date'],
        start_time=data['startTime'],
        end_time=data['endTime']
    )
    return JsonResponse({'status': 'success', 'id': availability.id})


@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def record_payment(request, appointment_id):
    appointment = Appointment.objects.get(id=appointment_id)
    appointment.is_paid = True
    appointment.save()
    return JsonResponse({'status': 'success'})


@login_required
def appointment(request):
    availabilities = Availability.objects.filter(is_booked=False).order_by('date', 'start_time')
    return render(request, 'appointment.html', {'availabilities': availabilities})

@login_required
@require_http_methods(["POST"])
def book_appointment(request):
    data = json.loads(request.body)
    availability = Availability.objects.get(id=data['availability_id'])
    appointment = Appointment.objects.create(
        user=request.user,
        availability=availability
    )
    availability.is_booked = True
    availability.save()
    return JsonResponse({'status': 'success', 'id': appointment.id})

def get_availabilities(request):
    availabilities = Availability.objects.filter(is_booked=False).order_by('date', 'start_time')
    data = list(availabilities.values('id', 'date', 'start_time', 'end_time'))
    return JsonResponse(data, safe=False)