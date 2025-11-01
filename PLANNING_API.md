# API de Planificación - Endpoints

## Contexto de Planificación

El contexto de Planificación permite a los usuarios crear y gestionar solicitudes de planes de viaje con destinos, fechas, presupuestos e intereses.

### Arquitectura DDD Implementada

- **Value Objects**: `DateRange`, `Money`, `Place`
- **Agregado**: `SolicitudPlan`
- **Repositorio**: `PlanRequestRepository`
- **Servicio de Aplicación**: `PlanningService`

---

## Endpoints

### 1. Crear Solicitud de Plan

**POST** `/planning/requests`

Crea una nueva solicitud de plan de viaje.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "destination": "París, Francia",
  "startDate": "2025-06-01",
  "endDate": "2025-06-10",
  "budgetAmount": 3000,
  "budgetCurrency": "USD",
  "interests": ["cultura", "gastronomía", "museos"]
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "destination": {
      "label": "París, Francia"
    },
    "dateRange": {
      "startDate": "2025-06-01",
      "endDate": "2025-06-10",
      "durationDays": 10
    },
    "budget": {
      "amount": 3000,
      "currency": "USD"
    },
    "budgetPerDay": {
      "amount": 300,
      "currency": "USD"
    },
    "interests": ["cultura", "gastronomía", "museos"],
    "status": "pending",
    "createdAt": "2025-10-31T12:00:00.000Z",
    "updatedAt": "2025-10-31T12:00:00.000Z"
  }
}
```

---

### 2. Obtener Todas las Solicitudes del Usuario

**GET** `/planning/requests`

Obtiene todas las solicitudes de plan del usuario autenticado.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "destination": {
        "label": "París, Francia"
      },
      "dateRange": {
        "startDate": "2025-06-01",
        "endDate": "2025-06-10",
        "durationDays": 10
      },
      "budget": {
        "amount": 3000,
        "currency": "USD"
      },
      "budgetPerDay": {
        "amount": 300,
        "currency": "USD"
      },
      "interests": ["cultura", "gastronomía", "museos"],
      "status": "pending",
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  ]
}
```

---

### 3. Obtener Solicitud por ID

**GET** `/planning/requests/:id`

Obtiene una solicitud específica por su ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "destination": {
      "label": "París, Francia"
    },
    "dateRange": {
      "startDate": "2025-06-01",
      "endDate": "2025-06-10",
      "durationDays": 10
    },
    "budget": {
      "amount": 3000,
      "currency": "USD"
    },
    "budgetPerDay": {
      "amount": 300,
      "currency": "USD"
    },
    "interests": ["cultura", "gastronomía", "museos"],
    "status": "pending",
    "createdAt": "2025-10-31T12:00:00.000Z",
    "updatedAt": "2025-10-31T12:00:00.000Z"
  }
}
```

---

### 4. Agregar Interés

**POST** `/planning/requests/:id/interests`

Agrega un interés a una solicitud de plan existente.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "interest": "arquitectura"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "interests": ["cultura", "gastronomía", "museos", "arquitectura"],
    ...
  }
}
```

---

### 5. Remover Interés

**DELETE** `/planning/requests/:id/interests`

Remueve un interés de una solicitud de plan.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "interest": "museos"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "interests": ["cultura", "gastronomía", "arquitectura"],
    ...
  }
}
```

---

### 6. Marcar como Completada

**PATCH** `/planning/requests/:id/complete`

Marca una solicitud de plan como completada.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    ...
  }
}
```

---

### 7. Eliminar Solicitud

**DELETE** `/planning/requests/:id`

Elimina una solicitud de plan.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Solicitud eliminada exitosamente"
}
```

---

## Estados de Solicitud

- **pending**: Solicitud creada, esperando generación de borrador
- **draft_generated**: Borrador de itinerario generado
- **completed**: Solicitud completada

---

## Validaciones del Dominio

### DateRange
- La fecha de fin debe ser posterior o igual a la fecha de inicio
- Ambas fechas deben ser válidas

### Money
- El monto debe ser un número válido
- El monto no puede ser negativo
- La moneda debe ser un código ISO 4217 de 3 letras (ej: USD, EUR, MXN)

### SolicitudPlan
- El presupuesto debe ser mayor a cero
- Solo se pueden modificar solicitudes en estado "pending"
- Los intereses no pueden estar vacíos

---

## Ejemplo de uso con cURL

### 1. Registrar usuario (si aún no tienes cuenta)
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### 2. Iniciar sesión
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### 3. Crear solicitud de plan
```bash
curl -X POST http://localhost:4000/planning/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {tu_access_token}" \
  -d '{
    "destination": "Tokyo, Japón",
    "startDate": "2025-09-15",
    "endDate": "2025-09-25",
    "budgetAmount": 5000,
    "budgetCurrency": "USD",
    "interests": ["tecnología", "cultura", "gastronomía"]
  }'
```

### 4. Obtener solicitudes
```bash
curl -X GET http://localhost:4000/planning/requests \
  -H "Authorization: Bearer {tu_access_token}"
```

---

## Próximos pasos

El siguiente contexto a implementar según la arquitectura DDD es:

### Contexto de Itinerarios
- Agregados: `Itinerario`, `Día`, `Actividad`
- Value Objects: `TimeSlot`, `ActividadTipo`, `EstadoActividad`
- Servicios de dominio: `CalculadoraDeCostos`, `ValidadorDeSolapes`
