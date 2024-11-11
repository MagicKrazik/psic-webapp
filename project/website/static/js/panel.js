document.addEventListener('DOMContentLoaded', function() {
    // Initialize Flatpickr for date and time inputs
    flatpickr("#date, #startDate, #endDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "es"
    });

    flatpickr("#startTime, #recurringStartTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 60,
    });

    // Toggle functionality for availability list
    const toggleBtn = document.getElementById('toggleAvailabilities');
    const container = document.getElementById('availabilityListContainer');
    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', () => {
            container.classList.toggle('collapsed');
            const toggleIcon = toggleBtn.querySelector('.toggle-icon');
            const toggleText = toggleBtn.querySelector('.toggle-text');
            if (container.classList.contains('collapsed')) {
                toggleIcon.textContent = '▶';
                toggleText.textContent = 'Mostrar';
            } else {
                toggleIcon.textContent = '▼';
                toggleText.textContent = 'Ocultar';
            }
        });
    }

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

    // Initialize filters
    const monthFilter = document.getElementById('monthFilter');
    const weekdayFilter = document.getElementById('weekdayFilter');
    let currentAvailabilities = [];

    if (monthFilter && weekdayFilter) {
        monthFilter.addEventListener('change', filterAndDisplayAvailabilities);
        weekdayFilter.addEventListener('change', filterAndDisplayAvailabilities);
    }

    function filterAndDisplayAvailabilities() {
        const monthValue = monthFilter.value;
        const weekdayValue = weekdayFilter.value;
        
        let filteredAvailabilities = [...currentAvailabilities];
        
        if (monthValue) {
            filteredAvailabilities = filteredAvailabilities.filter(availability => {
                const date = new Date(availability.date);
                return (date.getMonth() + 1).toString() === monthValue;
            });
        }
        
        if (weekdayValue) {
            filteredAvailabilities = filteredAvailabilities.filter(availability => {
                const date = new Date(availability.date + 'T00:00:00');
                // Django's week_day goes from 1 (Sunday) to 7 (Saturday)
                // This matches our HTML select values now
                const djangoWeekDay = ((date.getDay() + 7) % 7) + 1;
                return djangoWeekDay.toString() === weekdayValue;
            });
        }
        
        displayAvailabilities(filteredAvailabilities);
    }

    // Fetch and display availabilities
    function fetchAvailabilities() {
        fetch('/get-availabilities/')
            .then(response => response.json())
            .then(data => {
                currentAvailabilities = data;
                filterAndDisplayAvailabilities();
            })
            .catch(error => {
                console.error('Error fetching availabilities:', error);
            });
    }

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

    function displayAvailabilities(availabilities) {
        const availabilityList = document.getElementById('availabilityList');
        if (!availabilityList) return;

        availabilityList.innerHTML = '';
        
        if (availabilities.length === 0) {
            availabilityList.innerHTML = '<div class="no-availabilities">No hay horarios disponibles para los filtros seleccionados.</div>';
            return;
        }

        // Add bulk delete button
        const bulkDeleteForm = document.createElement('form');
        bulkDeleteForm.id = 'bulkDeleteForm';
        bulkDeleteForm.className = 'bulk-delete-form';
        bulkDeleteForm.innerHTML = '<button type="submit" class="btn-secondary" id="bulkDeleteButton">Eliminar seleccionados</button>';
        availabilityList.appendChild(bulkDeleteForm);

        // Create availability cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'availability-grid';

        // Sort availabilities by date and time
        availabilities.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.start_time);
            const dateB = new Date(b.date + 'T' + b.start_time);
            return dateA - dateB;
        });

        availabilities.forEach(availability => {
            const date = new Date(availability.date + 'T00:00:00');
            const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
            const formattedDate = date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const card = document.createElement('div');
            card.className = 'availability-card';
            card.innerHTML = `
                <div class="availability-card-header">
                    <input type="checkbox" name="bulk_delete" value="${availability.id}">
                    <div class="availability-card-date">${dayName}</div>
                </div>
                <div class="availability-card-time">
                    ${formattedDate}<br>
                    ${availability.start_time} - ${availability.end_time}
                </div>
                <div class="availability-card-actions">
                    <button class="btn-secondary delete-availability" data-id="${availability.id}">
                        Eliminar
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        availabilityList.appendChild(cardsContainer);

        // Add event listeners for bulk delete
        document.getElementById('bulkDeleteForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const selectedIds = Array.from(document.querySelectorAll('input[name="bulk_delete"]:checked')).map(input => input.value);
            if (selectedIds.length > 0) {
                bulkDeleteAvailabilities(selectedIds);
            } else {
                alert('Por favor, seleccione al menos una disponibilidad para eliminar.');
            }
        });

        // Add event listeners for individual delete buttons
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

    function bulkDeleteAvailabilities(ids) {
        if (confirm(`¿Está seguro de que desea eliminar ${ids.length} disponibilidades?`)) {
            fetch('/bulk-delete-availabilities/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ ids: ids })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(`${data.deleted_count} disponibilidades eliminadas con éxito`);
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
                location.reload();
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
        const pricePerSession = 500;
        const totalEarnings = paidAppointments * pricePerSession;
        const totalEarningsElement = document.getElementById('totalEarnings');
        if (totalEarningsElement) {
            totalEarningsElement.textContent = totalEarnings.toLocaleString('es-MX');
        }
    }

    updateTotalEarnings();

    // Handle bulk delete appointments
    const bulkDeleteAppointmentsForm = document.getElementById('bulkDeleteAppointmentsForm');
    if (bulkDeleteAppointmentsForm) {
        bulkDeleteAppointmentsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const selectedIds = Array.from(document.querySelectorAll('input[name="bulk_delete_appointment"]:checked')).map(input => input.value);
            if (selectedIds.length > 0) {
                bulkDeleteAppointments(selectedIds);
            } else {
                alert('Por favor, seleccione al menos una cita para eliminar.');
            }
        });
    }

    function bulkDeleteAppointments(ids) {
        if (confirm(`¿Está seguro de que desea eliminar ${ids.length} citas?`)) {
            fetch('/bulk-delete-appointments/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ ids: ids })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(`${data.deleted_count} citas eliminadas con éxito`);
                    location.reload();
                } else {
                    alert(`Error: ${data.message}`);
                }
            });
        }
    }

    // Initialize on load
    fetchAvailabilities();

});