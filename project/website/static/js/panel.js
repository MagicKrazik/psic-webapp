document.addEventListener('DOMContentLoaded', function() {
    // Initialize Flatpickr for date and time inputs
    flatpickr("#date, #startDate, #endDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
    });

    flatpickr("#startTime, #recurringStartTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 60,
    });

    // Handle form submission for adding individual availability
    const availabilityForm = document.getElementById('availabilityForm');
    availabilityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        
        addAvailability(date, startTime);
    });

    // Handle form submission for adding recurring availability
    const recurringAvailabilityForm = document.getElementById('recurringAvailabilityForm');
    recurringAvailabilityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const days = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(input => parseInt(input.value));
        const startTime = document.getElementById('recurringStartTime').value;
        
        addRecurringAvailability(startDate, endDate, days, startTime);
    });

    // Fetch and display availabilities
    fetchAvailabilities();

    function addAvailability(date, startTime) {
        fetch('/add-availability/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ date, startTime })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Disponibilidad agregada con éxito');
                availabilityForm.reset();
                fetchAvailabilities();
            } else {
                alert(`Error: ${data.message}`);
            }
        });
    }

    function addRecurringAvailability(startDate, endDate, days, startTime) {
        fetch('/add-recurring-availability/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ startDate, endDate, days, startTime })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(`Se agregaron ${data.created_availabilities.length} disponibilidades recurrentes`);
                recurringAvailabilityForm.reset();
                fetchAvailabilities();
            } else {
                alert(`Error: ${data.message}`);
            }
        });
    }

    function fetchAvailabilities() {
        fetch('/get-availabilities/')
            .then(response => response.json())
            .then(data => {
                displayAvailabilities(data);
            })
            .catch(error => {
                console.error('Error fetching availabilities:', error);
            });
    }

    function displayAvailabilities(availabilities) {
        const availabilityList = document.getElementById('availabilityList');
        availabilityList.innerHTML = '';
        if (availabilities.length === 0) {
            availabilityList.innerHTML = '<li>No hay horarios disponibles registrados.</li>';
        } else {
            availabilities.forEach(availability => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${availability.date} ${availability.start_time} - ${availability.end_time}
                    <button class="btn-secondary delete-availability" data-id="${availability.id}">Eliminar</button>
                `;
                availabilityList.appendChild(li);
            });
        }

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-availability').forEach(button => {
            button.addEventListener('click', function() {
                deleteAvailability(this.dataset.id);
            });
        });
    }

    function deleteAvailability(availabilityId) {
        if (confirm('¿Está seguro de que desea eliminar esta disponibilidad?')) {
            fetch(`/delete-availability/${availabilityId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Disponibilidad eliminada con éxito');
                    fetchAvailabilities();
                } else {
                    alert(`Error: ${data.message}`);
                }
            });
        }
    }

    // Handle recording payments
    const appointmentsList = document.getElementById('appointmentsList');
    if (appointmentsList) {
        appointmentsList.addEventListener('click', function(e) {
            if (e.target.classList.contains('record-payment')) {
                const appointmentId = e.target.getAttribute('data-id');
                recordPayment(appointmentId);
            }
        });
    }

    function recordPayment(appointmentId) {
        fetch(`/record-payment/${appointmentId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Pago registrado con éxito');
                location.reload(); // Refresh the page to update the UI
            } else {
                alert(`Error: ${data.message}`);
            }
        });
    }

    // Handle updating Google Meet links
    if (appointmentsList) {
        appointmentsList.addEventListener('submit', function(e) {
            if (e.target.classList.contains('google-meet-form')) {
                e.preventDefault();
                const form = e.target;
                const appointmentId = form.dataset.id;
                const googleMeetLink = form.elements.google_meet_link.value;
                updateGoogleMeetLink(appointmentId, googleMeetLink);
            }
        });
    }

    function updateGoogleMeetLink(appointmentId, googleMeetLink) {
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
            } else {
                alert(`Error: ${data.message}`);
            }
        });
    }

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

    // Calculate and display total earnings
    function updateTotalEarnings() {
        const paidAppointments = document.querySelectorAll('.paid').length;
        const totalEarnings = paidAppointments * 400; // Assuming 400 pesos per session
        document.getElementById('totalEarnings').textContent = totalEarnings;
    }

    updateTotalEarnings();

    // Generate report functionality
    const generateReportButton = document.getElementById('generateReport');
    if (generateReportButton) {
        generateReportButton.addEventListener('click', function() {
            // This is a placeholder for report generation functionality
            alert('Funcionalidad de generación de reportes aún no implementada.');
        });
    }
});