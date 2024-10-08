document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const fields = form.querySelectorAll('input');

    form.addEventListener('submit', function(e) {
        let isValid = true;

        fields.forEach(field => {
            if (field.value.trim() === '') {
                isValid = false;
                showError(field, 'Este campo es requerido');
            } else if (field.name === 'age' && parseInt(field.value) <= 0) {
                isValid = false;
                showError(field, 'La edad debe ser un número positivo');
            } else {
                clearError(field);
            }
        });

        if (!isValid) {
            e.preventDefault();
        }
    });

    fields.forEach(field => {
        field.addEventListener('input', function() {
            clearError(this);
        });
    });

    function showError(field, message) {
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
        } else {
            const error = document.createElement('p');
            error.classList.add('error-message');
            error.textContent = message;
            field.parentNode.insertBefore(error, field.nextSibling);
        }
    }

    function clearError(field) {
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
});