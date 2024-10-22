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
                        const date = new Date(availability.date + 'T00:00:00');  // Create date object in local timezone
                        const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
                        const formattedDate = formatDate(date);
                        option.textContent = `${dayName}, ${formattedDate} ${availability.start_time} - ${availability.end_time}`;
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
    
    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
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
                const [day, month, year] = data.date.split('/');
                const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
                const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(appointmentDate);
                const formattedDate = appointmentDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                
                confirmedDate.textContent = `${dayName}, ${formattedDate}`;
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
        const userAppointmentsList = document.getElementById('user-appointments-list');
        
        // Show loading state
        showLoading();
    
        // Fetch appointments
        fetch('/get-user-appointments/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar las citas');
                }
                return response.json();
            })
            .then(data => {
                userAppointmentsList.innerHTML = '';
                
                if (data.length === 0) {
                    userAppointmentsList.innerHTML = '<li>No tienes citas programadas.</li>';
                    return;
                }
    
                data.forEach(appointment => {
                    const li = document.createElement('li');
                    
                    // Format date
                    const [day, month, year] = appointment.date.split('/');
                    const appointmentDate = new Date(year, month - 1, day);
                    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(appointmentDate);
                    const formattedDate = appointmentDate.toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
    
                    // Create date and time text
                    const dateTimeText = document.createTextNode(
                        `${dayName}, ${formattedDate} ${appointment.time}`
                    );
                    li.appendChild(dateTimeText);
                    
                    // Add separator
                    li.appendChild(document.createTextNode(' - '));
    
                    // Add appropriate link
                    if (appointment.google_meet_link) {
                        // Video call link
                        const meetLink = document.createElement('a');
                        meetLink.href = appointment.google_meet_link;
                        meetLink.textContent = 'Unirse a la videollamada';
                        meetLink.target = '_blank';
                        meetLink.className = 'meet-link';
                        meetLink.setAttribute('aria-label', 'Unirse a la videollamada de Google Meet');
                        li.appendChild(meetLink);
                        
                        // Add recommendations link after meet link
                        li.appendChild(document.createTextNode(' | '));
                        const recomendacionesLink = document.createElement('a');
                        recomendacionesLink.href = '/recomendaciones/';
                        recomendacionesLink.textContent = 'Ver recomendaciones';
                        recomendacionesLink.className = 'recomendaciones-link';
                        recomendacionesLink.setAttribute('aria-label', 'Ver recomendaciones para la sesión');
                        li.appendChild(recomendacionesLink);
                    } else {
                        // Only recommendations link when no meet link is available
                        const recomendacionesLink = document.createElement('a');
                        recomendacionesLink.href = '/recomendaciones/';
                        recomendacionesLink.textContent = 'Ver recomendaciones para la sesión';
                        recomendacionesLink.className = 'recomendaciones-link';
                        recomendacionesLink.setAttribute('aria-label', 'Ver recomendaciones para la sesión');
                        li.appendChild(recomendacionesLink);
                    }
    
                    userAppointmentsList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error fetching user appointments:', error);
                userAppointmentsList.innerHTML = `
                    <li class="error-message">
                        No se pudieron cargar las citas. Por favor, intente nuevamente.
                        <button onclick="updateUserAppointments()" class="retry-button">
                            Reintentar
                        </button>
                    </li>
                `;
            })
            .finally(() => {
                hideLoading();
            });
    }
    
    // Helper functions for loading state
    function showLoading() {
        const userAppointmentsList = document.getElementById('user-appointments-list');
        userAppointmentsList.classList.add('loading');
        userAppointmentsList.innerHTML = `
            <li class="loading-message">
                <div class="spinner"></div>
                <span>Cargando sus citas...</span>
            </li>
        `;
    }
    
    function hideLoading() {
        const userAppointmentsList = document.getElementById('user-appointments-list');
        userAppointmentsList.classList.remove('loading');
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