# 🌍 Travelsia Backend - DDD Architecture

Backend API para plataforma de planificación de viajes usando **Domain-Driven Design (DDD)**.

## 🚀 Stack Tecnológico

- **Node.js** + **Express 5.1.0** - Framework backend
- **PostgreSQL 8.16.3** - Base de datos relacional
- **JWT** - Autenticación con access + refresh tokens
- **Amadeus API** - Integración de búsqueda de vuelos
- **ES Modules** - Sintaxis moderna de JavaScript

## 📂 Estructura del Proyecto

```
src/
├── domain/                    # Capa de Dominio (lógica de negocio pura)
│   ├── aggregates/           # Agregados (raíces de consistencia)
│   │   ├── SolicitudPlan.js
│   │   ├── Itinerario.js
│   │   └── BusquedaVuelos.js
│   ├── entities/             # Entidades
│   │   ├── Dia.js
│   │   └── Actividad.js
│   ├── value-objects/        # Objetos de valor inmutables
│   │   ├── DateRange.js
│   │   ├── Money.js
│   │   ├── Place.js
│   │   ├── TimeSlot.js
│   │   ├── ActividadTipo.js
│   │   ├── EstadoActividad.js
│   │   ├── IATA.js
│   │   ├── Cabina.js
│   │   ├── Segmento.js
│   │   └── OfertaVuelo.js
│   └── services/             # Servicios de dominio
│       ├── CalculadoraDeCostos.js
│       └── ValidadorDeSolapes.js
├── infrastructure/           # Capa de Infraestructura
│   ├── repositories/         # Persistencia
│   │   ├── PlanRequestRepository.js
│   │   ├── ItinerarioRepository.js
│   │   └── BusquedaVuelosRepository.js
│   └── adapters/             # Anti-Corruption Layers
│       └── AmadeusFlightAdapter.js
├── services/                 # Capa de Aplicación (casos de uso)
│   ├── userService.js
│   ├── planningService.js
│   ├── itinerarioService.js
│   └── integrationService.js
├── routes/                   # API REST
│   ├── auth.routes.js
│   ├── planning.routes.js
│   ├── itinerary.routes.js
│   └── integration.routes.js
├── middlewares/              # Middlewares
│   └── auth.js
├── db.js                     # Conexión PostgreSQL
└── server.js                 # Punto de entrada
```

## 🏛️ Bounded Contexts (DDD)

### 1. **IAM (Identity & Access Management)** ✅
- Registro, login, refresh tokens
- Roles y permisos
- JWT con bcrypt

### 2. **Planificación** ✅
- Solicitudes de planes de viaje
- Gestión de destinos, fechas y presupuestos
- Estados: pending → draft_generated → completed

### 3. **Itinerarios** ✅
- Gestión de días y actividades
- Validación de solapes de horarios
- Cálculos financieros en tiempo real
- Estados: borrador → publicado → archivado

### 4. **Integraciones** ✅ **NUEVO**
- Búsqueda de vuelos con Amadeus API
- Cache inteligente (15 min TTL)
- Filtros y ordenamiento avanzado
- Integración automática con itinerarios

### 5. **Colaboración** 🚧 (Pendiente)
- Compartir itinerarios
- Permisos multi-usuario
- Notificaciones

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npm run migrate

# Iniciar servidor
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Database
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=authdb

