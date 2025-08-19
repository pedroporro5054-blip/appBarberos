// Cancel Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const cancelForm = document.getElementById('cancelForm');
    
    // Validación de formulario
    function validateForm() {
        const confirmationCode = document.getElementById('confirmationCode').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Validar campos requeridos
        if (!confirmationCode) {
            showError('Por favor ingresa tu código de confirmación');
            return false;
        }
        
        if (!email) {
            showError('Por favor ingresa tu correo electrónico');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showError('Por favor ingresa un correo electrónico válido');
            return false;
        }
        
        return true;
    }
    
    // Validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Mostrar error
    function showError(message) {
        // Remover mensajes de error existentes
        const existingError = document.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        `;
        
        cancelForm.appendChild(errorDiv);
        
        // Scroll al error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remover error después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    // Mostrar éxito
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success mt-3';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
        `;
        
        cancelForm.appendChild(successDiv);
        
        // Scroll al mensaje
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Enviar formulario
    cancelForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const cancelButton = document.querySelector('.btn-cancel');
        const originalText = cancelButton.innerHTML;
        
        // Mostrar estado de carga
        cancelButton.classList.add('loading');
        cancelButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando cancelación...';
        
        try {
            // Recopilar datos del formulario
            const formData = {
                confirmationCode: document.getElementById('confirmationCode').value.trim(),
                email: document.getElementById('email').value.trim()
            };
            
            // Enviar a la API
            const response = await fetch('/api/booking/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    codigo_cancelacion: formData.confirmationCode
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Mostrar mensaje de éxito
                showSuccess('¡Cita cancelada exitosamente!');
                
                // Limpiar formulario
                cancelForm.reset();
            } else {
                showError(result.message || 'Hubo un error al cancelar tu cita');
            }
            
        } catch (error) {
            console.error('Error al procesar la cancelación:', error);
            showError('Hubo un error al cancelar tu cita. Por favor intenta de nuevo.');
        } finally {
            // Restaurar botón
            cancelButton.classList.remove('loading');
            cancelButton.innerHTML = originalText;
        }
    });
    
    // Formatear código de confirmación automáticamente
    const confirmationCodeInput = document.getElementById('confirmationCode');
    confirmationCodeInput.addEventListener('input', function(e) {
        // Convertir a mayúsculas y remover caracteres especiales
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Limitar a 6 caracteres
        if (value.length > 6) {
            value = value.slice(0, 6);
        }
        
        e.target.value = value;
    });
    
    // Animaciones de entrada
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            group.style.transition = 'all 0.6s ease';
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
});

// Estilos adicionales para alertas
const style = document.createElement('style');
style.textContent = `
    .alert {
        border-radius: 15px;
        border: none;
        padding: 1rem 1.5rem;
        margin-top: 1rem;
        font-weight: 500;
    }
    
    .alert-danger {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
        border-left: 4px solid #dc3545;
    }
    
    .alert-success {
        background: rgba(40, 167, 69, 0.1);
        color: #28a745;
        border-left: 4px solid #28a745;
    }
    
    .alert i {
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style); 