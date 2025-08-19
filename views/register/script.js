// Register Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const registerButton = document.querySelector('.btn-register');
    const aceptarTerminos = document.getElementById('aceptarTerminos');
    
    // Elementos del formulario
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const emailInput = document.getElementById('email');
    const telefonoInput = document.getElementById('telefono');
    const nombreBarberiaInput = document.getElementById('nombreBarberia');
    const direccionInput = document.getElementById('direccion');
    const descripcionInput = document.getElementById('descripcion');
    const registrationCodeInput = document.getElementById('registrationCode');
    
    // Elementos de fortaleza de contraseña
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) {
            strength += 25;
        } else {
            feedback.push('Al menos 8 caracteres');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Al menos una minúscula');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Al menos una mayúscula');
        }

        // Number check
        if (/[0-9]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Al menos un número');
        }

        return { strength, feedback };
    }

    // Update password strength indicator
    function updatePasswordStrength(password) {
        const { strength, feedback } = checkPasswordStrength(password);
        
        strengthFill.className = 'strength-fill';
        
        if (password.length === 0) {
            strengthFill.style.width = '0%';
            strengthText.textContent = 'Fortaleza de la contraseña';
            strengthText.style.color = 'var(--text-gray)';
        } else if (strength <= 25) {
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Débil - ' + feedback.join(', ');
            strengthText.style.color = 'var(--danger-color)';
        } else if (strength <= 50) {
            strengthFill.classList.add('fair');
            strengthText.textContent = 'Regular - ' + feedback.join(', ');
            strengthText.style.color = 'var(--warning-color)';
        } else if (strength <= 75) {
            strengthFill.classList.add('good');
            strengthText.textContent = 'Buena - ' + feedback.join(', ');
            strengthText.style.color = 'var(--info-color)';
        } else {
            strengthFill.classList.add('strong');
            strengthText.textContent = 'Excelente - Contraseña segura';
            strengthText.style.color = 'var(--success-color)';
        }
    }

    // Password strength real-time update
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
        validatePasswordMatch();
    });

    // Confirm password match validation
    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length === 0) {
            clearValidation(confirmPasswordInput);
        } else if (password === confirmPassword) {
            showSuccess(confirmPasswordInput, 'Las contraseñas coinciden');
        } else {
            showError(confirmPasswordInput, 'Las contraseñas no coinciden');
        }
    }

    confirmPasswordInput.addEventListener('input', validatePasswordMatch);

    // Form validation functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    function validateName(name) {
        return name.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
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
        input.classList.remove('success');
        input.classList.add('error');
    }

    function showSuccess(input, message) {
        const formGroup = input.closest('.form-group');
        let successElement = formGroup.querySelector('.success-message');
        
        if (!successElement) {
            successElement = document.createElement('div');
            successElement.className = 'success-message';
            formGroup.appendChild(successElement);
        }
        
        successElement.textContent = message;
        successElement.style.display = 'block';
        input.classList.remove('error');
        input.classList.add('success');
    }

    function clearValidation(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        const successElement = formGroup.querySelector('.success-message');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        if (successElement) {
            successElement.style.display = 'none';
        }
        input.classList.remove('error', 'success');
    }

    // Real-time validation
    nombreInput.addEventListener('blur', function() {
        const nombre = this.value.trim();
        if (nombre && !validateName(nombre)) {
            showError(this, 'El nombre debe tener al menos 2 caracteres y solo letras');
        } else if (nombre) {
            showSuccess(this, 'Nombre válido');
        } else {
            clearValidation(this);
        }
    });

    apellidoInput.addEventListener('blur', function() {
        const apellido = this.value.trim();
        if (apellido && !validateName(apellido)) {
            showError(this, 'El apellido debe tener al menos 2 caracteres y solo letras');
        } else if (apellido) {
            showSuccess(this, 'Apellido válido');
        } else {
            clearValidation(this);
        }
    });

    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !validateEmail(email)) {
            showError(this, 'Por favor ingresa un email válido');
        } else if (email) {
            showSuccess(this, 'Email válido');
        } else {
            clearValidation(this);
        }
    });

    telefonoInput.addEventListener('blur', function() {
        const telefono = this.value.trim();
        if (telefono && !validatePhone(telefono)) {
            showError(this, 'Por favor ingresa un teléfono válido');
        } else if (telefono) {
            showSuccess(this, 'Teléfono válido');
        } else {
            clearValidation(this);
        }
    });

    nombreBarberiaInput.addEventListener('blur', function() {
        const nombreBarberia = this.value.trim();
        if (nombreBarberia && nombreBarberia.length < 3) {
            showError(this, 'El nombre de la barbería debe tener al menos 3 caracteres');
        } else if (nombreBarberia) {
            showSuccess(this, 'Nombre de barbería válido');
        } else {
            clearValidation(this);
        }
    });

    // Clear validation on input
    [nombreInput, apellidoInput, emailInput, telefonoInput, nombreBarberiaInput, registrationCodeInput].forEach(input => {
        input.addEventListener('input', function() {
            clearValidation(this);
        });
    });

    // Form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            nombre: nombreInput.value.trim(),
            apellido: apellidoInput.value.trim(),
            email: emailInput.value.trim(),
            telefono: telefonoInput.value.trim(),
            nombreBarberia: nombreBarberiaInput.value.trim(),
            direccion: direccionInput.value.trim(),
            descripcion: descripcionInput.value.trim(),
            registrationCode: registrationCodeInput.value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value,
            aceptarTerminos: aceptarTerminos.checked
        };

        // Validate all fields
        let isValid = true;

        // Required fields validation
        if (!formData.nombre) {
            showError(nombreInput, 'El nombre es requerido');
            isValid = false;
        } else if (!validateName(formData.nombre)) {
            showError(nombreInput, 'El nombre debe tener al menos 2 caracteres y solo letras');
            isValid = false;
        }

        if (!formData.apellido) {
            showError(apellidoInput, 'El apellido es requerido');
            isValid = false;
        } else if (!validateName(formData.apellido)) {
            showError(apellidoInput, 'El apellido debe tener al menos 2 caracteres y solo letras');
            isValid = false;
        }

        if (!formData.email) {
            showError(emailInput, 'El email es requerido');
            isValid = false;
        } else if (!validateEmail(formData.email)) {
            showError(emailInput, 'Por favor ingresa un email válido');
            isValid = false;
        }

        if (!formData.telefono) {
            showError(telefonoInput, 'El teléfono es requerido');
            isValid = false;
        } else if (!validatePhone(formData.telefono)) {
            showError(telefonoInput, 'Por favor ingresa un teléfono válido');
            isValid = false;
        }

        if (!formData.nombreBarberia) {
            showError(nombreBarberiaInput, 'El nombre de la barbería es requerido');
            isValid = false;
        } else if (formData.nombreBarberia.length < 3) {
            showError(nombreBarberiaInput, 'El nombre de la barbería debe tener al menos 3 caracteres');
            isValid = false;
        }

        if (!formData.password) {
            showError(passwordInput, 'La contraseña es requerida');
            isValid = false;
        } else if (formData.password.length < 8) {
            showError(passwordInput, 'La contraseña debe tener al menos 8 caracteres');
            isValid = false;
        }

        if (!formData.confirmPassword) {
            showError(confirmPasswordInput, 'Confirma tu contraseña');
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            showError(confirmPasswordInput, 'Las contraseñas no coinciden');
            isValid = false;
        }

        if (!formData.registrationCode) {
            showError(registrationCodeInput, 'El código de registro es requerido');
            isValid = false;
        }

        if (!formData.aceptarTerminos) {
            showError(aceptarTerminos, 'Debes aceptar los términos y condiciones');
            isValid = false;
        }

        if (isValid) {
            // Show loading state
            registerButton.classList.add('loading');
            registerButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando cuenta...';
            
            try {
                // Real API call
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nombre: formData.nombre,
                        apellido: formData.apellido,
                        email: formData.email,
                        telefono: formData.telefono,
                        nombreBarberia: formData.nombreBarberia,
                        direccion: formData.direccion,
                        descripcion: formData.descripcion,
                        registrationCode: formData.registrationCode,
                        password: formData.password,
                        confirmPassword: formData.confirmPassword
                    }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    showSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo al login...');
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 3000);
                } else {
                    showErrorMessage(data.message || 'Error en el registro');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                showErrorMessage('Error de conexión. Intenta de nuevo.');
            } finally {
                // Reset button
                registerButton.classList.remove('loading');
                registerButton.innerHTML = '<i class="fas fa-user-plus me-2"></i>Crear Cuenta';
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
        
        registerForm.appendChild(successDiv);
        
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
        
        registerForm.appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Terms and conditions handler
    const termsLinks = document.querySelectorAll('.terms-link');
    termsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showTermsModal();
        });
    });

    function showTermsModal() {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal fade';
        modalDiv.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Términos y Condiciones</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>Términos de Servicio</h6>
                        <p>Al registrarte en nuestro sistema, aceptas los siguientes términos:</p>
                        <ul>
                            <li>Proporcionar información veraz y actualizada</li>
                            <li>Mantener la confidencialidad de tu cuenta</li>
                            <li>Usar el sistema de manera responsable</li>
                            <li>Respetar los derechos de otros usuarios</li>
                        </ul>
                        <h6>Política de Privacidad</h6>
                        <p>Tu información personal será tratada con confidencialidad y solo será utilizada para:</p>
                        <ul>
                            <li>Gestionar tu cuenta de barbero</li>
                            <li>Procesar reservas y pagos</li>
                            <li>Enviar notificaciones importantes</li>
                            <li>Mejorar nuestros servicios</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalDiv);
        
        const modal = new bootstrap.Modal(modalDiv);
        modal.show();
        
        modalDiv.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalDiv);
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.activeElement === confirmPasswordInput) {
            registerForm.dispatchEvent(new Event('submit'));
        }
    });

    // Focus management
    nombreInput.focus();
    
    // Add some CSS for modal styling
    const style = document.createElement('style');
    style.textContent = `
        .modal-content {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            color: var(--text-light);
        }
        
        .modal-header {
            border-bottom: 1px solid var(--border-color);
        }
        
        .modal-footer {
            border-top: 1px solid var(--border-color);
        }
        
        .btn-close {
            filter: invert(1);
        }
        
        .modal-title {
            color: var(--accent-color);
        }
        
        .alert-danger {
            background: rgba(220, 53, 69, 0.1);
            color: #dc3545;
            border-left: 4px solid #dc3545;
        }
    `;
    document.head.appendChild(style);
});
