document.addEventListener('DOMContentLoaded', function() {
    const weekdaySelect = document.getElementById('weekday-select');
    const dateSelect = document.getElementById('date-select');
    const timeSelect = document.getElementById('time-select');
    const bookAppointmentButton = document.getElementById('book-appointment');
    const appointmentConfirmation = document.getElementById('appointment-confirmation');
    const confirmedDate = document.getElementById('confirmed-date');
    const confirmedTime = document.getElementById('confirmed-time');
    const userAppointmentsList = document.getElementById('user-appointments-list');
    const loadingElement = document.getElementById('loading');

    let availabilities = [];

    function showLoading() {
        loadingElement.style.display = 'block';
    }

    function hideLoading() {
        loadingElement.style.display = 'none';
    }

    // Fetch all availabilities
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
                availabilities = data;
                if (data.length === 0) {
                    weekdaySelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
                    dateSelect.innerHTML = '<option value="">No hay fechas disponibles</option>';
                    timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
                } else {
                    populateWeekdays(data);
                }
            })
            .catch(error => {
                console.error('Error fetching availabilities:', error);
                weekdaySelect.innerHTML = '<option value="">Error al cargar horarios</option>';
            })
            .finally(() => {
                hideLoading();
            });
    }

    // Populate weekday select
    function populateWeekdays(data) {
        const uniqueWeekdays = new Set();
        data.forEach(availability => {
            const date = new Date(availability.date + 'T00:00:00');
            // Convert to Django's week_day format (1-7, Sunday is 1)
            const weekDay = ((date.getDay() + 7) % 7) + 1;
            uniqueWeekdays.add(weekDay);
        });

        weekdaySelect.innerHTML = '<option value="">Seleccionar día</option>';
        const weekdayNames = {
            1: 'Domingo', 2: 'Lunes', 3: 'Martes', 4: 'Miércoles',
            5: 'Jueves', 6: 'Viernes', 7: 'Sábado'
        };

        [...uniqueWeekdays].sort().forEach(weekday => {
            const option = document.createElement('option');
            option.value = weekday;
            option.textContent = weekdayNames[weekday];
            weekdaySelect.appendChild(option);
        });
    }

    // Update dates based on selected weekday
    function updateDates(selectedWeekday) {
        dateSelect.innerHTML = '<option value="">Seleccionar fecha</option>';
        dateSelect.disabled = !selectedWeekday;
        timeSelect.innerHTML = '<option value="">Primero selecciona una fecha</option>';
        timeSelect.disabled = true;
        bookAppointmentButton.disabled = true;

        if (!selectedWeekday) return;

        const filteredDates = new Set();
        availabilities.forEach(availability => {
            const date = new Date(availability.date + 'T00:00:00');
            const weekDay = ((date.getDay() + 7) % 7) + 1;
            if (weekDay.toString() === selectedWeekday) {
                filteredDates.add(availability.date);
            }
        });

        [...filteredDates].sort().forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            const dateObj = new Date(date + 'T00:00:00');
            option.textContent = formatDateLong(dateObj);
            dateSelect.appendChild(option);
        });
    }

    // Update times based on selected date
    function updateTimes(selectedDate) {
        timeSelect.innerHTML = '<option value="">Seleccionar hora</option>';
        timeSelect.disabled = !selectedDate;
        bookAppointmentButton.disabled = true;

        if (!selectedDate) return;

        const filteredTimes = availabilities
            .filter(a => a.date === selectedDate)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

        filteredTimes.forEach(availability => {
            const option = document.createElement('option');
            option.value = availability.id;
            option.textContent = `${availability.start_time} - ${availability.end_time}`;
            timeSelect.appendChild(option);
        });
    }

    // Event Listeners
    weekdaySelect.addEventListener('change', function() {
        updateDates(this.value);
    });

    dateSelect.addEventListener('change', function() {
        updateTimes(this.value);
    });

    timeSelect.addEventListener('change', function() {
        bookAppointmentButton.disabled = !this.value;
    });

    // Book appointment
    bookAppointmentButton.addEventListener('click', function() {
        const availabilityId = timeSelect.value;
        if (!availabilityId) {
            alert('Por favor, complete la selección de horario.');
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
                const appointmentDate = new Date(year, month - 1, day);
                const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(appointmentDate);
                const formattedDate = appointmentDate.toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                confirmedDate.textContent = `${dayName}, ${formattedDate}`;
                confirmedTime.textContent = data.time;
                appointmentConfirmation.style.display = 'block';
                
                // Reset selections
                weekdaySelect.value = '';
                dateSelect.disabled = true;
                timeSelect.disabled = true;
                bookAppointmentButton.disabled = true;
                
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
        showLoading();
    
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
                    
                    const [day, month, year] = appointment.date.split('/');
                    const appointmentDate = new Date(year, month - 1, day);
                    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(appointmentDate);
                    const formattedDate = appointmentDate.toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
    
                    const dateTimeText = document.createTextNode(
                        `${dayName}, ${formattedDate} ${appointment.time}`
                    );
                    li.appendChild(dateTimeText);
                    li.appendChild(document.createTextNode(' - '));
    
                    if (appointment.google_meet_link) {
                        const meetLink = document.createElement('a');
                        meetLink.href = appointment.google_meet_link;
                        meetLink.textContent = 'Unirse a la videollamada';
                        meetLink.target = '_blank';
                        meetLink.className = 'meet-link';
                        li.appendChild(meetLink);
                        
                        li.appendChild(document.createTextNode(' | '));
                        const recomendacionesLink = document.createElement('a');
                        recomendacionesLink.href = '/recomendaciones/';
                        recomendacionesLink.textContent = 'Ver recomendaciones';
                        recomendacionesLink.className = 'recomendaciones-link';
                        li.appendChild(recomendacionesLink);
                    } else {
                        const recomendacionesLink = document.createElement('a');
                        recomendacionesLink.href = '/recomendaciones/';
                        recomendacionesLink.textContent = 'Ver recomendaciones';
                        recomendacionesLink.className = 'recomendaciones-link';
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
    function formatDateLong(date) {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Initial load
    fetchAvailabilities();
    updateUserAppointments();
});