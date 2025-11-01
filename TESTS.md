# Tests Manuales - Contexto de Planificación

## Configuración
- Base URL: `http://localhost:4000`
- Todas las rutas de planning requieren autenticación (Bearer token)

## Paso 1: Crear un usuario de prueba

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Test",
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

## Paso 2: Iniciar sesión

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Guarda el `accessToken` de la respuesta para los siguientes pasos.**

## Paso 3: Crear una solicitud de plan

```bash
curl -X POST http://localhost:4000/planning/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "destination": "Barcelona, España",
    "startDate": "2025-07-01",
    "endDate": "2025-07-07",
    "budgetAmount": 2000,
    "budgetCurrency": "EUR",
    "interests": ["playa", "arquitectura", "gastronomía"]
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "destination": {
      "label": "Barcelona, España"
    },
    "dateRange": {
      "startDate": "2025-07-01",
      "endDate": "2025-07-07",
      "durationDays": 7
    },
    "budget": {
      "amount": 2000,
      "currency": "EUR"
    },
    "budgetPerDay": {
      "amount": 285.71,
      "currency": "EUR"
    },
    "interests": ["playa", "arquitectura", "gastronomía"],
    "status": "pending"
  }
}
```

## Paso 4: Obtener todas las solicitudes

```bash
curl -X GET http://localhost:4000/planning/requests \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

## Paso 5: Agregar un interés

```bash
curl -X POST http://localhost:4000/planning/requests/1/interests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "interest": "museos"
  }'
```

## Paso 6: Remover un interés

```bash
curl -X DELETE http://localhost:4000/planning/requests/1/interests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "interest": "playa"
  }'
```

## Paso 7: Marcar como completada

```bash
curl -X PATCH http://localhost:4000/planning/requests/1/complete \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

## Pruebas de Validación

### 1. Intentar crear con fecha inválida (debe fallar)

```bash
curl -X POST http://localhost:4000/planning/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "destination": "Madrid",
    "startDate": "2025-07-10",
    "endDate": "2025-07-05",
    "budgetAmount": 1000,
    "budgetCurrency": "EUR"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "error": "La fecha de fin debe ser posterior o igual a la fecha de inicio"
}
```

### 2. Intentar crear con presupuesto negativo (debe fallar)

```bash
curl -X POST http://localhost:4000/planning/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "destination": "Madrid",
    "startDate": "2025-07-01",
    "endDate": "2025-07-05",
    "budgetAmount": -100,
    "budgetCurrency": "EUR"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "error": "El monto no puede ser negativo"
}
```

### 3. Intentar crear con presupuesto cero (debe fallar)

```bash
curl -X POST http://localhost:4000/planning/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "destination": "Madrid",
    "startDate": "2025-07-01",
    "endDate": "2025-07-05",
    "budgetAmount": 0,
    "budgetCurrency": "EUR"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "error": "El presupuesto debe ser mayor a cero"
}
```

## Estado del Sistema

✅ **Implementado:**
- Contexto IAM (autenticación)
- Contexto de Planificación completo
- Value Objects: DateRange, Money, Place
- Agregado: SolicitudPlan con invariantes
- Repositorio con persistencia PostgreSQL
- Servicio de aplicación con casos de uso
- Endpoints REST con autenticación

⏳ **Pendiente:**
- Contexto de Itinerarios
- Contexto de Integraciones (Amadeus)
- Contexto de Colaboración
- Exportación a Google Sheets/Calendar
