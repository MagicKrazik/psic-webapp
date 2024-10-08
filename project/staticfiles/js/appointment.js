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
        events: fetchAvailabilities()
    });
    calendar.render();

    function fetchAvailabilities() {
        return fetch('/get-availabilities/')
            .then(response => response.json())
            .then(data => {
                return data.map(availability => ({
                    title: 'Disponible',
                    start: `${availability.date}T${availability.start_time}`,
                    end: `${availability.date}T${availability.end_time}`,
                    color: 'green'
                }));
            });
    }

    const bookingForm = document.getElementById('booking-form');
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
            }
        });
    });

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