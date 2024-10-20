from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from .forms import CustomUserCreationForm
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from django.utils import timezone
from datetime import timedelta, datetime
from django.core.exceptions import ValidationError
from .models import Availability, Appointment, CustomUser
from django.core.mail import send_mail
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
import socket
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
from io import BytesIO
from django.core.mail import EmailMessage






def is_staff_or_superuser(user):
    return user.is_staff or user.is_superuser


# Home view
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


# still working on the following views functions

@login_required
@user_passes_test(is_staff_or_superuser)
def admin_panel(request):
    availabilities = Availability.objects.filter(date__gte=timezone.now().date()).order_by('date', 'start_time')
    appointments = Appointment.objects.filter(availability__date__gte=timezone.now().date()).order_by('availability__date', 'availability__start_time')
    return render(request, 'panel.html', {'availabilities': availabilities, 'appointments': appointments})




@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def add_availability(request):
    data = json.loads(request.body)
    start_time = datetime.strptime(data['startTime'], '%H:%M')
    end_time = (start_time + timedelta(hours=1)).strftime('%H:%M')
    try:
        availability = Availability.objects.create(
            date=data['date'],
            start_time=data['startTime'],
            end_time=end_time
        )
        return JsonResponse({'status': 'success', 'id': availability.id})
    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': str(e)})




@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def edit_availability(request, availability_id):
    availability = get_object_or_404(Availability, id=availability_id)
    if availability.is_booked:
        return JsonResponse({'status': 'error', 'message': 'No se puede editar una disponibilidad reservada'})
    
    data = json.loads(request.body)
    start_time = datetime.strptime(data['startTime'], '%H:%M')
    end_time = (start_time + timedelta(hours=1)).strftime('%H:%M')
    try:
        availability.date = data['date']
        availability.start_time = data['startTime']
        availability.end_time = end_time
        availability.save()
        return JsonResponse({'status': 'success'})
    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': str(e)})




@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def delete_availability(request, availability_id):
    availability = get_object_or_404(Availability, id=availability_id)
    if not availability.is_booked:
        availability.delete()
        return JsonResponse({'status': 'success'})
    else:
        return JsonResponse({'status': 'error', 'message': 'No se puede eliminar una disponibilidad reservada'})



@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def add_recurring_availability(request):
    data = json.loads(request.body)
    start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
    end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
    days = data['days']  # List of days (0-6, where 0 is Monday)
    start_time = data['startTime']
    end_time = (datetime.strptime(start_time, '%H:%M') + timedelta(hours=1)).strftime('%H:%M')

    created_availabilities = []
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() in days:
            try:
                availability = Availability.objects.create(
                    date=current_date,
                    start_time=start_time,
                    end_time=end_time
                )
                created_availabilities.append(availability.id)
            except ValidationError:
                pass  # Skip if there's a validation error (e.g., overlapping availability)
        current_date += timedelta(days=1)

    return JsonResponse({'status': 'success', 'created_availabilities': created_availabilities})



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
    availabilities = Availability.objects.filter(is_booked=False, date__gte=timezone.now().date()).order_by('date', 'start_time')
    user_appointments = Appointment.objects.filter(user=request.user).order_by('availability__date', 'availability__start_time')
    return render(request, 'appointment.html', {'availabilities': availabilities, 'user_appointments': user_appointments})

@login_required
@require_http_methods(["POST"])
def book_appointment(request):
    data = json.loads(request.body)
    availability = get_object_or_404(Availability, id=data['availability_id'])
    
    if not availability.is_booked:
        try:
            appointment = Appointment.objects.create(
                user=request.user,
                availability=availability
            )
            availability.is_booked = True
            availability.save()

            # Attempt to send emails, but don't prevent booking if they fail
            try:
                email_sent = send_confirmation_email_to_user(appointment)
                if not email_sent:
                    print(f"Failed to send confirmation email for appointment {appointment.id}")
            except Exception as e:
                print(f"Error sending user confirmation email: {str(e)}")

            try:
                send_confirmation_email_to_admin(appointment)
            except Exception as e:
                print(f"Error sending admin notification email: {str(e)}")

            return JsonResponse({
                'status': 'success',
                'id': appointment.id,
                'date': appointment.availability.date.strftime('%Y-%m-%d'),
                'time': appointment.availability.start_time.strftime('%H:%M'),
                'username': request.user.username
            })
        except Exception as e:
            # If there's an error during the booking process, rollback the changes
            if 'appointment' in locals():
                appointment.delete()
            if availability.is_booked:
                availability.is_booked = False
                availability.save()
            return JsonResponse({'status': 'error', 'message': f'Error al reservar la cita: {str(e)}'}, status=500)
    else:
        return JsonResponse({'status': 'error', 'message': 'Esta disponibilidad ya ha sido reservada'})
    

