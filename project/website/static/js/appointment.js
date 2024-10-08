document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        locale: 'es',
        events: fetchAvailabilities,
        eventClick: function(info) {
            document.getElementById('availability').value = info.event.id;
        }
    });
    calendar.render();

    function fetchAvailabilities(fetchInfo, successCallback, failureCallback) {
        fetch('/get-availabilities/')
            .then(response => response.json())
            .then(data => {
                const events = data.map(availability => ({
                    id: availability.id,
                    title: 'Disponible',
                    start: `${availability.date}T${availability.start_time}`,
                    end: `${availability.date}T${availability.end_time}`,
                    color: 'green'
                }));
                successCallback(events);
                updateAvailabilityOptions(data);
            })
            .catch(error => {
                failureCallback(error);
            });
    }

    function updateAvailabilityOptions(availabilities) {
        const select = document.getElementById('availability');
        select.innerHTML = '<option value="">Seleccione un horario</option>';
        availabilities.forEach(availability => {
            const option = document.createElement('option');
            option.value = availability.id;
            option.textContent = `${availability.date} ${availability.start_time} - ${availability.end_time}`;
            select.appendChild(option);
        });
    }

    const bookingForm = document.getElementById('booking-form');
    const appointmentDetails = document.getElementById('appointment-details');

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const availabilityId = document.getElementById('availability').value;
        
        fetch('/book-appointment/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ availability_id: availabilityId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Cita agendada con éxito');
                calendar.refetchEvents();
                bookingForm.reset();
                showAppointmentDetails(data);
            } else {
                alert(data.message);
            }
        });
    });

    function showAppointmentDetails(data) {
        document.getElementById('appointment-date').textContent = data.date;
        document.getElementById('appointment-time').textContent = data.time;
        document.getElementById('appointment-username').textContent = data.username;
        document.getElementById('google-meet-link').textContent = 'Pendiente';
        document.getElementById('google-meet-link').href = '#';
        appointmentDetails.style.display = 'block';
        bookingForm.style.display = 'none';
    }

    // Update Google Meet links for existing appointments
    function updateGoogleMeetLinks() {
        const links = document.querySelectorAll('.google-meet-link');
        links.forEach(link => {
            if (link.textContent === 'Pendiente') {
                const appointmentId = link.dataset.appointmentId;
                fetch(`/get-google-meet-link/${appointmentId}/`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.google_meet_link) {
                            link.textContent = 'Unirse a la videollamada';
                            link.href = data.google_meet_link;
                        }
                    });
            }
        });
    }

    // Call this function periodically to update links
    setInterval(updateGoogleMeetLinks, 60000); // Check every minute

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});