# JWT
JWT_SECRET=your_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Server
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Amadeus API
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
AMADEUS_TEST_MODE=true
```

### Obtener Credenciales de Amadeus

1. Registrarse en [Amadeus for Developers](https://developers.amadeus.com)
2. Crear una aplicación en el dashboard
3. Copiar `Client ID` y `Client Secret` al `.env`

## 🗄️ Base de Datos

### Schema

```sql
users                 -- Usuarios del sistema
refresh_tokens        -- Tokens de refresco JWT
plan_requests         -- Solicitudes de planificación
itineraries           -- Itinerarios de viaje
days                  -- Días dentro de itinerarios
activities            -- Actividades por día
flight_searches       -- Cache de búsquedas de vuelos
```

### Migrar Base de Datos

```bash
npm run migrate
```

## 🚀 Scripts NPM

```bash
npm run dev       # Desarrollo con nodemon
npm run start     # Producción
npm run migrate   # Ejecutar migraciones
```

## 📡 API Endpoints

### Base URL
```
http://localhost:4000
```

### Autenticación (IAM)
```
POST   /auth/register          # Registro de usuario
POST   /auth/login             # Login (retorna access + refresh token)
POST   /auth/refresh           # Renovar access token
POST   /auth/logout            # Logout
GET    /me                     # Información del usuario autenticado
```

### Planificación
```
POST   /planning/requests                      # Crear solicitud de plan
GET    /planning/requests/:id                  # Obtener solicitud
GET    /planning/requests                      # Listar solicitudes del usuario
PATCH  /planning/requests/:id                  # Actualizar solicitud
DELETE /planning/requests/:id                  # Eliminar solicitud
POST   /planning/requests/:id/interests        # Agregar intereses
PATCH  /planning/requests/:id/draft-generated  # Marcar como borrador generado
```

### Itinerarios
```
POST   /itineraries/from-plan/:planRequestId                          # Crear desde solicitud
GET    /itineraries                                                    # Listar itinerarios
GET    /itineraries/:id                                                # Obtener itinerario
PATCH  /itineraries/:id                                                # Actualizar información
DELETE /itineraries/:id                                                # Eliminar itinerario
POST   /itineraries/:id/days/:dayNumber/activities                    # Agregar actividad
PATCH  /itineraries/:id/days/:dayNumber/activities/:activityId        # Actualizar actividad
DELETE /itineraries/:id/days/:dayNumber/activities/:activityId        # Eliminar actividad
PATCH  /itineraries/:id/days/:dayNumber/activities/:activityId/confirm # Confirmar actividad
PATCH  /itineraries/:id/days/:dayNumber/activities/:activityId/cancel  # Cancelar actividad
PATCH  /itineraries/:id/publish                                        # Publicar itinerario
PATCH  /itineraries/:id/archive                                        # Archivar itinerario
GET    /itineraries/:id/financial-summary                             # Resumen financiero
GET    /itineraries/:id/schedule-validation                           # Validar horarios
```

### Integraciones (Vuelos) ⭐ NUEVO
```
POST   /integrations/flights/search                                    # Buscar vuelos
GET    /integrations/flights/searches/:searchId                        # Obtener búsqueda
GET    /integrations/flights/searches                                  # Historial de búsquedas
POST   /integrations/flights/searches/:searchId/filters                # Aplicar filtros
GET    /integrations/flights/searches/:searchId/sort/:criterio         # Ordenar ofertas
GET    /integrations/flights/searches/:searchId/offers/:offerId        # Detalle de oferta
POST   /integrations/flights/searches/:searchId/offers/:offerId/add-to-itinerary  # Agregar a itinerario
GET    /integrations/status                                            # Estado de integraciones
```

## 📚 Documentación Completa

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura DDD y principios
- [PLANNING_API.md](./PLANNING_API.md) - API de Planificación
- [ITINERARY_API.md](./ITINERARY_API.md) - API de Itinerarios
- [INTEGRATION_API.md](./INTEGRATION_API.md) - API de Integraciones (Vuelos)
- [TESTS.md](./TESTS.md) - Guía de testing manual

## 🎯 Principios DDD Aplicados

### ✅ Lenguaje Ubicuo
- Términos del dominio en código: `Itinerario`, `SolicitudPlan`, `OfertaVuelo`
- Sin fugas de términos técnicos

### ✅ Agregados con Invariantes
- `Itinerario` previene solapes de actividades
- `BusquedaVuelos` valida fechas y pasajeros
- Transacciones por agregado completo

### ✅ Value Objects Inmutables
- `Money`, `DateRange`, `TimeSlot`, `IATA`, `Cabina`
- Validación en constructor
- Sin setters

### ✅ Anti-Corruption Layer
- `AmadeusFlightAdapter` aísla API externa
- Traducción modelo Amadeus ↔ Dominio
- Dominio libre de dependencias externas

### ✅ Repository Pattern
- Un repositorio por agregado
- Conversión dominio ↔ persistencia encapsulada
- Cache transparente en `BusquedaVuelosRepository`

### ✅ Domain Services
- `CalculadoraDeCostos` - Lógica transversal de cálculos
- `ValidadorDeSolapes` - Detección de conflictos de horario
- Sin estado, solo comportamiento

## 🧪 Testing

### Testing Manual (con curl)

Ver [TESTS.md](./TESTS.md) para ejemplos completos.

```bash
# 1. Registrar usuario
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# 2. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Buscar vuelos
curl -X POST http://localhost:4000/integrations/flights/search \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "origen": "MAD",
    "destino": "BCN",
    "fechaSalida": "2025-12-15",
    "numeroPasajeros": 1
  }'
```

## 🔥 Características Destacadas

### 1. **Cache Inteligente de Vuelos** 🧠
- Cache en memoria + PostgreSQL
- TTL de 15 minutos
- Hit rate típico: 80%
- Ahorro de llamadas a Amadeus

### 2. **Validación Automática de Solapes** ⏰
- Previene conflictos de horario
- Mensajes de error descriptivos
- Sugerencias de horarios alternativos

### 3. **Cálculos Financieros en Tiempo Real** 💰
- Costo total del itinerario
- Presupuesto restante
- Costo por tipo de actividad
- Comparación con presupuesto inicial

### 4. **Integración Automática Vuelos → Itinerario** 🔗
- Cada segmento = 1 actividad
- Colocación automática en día correcto
- Costo prorrateado
- Metadata completa del vuelo

### 5. **Filtros y Ordenamiento Avanzado** 🔍
- 6 criterios de ordenamiento
- Filtros múltiples combinables
- Procesamiento en memoria (rápido)

## 📊 Estado del Proyecto

### Completado (80%)
- ✅ IAM (Autenticación)
- ✅ Planificación (Solicitudes)
- ✅ Itinerarios (Días + Actividades)
- ✅ Integraciones (Vuelos con Amadeus)

### En Progreso (20%)
- 🚧 Colaboración (Compartir itinerarios)
- 🚧 Testing automatizado
- 🚧 Event Sourcing
- 🚧 CQRS

## 🤝 Colaboradores

- **Luiggi** - Desarrollador Principal

## 📄 Licencia

ISC