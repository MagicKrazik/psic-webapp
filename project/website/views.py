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
from django.utils.translation import gettext as _
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db.models import Sum
from django.utils import translation
import logging
from smtplib import SMTPException

# password reset views:
from django.contrib.auth.views import PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView
from django.urls import reverse_lazy


logger = logging.getLogger(__name__)

def is_staff_or_superuser(user):
    return user.is_staff or user.is_superuser


# Home view
def home(request):
    return render(request, 'home.html')

# Home view
def avisopriv(request):
    return render(request, 'aviso_priv.html')

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

            user_email_sent = send_confirmation_email_to_user(appointment)
            admin_email_sent = send_confirmation_email_to_admin(appointment)

            email_status = []
            if not user_email_sent:
                email_status.append("Usuario")
            if not admin_email_sent:
                email_status.append("Administrador")

            response_data = {
                'status': 'success',
                'id': appointment.id,
                'date': appointment.availability.date.strftime('%d/%m/%Y'),
                'time': appointment.availability.start_time.strftime('%H:%M'),
                'username': request.user.username
            }

            if email_status:
                response_data['email_warning'] = f"No se pudo enviar el correo de confirmación a: {', '.join(email_status)}"

            return JsonResponse(response_data)
        except Exception as e:
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
        # Get current time and add 24 hours
        min_datetime = timezone.now() + timedelta(hours=24)
        
        # Get available slots
        availabilities = Availability.objects.filter(
            is_booked=False
        ).order_by('date', 'start_time')
        
        data = []
        for availability in availabilities:
            # Combine date and start_time to create a datetime object for comparison
            appointment_datetime = timezone.make_aware(
                datetime.combine(availability.date, availability.start_time)
            )
            
            # Only include appointments that are more than 24 hours in advance
            if appointment_datetime >= min_datetime:
                data.append({
                    'id': availability.id,
                    'date': availability.date.strftime('%Y-%m-%d'),
                    'start_time': availability.start_time.strftime('%H:%M'),
                    'end_time': availability.end_time.strftime('%H:%M'),
                })
        
        return JsonResponse(data, safe=False)
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
    with translation.override('es'):
        day_name = _(appointment.availability.date.strftime('%A'))
    message = f"""
    Estimado/a {appointment.user.username},

    Su cita ha sido confirmada para el {day_name}, {appointment.availability.date.strftime('%d/%m/%Y')} a las {appointment.availability.start_time.strftime('%H:%M')}.

    Para confirmar su cita, puede realizar el pago mediante cualquiera de estas opciones:

    📱 Transferencia bancaria

    Banco: BBVA
    Clave Interbancaria: 012 180 015 021 800 548
    Beneficiario: Susana Dávila 
    Incluir como referencia: [Usuario o Nombre del cliente]

    💰 Depósito en ventanilla

    Puede realizar su depósito en cualquier sucursal bancaria
    Clave Interbancaria: 012 180 015 021 800 548
    Beneficiario: Susana Dávila 
    Es indispensable incluir como referencia: [Usuario o Nombre del cliente]

    ⚠️ Importante: Para garantizar el registro correcto de su pago, es esencial incluir su nombre como referencia en cualquier método de pago que elija.
    Una vez realizado el pago, por favor envíe su comprobante a psic.susidm@gmail.com o al whatsapp (+55) 624 243 3110 para confirmar su cita.

    Gracias por agendar una cita con Psic. Susana Dávila.

    Saludos cordiales,
    
    Psic. Susana Dávila
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [appointment.user.email],
            fail_silently=False,
        )
        logger.info(f"Confirmation email sent to user {appointment.user.email}")
        return True
    except SMTPException as e:
        logger.error(f"SMTP error sending email to user {appointment.user.email}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error sending email to user {appointment.user.email}: {str(e)}")
    return False

def send_confirmation_email_to_admin(appointment):
    admin_email = CustomUser.objects.filter(is_staff=True).first().email
    subject = 'Nueva Cita Agendada'
    with translation.override('es'):
        day_name = _(appointment.availability.date.strftime('%A'))

    message = f"""
    Se ha agendado una nueva cita:

    Usuario: {appointment.user.username}
    Nombre: {appointment.user.name}
    Fecha: {day_name}, {appointment.availability.date.strftime('%d/%m/%Y')}
    Hora: {appointment.availability.start_time.strftime('%H:%M')}

    Por favor, actualice el enlace de Google Meet para esta cita.

    Saludos cordiales,
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [admin_email],
            fail_silently=False,
        )
        logger.info(f"Confirmation email sent to admin {admin_email}")
        return True
    except SMTPException as e:
        logger.error(f"SMTP error sending email to admin {admin_email}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error sending email to admin {admin_email}: {str(e)}")
    return False



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


