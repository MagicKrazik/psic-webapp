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

        // If validation passes, you can submit the form to your backend
        // For this example, we'll just log the data and show a success message
        console.log('Form submitted:', { name, email, subject, message });
        showMessage('¡Mensaje enviado con éxito! Gracias por contactarnos.', 'success');

        // Clear the form
        contactForm.reset();
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
});