# 🪒 Sistema de Gestión de Barbería - Alexis Allendez

Un sistema completo de gestión para barberías con funcionalidades de autenticación, dashboard, gestión de citas, horarios y métricas.

## 📁 Estructura del Proyecto

```
Alexis Allendez/
├── 📁 config/                 # Configuración de la aplicación
│   ├── db.js                 # Configuración de base de datos
│   └── initDb.js             # Inicialización de BD y esquemas
├── 📁 controllers/           # Controladores (lógica de presentación)
│   ├── authController.js     # Controlador de autenticación
│   ├── dashboardController.js # Controlador del dashboard
│   └── publicController.js   # Controlador de rutas públicas
├── 📁 middleware/            # Middleware personalizado
│   └── auth.js              # Middleware de autenticación y autorización
├── 📁 models/               # Modelos de datos
│   └── User.js              # Modelo de usuario
├── 📁 routes/               # Definición de rutas
│   ├── auth.js              # Rutas de autenticación
│   ├── dashboard.js         # Rutas del dashboard
│   └── public.js            # Rutas públicas
├── 📁 services/             # Servicios (lógica de negocio)
│   └── authService.js       # Servicio de autenticación
├── 📁 utils/                # Utilidades y helpers
│   └── auth.js              # Utilidades de autenticación
├── 📁 views/                # Vistas del frontend
│   ├── 📁 booking/          # Formulario de reservas
│   ├── 📁 cancel/           # Cancelación de citas
│   ├── 📁 dashboard/        # Panel de administración
│   ├── 📁 login/            # Página de login
│   └── 📁 register/         # Página de registro
├── 📁 public/               # Archivos estáticos públicos
├── 📁 scripts/              # Scripts de desarrollo y testing
├── 📁 sql/                  # Archivos SQL
│   ├── schema.sql           # Esquema de base de datos
│   └── sample-data.sql      # Datos de ejemplo
├── app.js                   # Archivo principal de la aplicación
├── package.json             # Dependencias del proyecto
└── README.md               # Documentación
```

## 🚀 Características

### ✅ Implementado
- **Autenticación JWT** con cookies seguras
- **Sistema de roles** (admin, barbero, cliente)
- **Dashboard administrativo** con métricas
- **Gestión de horarios** con interfaz visual
- **Formulario de reservas** público con **selección de barbero**
- **Sistema de cancelación** de citas
- **Base de datos MySQL** con esquema completo
- **Middleware de seguridad** (helmet, rate limiting, CORS)
- **Estructura modular** y escalable

### 🔄 En Desarrollo
- Gestión de servicios y precios
- Sistema de notificaciones
- Reportes y analytics avanzados
- Integración con pagos
- App móvil

## 🎯 **NUEVA FUNCIONALIDAD: SELECCIÓN DE BARBERO**

### **Características Implementadas**
- **Selector de barbero** en el formulario de reservas
- **Información detallada** del barbero seleccionado (avatar, descripción, estadísticas)
- **Filtrado de servicios** por barbero específico
- **Validación de disponibilidad** por barbero individual
- **Interfaz visual atractiva** con tarjetas de información del barbero

### **Flujo de Usuario**
1. **Selección de barbero**: El cliente elige su barbero preferido
2. **Filtrado de servicios**: Se muestran solo los servicios disponibles de ese barbero
3. **Información del barbero**: Se muestra avatar, descripción y estadísticas
4. **Verificación de disponibilidad**: Se verifica la disponibilidad específica del barbero
5. **Confirmación de reserva**: La reserva se asigna al barbero seleccionado

### **Ventajas de la Implementación**
- **Personalización**: Los clientes pueden elegir su barbero favorito
- **Especialización**: Diferentes barberos pueden ofrecer servicios únicos
- **Mejor experiencia**: Los clientes conocen al barbero antes de la cita
- **Gestión eficiente**: Cada barbero maneja su propia agenda
- **Escalabilidad**: Fácil agregar nuevos barberos al sistema

---

## 🚀 **FUNCIONALIDAD REVOLUCIONARIA: SISTEMA DE DURACIÓN POR SERVICIO**

### **Problema Resuelto**
El sistema anterior tenía una limitación crítica: **todos los servicios usaban la misma duración fija** (15, 20, 30, 45, 60 minutos), lo que no reflejaba la realidad de las barberías donde diferentes servicios requieren diferentes tiempos.

### **Solución Implementada**
- **Duración por servicio**: Cada servicio define su propia duración en minutos
- **Intervalo mínimo configurable**: Espacio mínimo entre turnos consecutivos (5, 10, 15, 20, 30 min)
- **Generación inteligente de slots**: Los horarios disponibles se calculan basándose en la duración real del servicio
- **Flexibilidad total**: Desde 15 minutos hasta 2 horas por servicio

### **Ejemplos de Uso Real**
| Servicio | Duración | Descripción |
|----------|----------|-------------|
| **Corte Simple** | 30 min | Corte básico de cabello |
| **Corte + Barba** | 60 min | Corte completo + afeitado |
| **Tratamiento Premium** | 90 min | Corte + barba + tratamientos |
| **Arreglo Rápido** | 15 min | Peinado o arreglo menor |

### **Ventajas del Nuevo Sistema**
- ✅ **Realismo**: Cada servicio tiene el tiempo que realmente necesita
- ✅ **Eficiencia**: Mejor aprovechamiento del tiempo del barbero
- ✅ **Flexibilidad**: Fácil agregar servicios con duraciones únicas
- ✅ **Precisión**: Los clientes saben exactamente cuánto tiempo tomará su cita
- ✅ **Escalabilidad**: Sistema adaptable a cualquier tipo de servicio

---

## 🧹 **Gestión Inteligente de Servicios**

