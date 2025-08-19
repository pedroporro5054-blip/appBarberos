// Login Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.querySelector('.btn-login');
    const rememberMe = document.getElementById('rememberMe');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle icon
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Form validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        input.style.borderColor = '#dc3545';
    }

    function clearError(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        input.style.borderColor = '';
    }

    // Real-time validation
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !validateEmail(email)) {
            showError(this, 'Por favor ingresa un email válido');
        } else {
            clearError(this);
        }
    });

    passwordInput.addEventListener('blur', function() {
        const password = this.value;
        if (password && !validatePassword(password)) {
            showError(this, 'La contraseña debe tener al menos 6 caracteres');
        } else {
            clearError(this);
        }
    });

    // Clear errors on input
    emailInput.addEventListener('input', function() {
        clearError(this);
    });

    passwordInput.addEventListener('input', function() {
        clearError(this);
    });

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let isValid = true;

        // Validate email
        if (!email) {
            showError(emailInput, 'El email es requerido');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'Por favor ingresa un email válido');
            isValid = false;
        }

        // Validate password
        if (!password) {
            showError(passwordInput, 'La contraseña es requerida');
            isValid = false;
        } else if (!validatePassword(password)) {
            showError(passwordInput, 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }

        if (isValid) {
            // Show loading state
            loginButton.classList.add('loading');
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
            
            try {
                // Real API call
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        rememberMe: rememberMe.checked
                    }),
                    credentials: 'include'
                });

                const data = await response.json();

                // Verificar el status de la respuesta HTTP
                if (response.ok && data.success) {
                    // Login exitoso
                    showSuccessMessage('¡Inicio de sesión exitoso! Redirigiendo al dashboard...');
                    
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    // Login fallido - mostrar mensaje de error
                    const errorMessage = data.message || 'Error en el inicio de sesión';
                    showErrorMessage(errorMessage);
                    
                    // Limpiar contraseña en caso de error
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Error en login:', error);
                showErrorMessage('Error de conexión. Intenta de nuevo.');
                
                // Limpiar contraseña en caso de error
                passwordInput.value = '';
                passwordInput.focus();
            } finally {
                // Reset button
                loginButton.classList.remove('loading');
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            }
        }
    });

    // Success message
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success mt-3';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
        `;
        
        loginForm.appendChild(successDiv);
        
        // Remove success message after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }

    // Error message
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        `;
        
        loginForm.appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Forgot password handler
    const forgotPasswordLink = document.querySelector('.forgot-password');
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        showErrorMessage('Función de recuperación de contraseña será implementada próximamente.');
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.activeElement === passwordInput) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Focus management
    emailInput.focus();
    
    // Add some CSS for error messages
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: none;
        }
        
        .alert {
            border-radius: 10px;
            border: none;
            padding: 1rem;
            margin-top: 1rem;
        }
        
        .alert-success {
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
            border-left: 4px solid #28a745;
        }
        
        .alert-danger {
            background: rgba(220, 53, 69, 0.1);
            color: #dc3545;
            border-left: 4px solid #dc3545;
        }
        
        .alert-info {
            background: rgba(23, 162, 184, 0.1);
            color: #17a2b8;
            border-left: 4px solid #17a2b8;
        }
        
        .alert-warning {
            background: rgba(255, 193, 7, 0.1);
            color: #ffc107;
            border-left: 4px solid #ffc107;
        }
    `;
    document.head.appendChild(style);
});