### Bulk delete view for the admin panel, to delete multiple appointment dates

@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def bulk_delete_availabilities(request):
    try:
        data = json.loads(request.body)
        ids = data.get('ids', [])
        deleted_count = Availability.objects.filter(id__in=ids, is_booked=False).delete()[0]
        return JsonResponse({'status': 'success', 'deleted_count': deleted_count})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    


### Bulk delete appointmens views

@login_required
@user_passes_test(is_staff_or_superuser)
@require_http_methods(["POST"])
def bulk_delete_appointments(request):
    try:
        data = json.loads(request.body)
        ids = data.get('ids', [])
        deleted_count = Appointment.objects.filter(id__in=ids).delete()[0]
        return JsonResponse({'status': 'success', 'deleted_count': deleted_count})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    

### Revenue report views:

@login_required
@user_passes_test(is_staff_or_superuser)
def generate_revenue_report(request):
    appointments = Appointment.objects.filter(is_paid=True).order_by('-availability__date')
    total_revenue = appointments.aggregate(Sum('availability__price'))['availability__price__sum'] or 0

    appointments_data = [
        {
            'user': appointment.user.username,
            'date': appointment.availability.date.strftime('%d/%m/%Y'),
            'time': appointment.availability.start_time.strftime('%H:%M'),
            'price': float(appointment.availability.price)
        } for appointment in appointments
    ]

    context = {
        'appointments': appointments_data,
        'total_revenue': float(total_revenue),
        'generated_at': timezone.now().strftime('%d/%m/%Y')  # Only include the date
    }

    return JsonResponse({'status': 'success', 'data': context})

@login_required
@user_passes_test(is_staff_or_superuser)
def download_revenue_report(request):
    html_string = request.GET.get('html', '')
    
    response = HttpResponse(content_type='text/html')
    response['Content-Disposition'] = 'attachment; filename="revenue_report.html"'
    response.write(html_string)
    
    return response    


### Contact email:

@require_http_methods(["POST"])
def send_contact_email(request):
    try:
        data = json.loads(request.body)
        name = data['name']
        email = data['email']
        subject = data['subject']
        message = data['message']

        # Compose email
        email_subject = f"Nuevo mensaje de contacto: {subject}"
        email_message = f"Nombre: {name}\nEmail: {email}\n\nMensaje:\n{message}"

        # Send email
        send_mail(
            email_subject,
            email_message,
            settings.DEFAULT_FROM_EMAIL,
            [settings.ADMIN_EMAIL],  # Make sure to set ADMIN_EMAIL in your settings.py
            fail_silently=False,
        )

        return JsonResponse({'status': 'success'})
    except Exception as e:
        print(f"Error sending contact email: {str(e)}")
        return JsonResponse({'status': 'error'}, status=500)
    

### password reset views:

class CustomPasswordResetView(PasswordResetView):
    template_name = 'password_reset_form.html'
    email_template_name = 'password_reset_email.html'
    subject_template_name = 'password_reset_subject.txt'
    success_url = reverse_lazy('password_reset_done')

class CustomPasswordResetDoneView(PasswordResetDoneView):
    template_name = 'password_reset_done.html'

class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = 'password_reset_confirm.html'
    success_url = reverse_lazy('password_reset_complete')

class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    template_name = 'password_reset_complete.html'    

### ready for production    