### **Problema Resuelto**
El sistema anterior impedía eliminar servicios que tenían citas históricas (ya completadas), lo que dificultaba la limpieza y reorganización de servicios.

### **Solución Implementada**
- **Eliminación inteligente**: Solo se impide eliminar servicios con citas activas o futuras
- **Citas históricas**: Las citas completadas, canceladas o no-show no bloquean la eliminación
- **Scripts de limpieza**: Herramientas para limpiar citas históricas y liberar servicios
- **Backup automático**: Sistema de respaldo antes de cualquier limpieza

### **Scripts Disponibles**
| Script | Función | Uso |
|--------|---------|-----|
| `check-deletable-services.js` | Verificar qué servicios se pueden eliminar | Análisis rápido |
| `cleanup-historical-appointments.js` | Analizar citas históricas | Información detallada |
| `execute-cleanup.js` | Limpiar citas históricas | Limpieza real |

### **Política de Limpieza**
- **Citas completadas**: Se pueden limpiar después de 30 días
- **Citas canceladas**: Se pueden limpiar después de 7 días  
- **Citas no-show**: Se pueden limpiar después de 7 días
- **Citas activas**: Nunca se eliminan automáticamente

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación stateless
- **bcryptjs** - Hashing de contraseñas
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos
- **JavaScript ES6+** - Interactividad
- **Bootstrap 5** - Framework CSS
- **Chart.js** - Gráficos y métricas

## 📋 Requisitos Previos

- **Node.js** (versión 16 o superior)
- **MySQL** (versión 8.0 o superior)
- **npm** o **yarn**

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd "Alexis Allendez"
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:

```env
# Configuración de la aplicación
NODE_ENV=development
PORT=3000

# Configuración de base de datos
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=barberia_db
DB_PORT=3306

# Configuración JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h
```

### 4. Configurar base de datos
```bash
# Opción 1: Ejecutar manualmente en MySQL
mysql -u root -p
CREATE DATABASE barberia_db;
USE barberia_db;
SOURCE sql/schema.sql;
SOURCE sql/sample-data.sql;

# Opción 2: Dejar que la app lo haga automáticamente
# (solo asegúrate de que el usuario tenga permisos para crear BD)
```

### 5. Iniciar la aplicación
```bash
npm start
```

La aplicación estará disponible en:
- **Página principal**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Login**: http://localhost:3000/auth/login
- **Registro**: http://localhost:3000/auth/register
- **Reservas**: http://localhost:3000/booking

## 👤 Credenciales por Defecto

### Usuario Administrador
- **Email**: admin@barberia.com
- **Contraseña**: admin123

### Usuario Barbero
- **Email**: barbero@barberia.com
- **Contraseña**: barbero123

## 📊 Estructura de Base de Datos

### Tablas Principales
- **usuarios** - Información de usuarios y autenticación
- **servicios** - Servicios ofrecidos por la barbería
- **clientes** - Información de clientes
- **citas** - Reservas y citas programadas
- **horarios_laborales** - Horarios de trabajo
- **metricas** - Estadísticas y métricas
- **configuracion_barbero** - Configuración personalizada

## 🔐 Seguridad

### Implementado
- **Autenticación JWT** con tokens seguros
- **Hashing de contraseñas** con bcrypt
- **Middleware de autorización** por roles
- **Rate limiting** para prevenir ataques
- **Headers de seguridad** con Helmet
- **Validación de entrada** en todos los endpoints
- **Sanitización de datos** para prevenir XSS

### Mejores Prácticas
- Tokens JWT con expiración
- Cookies httpOnly y secure
- Validación de roles y permisos
- Logging de actividades
- Manejo seguro de errores

## 🧪 Testing

### Scripts Disponibles
```bash
# Test de rutas
npm run test:routes

# Test de base de datos
npm run test:db

# Test de esquema
npm run test:schema
```

## 📈 Métricas y Analytics

### Dashboard Principal
- **Citas del día** - Resumen de citas programadas
- **Ingresos mensuales** - Gráfico de ingresos
- **Servicios populares** - Ranking de servicios
- **Clientes nuevos** - Estadísticas de clientes
- **Horarios ocupados** - Análisis de disponibilidad

### Reportes Disponibles
- Reporte diario de citas
- Análisis de ingresos por período
- Estadísticas de clientes
- Métricas de servicios

## 🔄 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/verify` - Verificar token
- `GET /auth/profile` - Obtener perfil
- `PUT /auth/profile` - Actualizar perfil
- `PUT /auth/change-password` - Cambiar contraseña

### Dashboard
- `GET /dashboard` - Renderizar dashboard
- `GET /dashboard/stats` - Obtener estadísticas
- `GET /dashboard/config` - Obtener configuración
- `PUT /dashboard/config` - Actualizar configuración

### Público
- `GET /` - Página principal
- `GET /booking` - Formulario de reservas
- `POST /booking` - Crear reserva
- `GET /cancel/:id` - Cancelar cita

## 🚀 Despliegue

### Producción
1. Configurar variables de entorno para producción
2. Configurar base de datos de producción
3. Configurar HTTPS y certificados SSL
4. Configurar proxy reverso (nginx/apache)
5. Configurar PM2 para gestión de procesos

### Variables de Entorno de Producción
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu-host-produccion
DB_USER=usuario-produccion
DB_PASSWORD=contraseña-segura
DB_NAME=barberia_prod
JWT_SECRET=secret-super-seguro-produccion
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Alexis Allendez**
- Email: alexis@barberia.com
- GitHub: [@alexisallendez](https://github.com/alexisallendez)

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema
4. Contacta al equipo de desarrollo

---

**¡Gracias por usar el Sistema de Gestión de Barbería! 🪒✨** 