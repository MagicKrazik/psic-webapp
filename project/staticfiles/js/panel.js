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
            const bulkDeleteForm = document.createElement('form');
            bulkDeleteForm.id = 'bulkDeleteForm';
            bulkDeleteForm.innerHTML = '<button type="submit" class="btn-secondary" id="bulkDeleteButton">Eliminar seleccionados</button>';
            availabilityList.appendChild(bulkDeleteForm);

            availabilities.forEach(availability => {
                const li = document.createElement('li');
                const date = new Date(availability.date + 'T00:00:00');
                const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
                const formattedDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                li.innerHTML = `
                    <input type="checkbox" name="bulk_delete" value="${availability.id}">
                    ${dayName}, ${formattedDate} ${availability.start_time} - ${availability.end_time}
                    <button class="btn-secondary delete-availability" data-id="${availability.id}">Eliminar</button>
                `;
                availabilityList.appendChild(li);
            });

            // Add event listener for bulk delete
            document.getElementById('bulkDeleteForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const selectedIds = Array.from(document.querySelectorAll('input[name="bulk_delete"]:checked')).map(input => input.value);
                if (selectedIds.length > 0) {
                    bulkDeleteAvailabilities(selectedIds);
                } else {
                    alert('Por favor, seleccione al menos una disponibilidad para eliminar.');
                }
            });
        }

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
        const pricePerSession = 500; // Updated from 400 to 500
        const totalEarnings = paidAppointments * pricePerSession;
        document.getElementById('totalEarnings').textContent = totalEarnings;
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
                    location.reload(); // Refresh the page to update the UI
                } else {
                    alert(`Error: ${data.message}`);
                }
            });
        }
    }

    // Generate revenue report functionality
    const generateReportButton = document.getElementById('generateReport');
    if (generateReportButton) {
        generateReportButton.addEventListener('click', function() {
            generateRevenueReport();
        });
    }

    function generateRevenueReport() {
        fetch('/generate-revenue-report/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const reportWindow = window.open('', '_blank');
                reportWindow.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reporte de Ingresos - Psic. Susana Dávila</title>
                        <style>
                            :root {
                                --primary-color: #2A044A;
                                --secondary-color: #FF69B4;
                                --text-color: #333333;
                                --background-color: #D3D3D3;
                                --section-bg-color: #F5F5F5;
                                --accent-color: #9A0372;
                            }
                            body { 
                                font-family: 'Arial', sans-serif; 
                                line-height: 1.6; 
                                color: var(--text-color); 
                                background-color: var(--background-color);
                                margin: 0;
                                padding: 0;
                            }
                            .container { 
                                max-width: 1000px; 
                                margin: 0 auto; 
                                padding: 20px;
                                background-color: white;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }
                            header {
                                background-color: var(--primary-color);
                                color: white;
                                padding: 20px;
                                text-align: center;
                            }
                            h1 { 
                                margin: 0;
                                font-size: 28px;
                            }
                            .subheader {
                                font-size: 18px;
                                margin-top: 10px;
                            }
                            .summary { 
                                background-color: var(--secondary-color);
                                color: white;
                                padding: 20px;
                                border-radius: 5px;
                                margin: 20px 0;
                                display: flex;
                                justify-content: space-between;
                            }
                            .summary-item {
                                text-align: center;
                            }
                            .summary-value {
                                font-size: 24px;
                                font-weight: bold;
                            }
                            table { 
                                width: 100%; 
                                border-collapse: collapse; 
                                margin-top: 20px;
                                background-color: white;
                            }
                            th, td { 
                                border: 1px solid #ddd; 
                                padding: 12px; 
                                text-align: left; 
                            }
                            th { 
                                background-color: var(--primary-color); 
                                color: white; 
                            }
                            tr:nth-child(even) { 
                                background-color: #f2f2f2; 
                            }
                            .btn { 
                                display: inline-block; 
                                padding: 10px 20px; 
                                background-color: var(--accent-color); 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 5px;
                                border: none;
                                cursor: pointer;
                                font-size: 16px;
                                transition: background-color 0.3s ease;
                            }
                            .btn:hover {
                                background-color: #e8591d;
                            }
                            footer {
                                margin-top: 20px;
                                text-align: center;
                                color: #666;
                                font-size: 14px;
                            }
                            @media print {
                                body {
                                    background-color: white;
                                }
                                .container {
                                    box-shadow: none;
                                }
                                .btn { 
                                    display: none; 
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <header>
                                <h1>Reporte de Ingresos</h1>
                                <div class="subheader">Psic. Susana Dávila</div>
                            </header>
                            
                            <div class="summary">
                                <div class="summary-item">
                                    <div>Total de Ingresos</div>
                                    <div class="summary-value">$${(data.data.total_revenue).toFixed(2)}</div>
                                </div>
                                <div class="summary-item">
                                    <div>Total de Citas</div>
                                    <div class="summary-value">${data.data.appointments.length}</div>
                                </div>
                            </div>
    
                            <table>
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th>Hora</th>
                                        <th>Ingreso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.data.appointments.map(appointment => `
                                        <tr>
                                            <td>${appointment.user}</td>
                                            <td>${appointment.date}</td>
                                            <td>${appointment.time}</td>
                                            <td>$${appointment.price.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
    
                            <footer>
                                <p>Generado el: ${data.data.generated_at.split(' ')[0]}</p>
                            </footer>
    
                            <br>
                            <button class="btn" onclick="window.print()">Descargar como PDF</button>
                        </div>
                        <script>
                            document.querySelector('.btn').addEventListener('click', function(e) {
                                e.preventDefault();
                                window.print();
                            });
                        </script>
                    </body>
                    </html>
                `);
                reportWindow.document.close();
            } else {
                alert('Error al generar el reporte. Por favor, inténtelo de nuevo.');
            }
        })
        .catch(error => {
            console.error('Error generating report:', error);
            alert('Hubo un problema al generar el reporte. Por favor, inténtelo de nuevo más tarde.');
        });
    }
});