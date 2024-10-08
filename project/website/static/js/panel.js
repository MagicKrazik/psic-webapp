document.addEventListener('DOMContentLoaded', function() {
    // Initialize Flatpickr for date and time inputs
    flatpickr("#date", {
        dateFormat: "Y-m-d",
        minDate: "today",
    });

    flatpickr("#startTime, #endTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
    });

    // Initialize FullCalendar
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: fetchAvailabilities,
        eventClick: function(info) {
            if (confirm('¿Desea eliminar esta disponibilidad?')) {
                deleteAvailability(info.event.id);
            }
        }
    });
    calendar.render();

    // Handle form submission for adding availability
    const availabilityForm = document.getElementById('availabilityForm');
    availabilityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        fetch('/add-availability/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ date, startTime, endTime })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Disponibilidad agregada con éxito');
                availabilityForm.reset();
                calendar.refetchEvents();
            }
        });
    });

    // Function to fetch availabilities
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
            })
            .catch(error => {
                failureCallback(error);
            });
    }

    // Function to delete availability
    function deleteAvailability(availabilityId) {
        fetch(`/delete-availability/${availabilityId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                calendar.refetchEvents();
            } else {
                alert(data.message);
            }
        });
    }

    // Handle recording payments
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('record-payment')) {
            const appointmentId = e.target.getAttribute('data-id');
            fetch(`/record-payment/${appointmentId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    e.target.textContent = 'Pagado';
                    e.target.disabled = true;
                    updateTotalEarnings();
                }
            });
        }
    });

    // Handle updating Google Meet links
    appointmentsList.addEventListener('submit', function(e) {
        if (e.target.classList.contains('google-meet-form')) {
            e.preventDefault();
            const form = e.target;
            const appointmentId = form.dataset.id;
            const googleMeetLink = form.elements.google_meet_link.value;

            fetch(`/update-google-meet-link/${appointmentId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: `google_meet_link=${encodeURIComponent(googleMeetLink)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Enlace de Google Meet actualizado con éxito');
                }
            });
        }
    });

    function updateTotalEarnings() {
        const totalEarnings = document.getElementById('totalEarnings');
        const paidAppointments = document.querySelectorAll('.record-payment[disabled]').length;
        totalEarnings.textContent = paidAppointments * 400; // Assuming 400 pesos per session
    }

    updateTotalEarnings();

    // Function to get CSRF token
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