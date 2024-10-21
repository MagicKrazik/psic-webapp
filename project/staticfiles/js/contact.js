// contact.js
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;

        // Perform client-side validation
        if (!name || !email || !subject || !message) {
            showMessage('Por favor, complete todos los campos.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Por favor, ingrese un correo electrónico válido.', 'error');
            return;
        }

        // Send data to the server
        fetch('/send-contact-email/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ name, email, subject, message })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showMessage('¡Mensaje enviado con éxito! Gracias por contactarnos.', 'success');
                contactForm.reset();
            } else {
                showMessage('Hubo un problema al enviar el mensaje. Por favor, inténtelo de nuevo.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Hubo un problema al enviar el mensaje. Por favor, inténtelo de nuevo.', 'error');
        });
    });

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showMessage(message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message ${type}`;
        messageContainer.textContent = message;

        contactForm.insertAdjacentElement('beforebegin', messageContainer);

        setTimeout(() => {
            messageContainer.remove();
        }, 5000);
    }

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