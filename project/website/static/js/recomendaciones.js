document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessage = document.getElementById('welcome-message');
    const downloadPdfButton = document.getElementById('download-pdf');
    
    function fetchAppointmentData() {
        fetch('/get-user-appointment/')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    updateWelcomeMessage(data);
                } else {
                    welcomeMessage.textContent = 'Bienvenido a sus recomendaciones para la cita.';
                }
            })
            .catch(error => {
                console.error('Error fetching appointment data:', error);
                welcomeMessage.textContent = 'Bienvenido a sus recomendaciones para la cita.';
            });
    }

    function updateWelcomeMessage(data) {
        const appointmentDate = new Date(data.date);
        const formattedDate = appointmentDate.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = data.time;

        welcomeMessage.innerHTML = `
            <p>Hola ${data.username},</p>
            <p>Gracias por agendar su cita para el <strong>${formattedDate}</strong> a las <strong>${formattedTime}</strong>.</p>
            <p>Aquí tiene algunas recomendaciones para prepararse para su sesión:</p>
        `;
    }

    downloadPdfButton.addEventListener('click', function() {
        window.location.href = '/download-recomendaciones-pdf/';
    });

    fetchAppointmentData();
});