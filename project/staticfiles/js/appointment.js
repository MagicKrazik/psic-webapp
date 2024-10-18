document.addEventListener('DOMContentLoaded', function() {
    const availabilitySelect = document.getElementById('availability-select');
    const bookAppointmentButton = document.getElementById('book-appointment');
    const appointmentConfirmation = document.getElementById('appointment-confirmation');
    const confirmedDate = document.getElementById('confirmed-date');
    const confirmedTime = document.getElementById('confirmed-time');
    const userAppointmentsList = document.getElementById('user-appointments-list');
    const loadingElement = document.getElementById('loading');

    function showLoading() {
        loadingElement.style.display = 'block';
    }

    function hideLoading() {
        loadingElement.style.display = 'none';
    }

    // Fetch availabilities and populate the select element
    function fetchAvailabilities() {
        showLoading();
        fetch('/get-availabilities/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                availabilitySelect.innerHTML = '<option value="">Seleccione un horario</option>';
                if (data.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = 'No hay horarios disponibles';
                    availabilitySelect.appendChild(option);
                } else {
                    data.forEach(availability => {
                        const option = document.createElement('option');
                        option.value = availability.id;
                        option.textContent = `${formatDate(availability.date)} ${availability.start_time} - ${availability.end_time}`;
                        availabilitySelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching availabilities:', error);
                availabilitySelect.innerHTML = '<option value="">Error al cargar horarios</option>';
            })
            .finally(() => {
                hideLoading();
            });
    }

    // Book appointment
    bookAppointmentButton.addEventListener('click', function() {
        const availabilityId = availabilitySelect.value;
        if (!availabilityId) {
            alert('Por favor, seleccione un horario disponible.');
            return;
        }

        showLoading();
        fetch('/book-appointment/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ availability_id: availabilityId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                confirmedDate.textContent = formatDate(data.date);
                confirmedTime.textContent = data.time;
                appointmentConfirmation.style.display = 'block';
                fetchAvailabilities();
                updateUserAppointments();
            } else {
                throw new Error(data.message || 'Error al reservar la cita');
            }
        })
        .catch(error => {
            console.error('Error booking appointment:', error);
            alert('Hubo un problema al reservar la cita. Por favor, inténtelo de nuevo más tarde.');
        })
        .finally(() => {
            hideLoading();
        });
    });

    // Update user appointments list
    function updateUserAppointments() {
        showLoading();
        fetch('/get-user-appointments/')
            .then(response => response.json())
            .then(data => {
                userAppointmentsList.innerHTML = '';
                data.forEach(appointment => {
                    const li = document.createElement('li');
                    li.textContent = `${appointment.date} ${appointment.time}`;
                    if (appointment.google_meet_link) {
                        const link = document.createElement('a');
                        link.href = appointment.google_meet_link;
                        link.textContent = 'Unirse a la videollamada';
                        link.target = '_blank';
                        link.className = 'meet-link';
                        li.appendChild(document.createTextNode(' - '));
                        li.appendChild(link);
                    } else {
                        const span = document.createElement('span');
                        span.textContent = 'Enlace pendiente';
                        span.className = 'pending';
                        li.appendChild(document.createTextNode(' - '));
                        li.appendChild(span);
                    }
                    userAppointmentsList.appendChild(li);
                });
                if (data.length === 0) {
                    userAppointmentsList.innerHTML = '<li>No tienes citas programadas.</li>';
                }
            })
            .catch(error => console.error('Error fetching user appointments:', error))
            .finally(() => {
                hideLoading();
            });
    }

    // Helper function to get CSRF token
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

    // Helper function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Initial fetch of availabilities and user appointments
    fetchAvailabilities();
    updateUserAppointments();
});