@login_required
@user_passes_test(lambda u: u.is_staff)
def update_google_meet_link(request, appointment_id):
    appointment = get_object_or_404(Appointment, id=appointment_id)
    if request.method == 'POST':
        link = request.POST.get('google_meet_link')
        appointment.google_meet_link = link
        appointment.save()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})


@login_required
@require_http_methods(["GET"])
def get_availabilities(request):
    try:
        availabilities = Availability.objects.filter(
            date__gte=timezone.now().date(),
            is_booked=False
        ).order_by('date', 'start_time')
        data = list(availabilities.values('id', 'date', 'start_time', 'end_time'))
        return JsonResponse(data, safe=False, encoder=DjangoJSONEncoder)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Send Confirmation emails to user and admin

def generate_pdf(context):
    template = get_template('recomendaciones_pdf.html')
    html = template.render(context)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        return result.getvalue()
    return None



def send_confirmation_email_to_user(appointment):
    subject = 'Confirmación de Cita'
    context = {
        'username': appointment.user.username,
        'date': appointment.availability.date,
        'time': appointment.availability.start_time.strftime('%H:%M')
    }

    
    message = f"""
    Estimado/a {appointment.user.username},

    Su cita ha sido confirmada para el {appointment.availability.date} a las {appointment.availability.start_time.strftime('%H:%M')}.

    Adjunto encontrará un PDF con recomendaciones importantes para su sesión.

    Gracias por agendar una cita con Psic. Susana Dávila.

    Saludos cordiales,
    
    Equipo de Psic. Susana Dávila
    """
    
    try:
        pdf_content = generate_pdf(context)
        if pdf_content:
            email = EmailMessage(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [appointment.user.email]
            )
            email.attach('recomendaciones.pdf', pdf_content, 'application/pdf')
            email.send(fail_silently=False)
            return True
        else:
            raise Exception("Failed to generate PDF")
    except socket.error as e:
        print(f"Socket error when sending email: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error when sending email: {str(e)}")
        return False


def send_confirmation_email_to_admin(appointment):
    admin_email = CustomUser.objects.filter(is_staff=True).first().email
    subject = 'Nueva Cita Agendada'

    message = f"""
    Se ha agendado una nueva cita:

    Usuario: {appointment.user.username}
    Fecha: {appointment.availability.date}
    Hora: {appointment.availability.start_time}

    Por favor, actualice el enlace de Google Meet para esta cita.

    Saludos cordiales,
    
    """
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [admin_email])
    except Exception as e:
        print(f"Failed to send admin confirmation email: {str(e)}")



# NO borrar
@login_required
def get_user_appointments(request):
    appointments = Appointment.objects.filter(user=request.user).order_by('availability__date', 'availability__start_time')
    data = [{
        'date': appointment.availability.date.strftime('%d/%m/%Y'),
        'time': appointment.availability.start_time.strftime('%H:%M'),
        'google_meet_link': appointment.google_meet_link
    } for appointment in appointments]
    return JsonResponse(data, safe=False)



## para la confirmacion de citas, son dos views distintos get_user_appointment != get_user_appointments

@login_required
def recomendaciones(request):
    return render(request, 'recomendaciones.html')


# NO borrar
@login_required
def get_user_appointment(request):
    try:
        appointment = Appointment.objects.filter(user=request.user).latest('created_at')
        data = {
            'status': 'success',
            'username': request.user.username,
            'date': appointment.availability.date.strftime('%d/%m/%Y'),
            'time': appointment.availability.start_time.strftime('%H:%M')
        }
    except Appointment.DoesNotExist:
        data = {'status': 'error', 'message': 'No se encontró cita'}
    return JsonResponse(data)



### download pdf recommendations report, the report should also be sent by email to the user as confirmation


@login_required
def recomendaciones(request):
    return render(request, 'recomendaciones.html')


@login_required
def download_recomendaciones_pdf(request):
    try:
        appointment = Appointment.objects.filter(user=request.user).latest('created_at')
        context = {
            'username': request.user.username,
            'date': appointment.availability.date,
            'time': appointment.availability.start_time.strftime('%H:%M')
        }
    except Appointment.DoesNotExist:
        context = {
            'username': request.user.username,
            'date': None,
            'time': None
        }

    pdf_content = generate_pdf(context)
    if pdf_content:
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="Recomendaciones_Psic_Susana_Davila.pdf"'
        return response
    return HttpResponse('Error generating PDF', status=500)
