document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            showLoading();
            // Simulate form submission (replace with actual form submission)
            setTimeout(() => {
                this.submit();
            }, 1500);
        }
    });

    function validateForm() {
        let isValid = true;

        if (usernameInput.value.trim() === '') {
            showError(usernameInput, 'Por favor, ingresa tu nombre de usuario');
            isValid = false;
        } else {
            clearError(usernameInput);
        }

        if (passwordInput.value.trim() === '') {
            showError(passwordInput, 'Por favor, ingresa tu contraseña');
            isValid = false;
        } else {
            clearError(passwordInput);
        }

        return isValid;
    }

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.classList.add('error-message');
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        formGroup.classList.add('error');
    }

    function clearError(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        formGroup.classList.remove('error');
    }

    // Add focus and blur effects for inputs
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.form-group').classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.closest('.form-group').classList.remove('focused');
            }
        });
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    function showLoading() {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitButton.disabled = true;
    }

    // Disable zoom on input focus for mobile devices
    const metas = document.getElementsByTagName('meta');
    let metaViewport = Array.from(metas).find(meta => meta.name === "viewport");
    
    if (!metaViewport) {
        metaViewport = document.createElement('meta');
        metaViewport.name = "viewport";
        document.head.appendChild(metaViewport);
    }

    function updateViewport() {
        if (window.innerWidth <= 480) {
            metaViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
        } else {
            metaViewport.content = "width=device-width, initial-scale=1.0";
        }
    }

    updateViewport();
    window.addEventListener('resize', updateViewport);
});