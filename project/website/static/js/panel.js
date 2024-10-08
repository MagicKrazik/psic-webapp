document.addEventListener('DOMContentLoaded', function() {
    // Initialize Flatpickr for date and time inputs
    flatpickr("#date", {
        dateFormat: "Y-m-d",
    });

    flatpickr("#startTime, #endTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
    });

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
            }
        });
    });

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