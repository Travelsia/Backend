# 🧪 Guía Completa de Testing - Travelsia Backend# 🧪 Guía Completa de Testing - Travelsia Backend



Esta guía contiene todas las pruebas end-to-end para verificar el correcto funcionamiento del sistema con los **datos correctos** del dominio.Esta guía contiene todas las pruebas end-to-end para verificar el correcto funcionamiento del sistema.



## 📋 Tabla de Contenidos## 📋 Tabla de Contenidos



1. [Requisitos Previos](#requisitos-previos)1. [Requisitos Previos](#requisitos-previos)

2. [Configuración Inicial](#configuración-inicial)2. [Configuración Inicial](#configuración-inicial)

3. [Testing por Bounded Context](#testing-por-bounded-context)3. [Testing por Bounded Context](#testing-por-bounded-context)

4. [Scripts Automatizados](#scripts-automatizados)4. [Scripts de Testing](#scripts-de-testing)

5. [Solución de Problemas](#solución-de-problemas)

---

---

## Requisitos Previos

## Requisitos Previos

### Software Necesario

### Software Necesario- Node.js v18+

- Node.js v18+- PostgreSQL 14+

- PostgreSQL 14+- PowerShell 5.1+ (Windows) o bash (Linux/Mac)

- PowerShell 5.1+ (Windows) o bash (Linux/Mac)

### Credenciales Requeridas

### Credenciales Requeridas- **Amadeus API**: Client ID y Client Secret (modo test)

- **Amadeus API**: Client ID y Client Secret (modo test)- **Google Cloud**: Service Account Key JSON

- **Google Cloud**: Service Account Key JSON- **Google Sheets**: Template ID público

- **Google Sheets**: Template ID público compartido con Service Account

### Servicios Externos

### Servicios Externos- Base de datos PostgreSQL corriendo en `localhost:5432`

- Base de datos PostgreSQL corriendo en `localhost:5432`- Servidor backend corriendo en `http://localhost:4000`

- Servidor backend corriendo en `http://localhost:4000`

---

---

## 🔐 Paso 1: Registro de Usuario

## Configuración Inicial

### 1.1 Registrar nuevo usuario

### 1. Variables de Entorno

```powershell

Archivo `.env`:curl -X POST http://localhost:4000/auth/register `

```env  -H "Content-Type: application/json" `

# Server  -d '{

PORT=4000    "name": "Test User",

    "email": "test@travelsia.com",

# Database    "password": "Test1234!",

PG_HOST=localhost    "role": "user"

PG_PORT=5432  }'

PG_USER=postgres```

PG_PASSWORD=tu_password

PG_DATABASE=authdb**Respuesta esperada:**

```json

# JWT{

JWT_ACCESS_SECRET=super_access_secret_32_chars_min  "user": {

JWT_REFRESH_SECRET=super_refresh_secret_32_chars_min    "id": 1,

ACCESS_TOKEN_TTL=15m    "name": "Test User",

REFRESH_TOKEN_TTL=30d    "email": "test@travelsia.com",

    "role": "user"

# CORS  },

CORS_ORIGIN=http://localhost:5173  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Amadeus API}

AMADEUS_CLIENT_ID=tu_client_id```

AMADEUS_CLIENT_SECRET=tu_client_secret

AMADEUS_BASE_URL=https://test.api.amadeus.com### 1.2 Guardar el token

AMADEUS_TEST_MODE=true

```powershell

# Google Sheets$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Pega tu accessToken aquí

GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}```

GOOGLE_SHEETS_TEMPLATE_ID=1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw

```---



### 2. Inicializar Base de Datos## 📝 Paso 2: Crear Solicitud de Plan de Viaje



```powershell```powershell

# Conectar a PostgreSQLcurl -X POST http://localhost:4000/planning/requests `

psql -U postgres  -H "Content-Type: application/json" `

  -H "Authorization: Bearer $TOKEN" `

# Crear base de datos  -d '{

CREATE DATABASE authdb;    "destination": "París, Francia",

    "startDate": "2025-06-15",

# Ejecutar migraciones    "endDate": "2025-06-20",

\c authdb    "budgetAmount": 1500,

\i migrations/add_google_sheets_table.sql    "budgetCurrency": "EUR",

```    "interests": ["cultura", "gastronomia", "historia"]

  }'

### 3. Instalar Dependencias```



```powershell**Respuesta esperada:**

npm install```json

```{

  "success": true,

### 4. Iniciar Servidor  "data": {

    "id": 1,

```powershell    "userId": 1,

npm run dev    "destination": {

```      "label": "París, Francia"

    },

Verificar que el servidor muestra:    "dateRange": {

```      "startDate": "2025-06-15",

✅ Google Sheets Adapter inicializado correctamente      "endDate": "2025-06-20",

   Template ID: 1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw      "durationDays": 6

🚀 Server running on http://localhost:4000    },

```    "budget": {

      "amount": 1500,

---      "currency": "EUR"

    },

## Testing por Bounded Context    "budgetPerDay": {

      "amount": 250,

### 🔐 1. Autenticación y Usuarios      "currency": "EUR"

    },

#### 1.1 Registro de Usuario    "interests": ["cultura", "gastronomia", "historia"],

    "status": "pending"

**Endpoint:** `POST /auth/register`  }

}

**Request:**```

```json

{**Guardar el ID:**

  "fullName": "Usuario Test",```powershell

  "email": "test@example.com",$PLAN_ID = 1  # Usa el ID que recibiste

  "password": "password123"```

}

```---



**PowerShell:**## 🗺️ Paso 3: Crear Itinerario desde la Solicitud

```powershell

$regBody = @{```powershell

  fullName="Usuario Test"curl -X POST "http://localhost:4000/itineraries/from-plan/$PLAN_ID" `

  email="test@example.com"  -H "Content-Type: application/json" `

  password="password123"  -H "Authorization: Bearer $TOKEN" `

} | ConvertTo-Json  -d '{

    "titulo": "Escapada a París - Junio 2025"

$register = Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -ContentType "application/json" -Body $regBody  }'

``````



**Response Exitoso (201):****Respuesta esperada:**

```json```json

{{

  "user": {  "success": true,

    "id": 1,  "data": {

    "fullName": "Usuario Test",    "id": 1,

    "email": "test@example.com",    "userId": 1,

    "role": "user"    "planRequestId": 1,

  },    "titulo": "Escapada a París - Junio 2025",

  "accessToken": "eyJhbGc...",    "descripcion": null,

  "refreshToken": "eyJhbGc..."    "fechaInicio": "2025-06-15",

}    "fechaFin": "2025-06-20",

```    "dias": [

      {

**Validaciones:**        "numero": 1,

- Email debe ser único        "fecha": "2025-06-15",

- Password mínimo 6 caracteres        "actividades": []

- fullName requerido      },

      {

#### 1.2 Login        "numero": 2,

        "fecha": "2025-06-16",

**Endpoint:** `POST /auth/login`        "actividades": []

      },

**Request:**      ...

```json    ],

{    "estado": "borrador"

  "email": "test@example.com",  }

  "password": "password123"}

}```

```

**Guardar el ID del itinerario:**

**PowerShell:**```powershell

```powershell$ITINERARY_ID = 1  # Usa el ID que recibiste

$loginBody = @{```

  email="test@example.com"

  password="password123"---

} | ConvertTo-Json

## ✈️ Paso 4: Buscar Vuelos con Amadeus API

$login = Invoke-RestMethod -Uri "http://localhost:4000/auth/login" -Method POST -ContentType "application/json" -Body $loginBody

### 4.1 Búsqueda de vuelos (solo ida)

# Guardar token para requests subsecuentes

$token = $login.accessToken```powershell

$headers = @{"Authorization"="Bearer $token"}curl -X POST http://localhost:4000/integrations/flights/search `

```  -H "Content-Type: application/json" `

  -H "Authorization: Bearer $TOKEN" `

**Response Exitoso (200):**  -d '{

```json    "origen": "MAD",

{    "destino": "CDG",

  "user": {    "fechaSalida": "2025-06-15",

    "id": 1,    "numeroPasajeros": 2,

    "email": "test@example.com",    "cabina": "ECONOMY"

    "name": "",  }'

    "role": "user"```

  },

  "accessToken": "eyJhbGc..."**Respuesta esperada:**

}```json

```{

  "id": "550e8400-e29b-41d4-a716-446655440000",

#### 1.3 Obtener Perfil  "userId": 1,

  "origen": "MAD",

**Endpoint:** `GET /users/profile`  "destino": "CDG",

  "fechaSalida": "2025-06-15",

**PowerShell:**  "numeroPasajeros": 2,

```powershell  "cabina": "ECONOMY",

$profile = Invoke-RestMethod -Uri "http://localhost:4000/users/profile" -Method GET -Headers $headers  "ofertas": [

```    {

      "id": "1",

**Response Exitoso (200):**      "precio": {

```json        "cantidad": 350.50,

{        "moneda": "EUR"

  "id": 1,      },

  "fullName": "Usuario Test",      "segmentos": [

  "email": "test@example.com",        {

  "role": "user"          "origen": "MAD",

}          "destino": "CDG",

```          "salida": "2025-06-15T10:30:00",

          "llegada": "2025-06-15T13:00:00",

---          "aerolinea": "AF",

          "numeroVuelo": "AF1234",

### 📝 2. Planning (Solicitudes de Plan)          "duracion": "PT2H30M",

          "cabina": "ECONOMY"

#### 2.1 Crear Solicitud de Plan        }

      ],

**Endpoint:** `POST /planning/requests`      "disponibilidad": 9,

      "escalas": 0,

**Request:**      "duracionTotal": "PT2H30M"

```json    }

{  ],

  "destination": "Cusco",  "creadaEn": "2025-11-06T16:30:00.000Z"

  "startDate": "2026-02-15",}

  "endDate": "2026-02-20",```

  "budgetAmount": 2000,

  "budgetCurrency": "USD",**Guardar el ID de búsqueda:**

  "interests": ["cultura", "aventura", "gastronomia"]```powershell

}$SEARCH_ID = "550e8400-e29b-41d4-a716-446655440000"  # Usa el ID que recibiste

``````



**PowerShell:**### 4.2 Búsqueda con vuelta (round trip)

```powershell

$planBody = @{```powershell

  destination="Cusco"curl -X POST http://localhost:4000/integrations/flights/search `

  startDate="2026-02-15"  -H "Content-Type: application/json" `

  endDate="2026-02-20"  -H "Authorization: Bearer $TOKEN" `

  budgetAmount=2000  -d '{

  budgetCurrency="USD"    "origen": "MAD",

  interests=@("cultura","aventura","gastronomia")    "destino": "CDG",

} | ConvertTo-Json    "fechaSalida": "2025-06-15",

    "fechaRegreso": "2025-06-20",

$plan = Invoke-RestMethod -Uri "http://localhost:4000/planning/requests" -Method POST -ContentType "application/json" -Headers $headers -Body $planBody    "numeroPasajeros": 2,

    "cabina": "ECONOMY"

# Guardar ID  }'

$planId = $plan.data.id```

```

### 4.3 Verificar cache (ejecuta la misma búsqueda nuevamente)

**Response Exitoso (201):**

```jsonEjecuta el comando 4.1 nuevamente. Deberías obtener:

{- Respuesta instantánea (<50ms)

  "success": true,- Mismos resultados de la primera búsqueda

  "data": {

    "id": 1,---

    "userId": 1,

    "destination": "Cusco",## 📊 Paso 5: Aplicar Filtros y Ordenamiento

    "startDate": "2026-02-15T00:00:00.000Z",

    "endDate": "2026-02-20T00:00:00.000Z",### 5.1 Aplicar filtros a búsqueda

    "budgetAmount": 2000,

    "budgetCurrency": "USD",```powershell

    "interests": ["cultura", "aventura", "gastronomia"],curl -X POST "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/filters" `

    "status": "pending",  -H "Content-Type: application/json" `

    "createdAt": "2025-11-10T20:00:00.000Z"  -H "Authorization: Bearer $TOKEN" `

  }  -d '{

}    "precioMaximo": 400,

```    "escalaMaxima": 0,

    "aerolineas": ["AF", "IB"],

**⚠️ Campos Requeridos:**    "duracionMaxima": "PT4H"

- `destination`, `startDate`, `endDate`, `budgetAmount` son obligatorios  }'

- `startDate` debe ser menor que `endDate````

- `budgetAmount` debe ser positivo

### 5.2 Ordenar ofertas por precio

#### 2.2 Obtener Solicitudes del Usuario

```powershell

**Endpoint:** `GET /planning/requests`curl -X GET "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/sort/PRECIO" `

  -H "Authorization: Bearer $TOKEN"

**PowerShell:**```

```powershell

$requests = Invoke-RestMethod -Uri "http://localhost:4000/planning/requests" -Method GET -Headers $headers**Criterios de ordenamiento disponibles:**

```- `PRECIO` - Más barato primero

- `DURACION` - Más rápido primero

**Response Exitoso (200):**- `ESCALAS` - Menos escalas primero

```json- `SALIDA` - Más temprano primero

{- `LLEGADA` - Llegada más temprana

  "success": true,- `MEJOR_OPCION` - Balance precio/duración

  "data": [

    {### 5.3 Obtener detalle de una oferta específica

      "id": 1,

      "destination": "Cusco",```powershell

      "startDate": "2026-02-15",$OFFER_ID = "1"  # ID de la oferta que quieres ver

      "endDate": "2026-02-20",

      "status": "pending",curl -X GET "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/offers/$OFFER_ID" `

      "budgetAmount": 2000  -H "Authorization: Bearer $TOKEN"

    }```

  ]

}---

```

## 📅 Paso 6: Agregar Vuelo al Itinerario

---

### 6.1 Agregar vuelo directamente desde búsqueda

### 🗓️ 3. Itinerarios

```powershell

#### 3.1 Crear Itinerario desde Plancurl -X POST "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/offers/$OFFER_ID/add-to-itinerary" `

  -H "Content-Type: application/json" `

**⚠️ IMPORTANTE:** El plan debe estar en estado `pending` (NO completado) para crear un itinerario.  -H "Authorization: Bearer $TOKEN" `

  -d "{

**Endpoint:** `POST /itineraries/from-plan/:planRequestId`    \`"itinerarioId\`": $ITINERARY_ID

  }"

**Request:**```

```json

{**Respuesta esperada:**

  "titulo": "Viaje a Cusco - Aventura"```json

}{

```  "mensaje": "Vuelo agregado al itinerario exitosamente",

  "itinerario": {

**PowerShell:**    "id": 1,

```powershell    "titulo": "Escapada a París - Junio 2025"

$itinBody = @{titulo="Viaje a Cusco - Aventura"} | ConvertTo-Json  },

  "actividadesCreadas": [

$itin = Invoke-RestMethod -Uri "http://localhost:4000/itineraries/from-plan/$planId" -Method POST -ContentType "application/json" -Headers $headers -Body $itinBody    {

      "id": 1,

# Guardar ID      "titulo": "Vuelo MAD → CDG",

$itinId = $itin.data.id      "tipo": "VUELO"

```    }

  ]

**Response Exitoso (201):**}

```json```

{

  "success": true,### 6.2 Agregar actividad manualmente al itinerario

  "data": {

    "id": 1,```powershell

    "planRequestId": 1,$DAY_NUMBER = 1  # Día del itinerario (1-6)

    "userId": 1,

    "titulo": "Viaje a Cusco - Aventura",curl -X POST "http://localhost:4000/itineraries/$ITINERARY_ID/days/$DAY_NUMBER/activities" `

    "descripcion": "Itinerario generado para viaje a Cusco",  -H "Content-Type: application/json" `

    "dateRange": {  -H "Authorization: Bearer $TOKEN" `

      "startDate": "2026-02-14",  -d '{

      "endDate": "2026-02-19",    "titulo": "Visita Torre Eiffel",

      "durationDays": 6    "tipo": "VISITA",

    },    "lugar": "Torre Eiffel",

    "dias": [    "horaInicio": "14:00",

      {    "horaFin": "17:00",

        "id": 1,    "costoAmount": 25.50,

        "fecha": "2026-02-14",    "costoCurrency": "EUR",

        "numero": 1,    "notas": "Comprar tickets con anticipación"

        "actividades": [],  }'

        "costoTotal": null,```

        "cantidadActividades": 0

      }**Tipos de actividad válidos:**

    ],- `VUELO` - Vuelos

    "estado": "borrador",- `HOSPEDAJE` - Hoteles, alojamiento

    "costoTotal": {"amount": 0, "currency": "USD"}- `TRANSPORTE` - Taxis, trenes, buses

  }- `VISITA` - Museos, atracciones

}- `RESTAURANTE` - Comidas

```- `COMPRAS` - Shopping

- `ENTRETENIMIENTO` - Shows, eventos

#### 3.2 Agregar Actividad a un Día- `OTRO` - Otros



**Endpoint:** `POST /itineraries/:id/days/:dayNumber/activities`---



**Request:**## 📋 Paso 7: Gestionar Itinerario

```json

{### 7.1 Ver itinerario completo

  "titulo": "Visita a Machu Picchu",

  "tipo": "VISITA",```powershell

  "lugar": {curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID" `

    "label": "Machu Picchu",  -H "Authorization: Bearer $TOKEN"

    "latitude": -13.1631,```

    "longitude": -72.5450

  },### 7.2 Ver resumen financiero

  "horaInicio": "2026-02-15T08:00:00Z",

  "horaFin": "2026-02-15T14:00:00Z",```powershell

  "costoAmount": 150,curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/financial-summary" `

  "costoCurrency": "USD",  -H "Authorization: Bearer $TOKEN"

  "notas": "Incluye guía turístico"```

}

```**Respuesta esperada:**

```json

**PowerShell:**{

```powershell  "success": true,

$actBody = @{  "data": {

  titulo="Visita a Machu Picchu"    "costoTotal": {

  tipo="VISITA"      "amount": 876.00,

  lugar=@{      "currency": "EUR"

    label="Machu Picchu"    },

    latitude=-13.1631    "costoPorDia": [

    longitude=-72.5450      {

  }        "dia": 1,

  horaInicio="2026-02-15T08:00:00Z"        "costo": {

  horaFin="2026-02-15T14:00:00Z"          "amount": 375.50,

  costoAmount=150          "currency": "EUR"

  costoCurrency="USD"        }

  notas="Incluye guía turístico"      }

} | ConvertTo-Json -Depth 5    ],

    "costoPorTipo": [

$activity = Invoke-RestMethod -Uri "http://localhost:4000/itineraries/$itinId/days/1/activities" -Method POST -ContentType "application/json" -Headers $headers -Body $actBody      {

```        "tipo": "VUELO",

        "total": {

**Tipos de Actividad Válidos:**          "amount": 350.50,

- `VUELO`          "currency": "EUR"

- `HOSPEDAJE`        },

- `VISITA`        "cantidad": 1

- `TRANSPORTE`      }

- `COMIDA`    ],

- `ACTIVIDAD`    "presupuestoRestante": {

- `OTROS`      "amount": 624.00,

      "currency": "EUR"

**Response Exitoso (201):**    },

```json    "porcentajeUsado": 58.4

{  }

  "success": true,}

  "data": {```

    "id": 1,

    "titulo": "Visita a Machu Picchu",### 7.3 Validar horarios (detectar solapes)

    "tipo": "VISITA",

    "estado": "propuesta",```powershell

    "costo": {"amount": 150, "currency": "USD"}curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/schedule-validation" `

  }  -H "Authorization: Bearer $TOKEN"

}```

```

### 7.4 Ver reporte de ocupación

#### 3.3 Obtener Itinerario Completo

```powershell

**Endpoint:** `GET /itineraries/:id`curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/occupancy-report" `

  -H "Authorization: Bearer $TOKEN"

**PowerShell:**```

```powershell

$itinerario = Invoke-RestMethod -Uri "http://localhost:4000/itineraries/$itinId" -Method GET -Headers $headers### 7.5 Actualizar información del itinerario

```

```powershell

**Response Exitoso (200):**curl -X PATCH "http://localhost:4000/itineraries/$ITINERARY_ID" `

```json  -H "Content-Type: application/json" `

{  -H "Authorization: Bearer $TOKEN" `

  "success": true,  -d '{

  "data": {    "titulo": "Viaje Romántico a París",

    "id": 1,    "descripcion": "Escapada de 6 días con mi pareja"

    "titulo": "Viaje a Cusco - Aventura",  }'

    "dias": [...],```

    "costoTotal": {"amount": 150, "currency": "USD"},

    "resumenActividades": {### 7.6 Publicar itinerario

      "total": 1,

      "confirmadas": 0,```powershell

      "propuestas": 1,curl -X PATCH "http://localhost:4000/itineraries/$ITINERARY_ID/publish" `

      "canceladas": 0  -H "Authorization: Bearer $TOKEN"

    }```

  }

}---

```

## 🤝 Paso 8: Compartir Itinerario

---

### 8.1 Compartir con otro usuario

### ✈️ 4. Integración Amadeus (Búsqueda de Vuelos)

```powershell

#### ⚠️ CAMPOS CORRECTOS - Usar Siemprecurl -X POST http://localhost:4000/sharing/share `

  -H "Content-Type: application/json" `

Los campos correctos según el dominio son:  -H "Authorization: Bearer $TOKEN" `

- ✅ `fechaSalida` (NO fechaIda)  -d "{

- ✅ `fechaRegreso` (NO fechaVuelta)    \`"itinerarioId\`": $ITINERARY_ID,

- ✅ `numeroPasajeros` (NO adultos)    \`"compartidoConEmail\`": \`"amigo@example.com\`",

- ✅ Response: `id` (NO busquedaId)    \`"permiso\`": \`"LECTOR\`",

- ✅ Response: `numeroResultados` (NO totalResultados)    \`"mensaje\`": \`"¡Mira nuestro plan para París!\`",

    \`"diasValidez\`": 7

#### 4.1 Buscar Vuelos  }"

```

**Endpoint:** `POST /integrations/flights/search`

**Niveles de permiso:**

**Request:**- `PROPIETARIO` - Control total (solo el creador)

```json- `EDITOR` - Puede modificar

{- `LECTOR` - Solo visualización

  "origen": "LIM",

  "destino": "CUZ",**Respuesta esperada:**

  "fechaSalida": "2026-02-15",```json

  "fechaRegreso": "2026-02-20",{

  "numeroPasajeros": 1,  "success": true,

  "cabina": "ECONOMY"  "data": {

}    "id": 1,

```    "itinerarioId": 1,

    "propietarioId": 1,

**PowerShell:**    "compartidoConEmail": "amigo@example.com",

```powershell    "permiso": "LECTOR",

$searchBody = @{    "estado": "PENDIENTE",

  origen="LIM"    "linkComparticion": "abc123xyz456...",

  destino="CUZ"    "expiraEn": "2025-11-13T16:30:00.000Z",

  fechaSalida="2026-02-15"    "mensaje": "¡Mira nuestro plan para París!"

  fechaRegreso="2026-02-20"  }

  numeroPasajeros=1}

  cabina="ECONOMY"```

} | ConvertTo-Json

**Guardar el token del link:**

$search = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/search" -Method POST -ContentType "application/json" -Headers $headers -Body $searchBody```powershell

$SHARE_TOKEN = "abc123xyz456..."  # Del campo linkComparticion

# Guardar ID correcto$SHARE_ID = 1  # Del campo id

$searchId = $search.id  # ⚠️ NO usar busquedaId```

Write-Host "Search ID: $searchId"

Write-Host "Total ofertas: $($search.numeroResultados)"  # ⚠️ NO usar totalResultados### 8.2 Ver información de compartición (antes de aceptar)

```

```powershell

**Códigos IATA Válidos (Perú):**curl -X GET "http://localhost:4000/sharing/link/$SHARE_TOKEN"

- `LIM` - Lima (Jorge Chávez)```

- `CUZ` - Cusco

- `AQP` - Arequipa### 8.3 Aceptar compartición (como receptor)

- `TRU` - Trujillo

- `PIU` - Piura```powershell

# El receptor debe iniciar sesión con su cuenta

**Cabinas Válidas:**curl -X POST "http://localhost:4000/sharing/accept/$SHARE_TOKEN" `

- `ECONOMY`  -H "Authorization: Bearer $TOKEN_RECEPTOR"

- `PREMIUM_ECONOMY````

- `BUSINESS`

- `FIRST`### 8.4 Listar itinerarios compartidos por mí



**Response Exitoso (200):**```powershell

```jsoncurl -X GET http://localhost:4000/sharing/shared-by-me `

{  -H "Authorization: Bearer $TOKEN"

  "id": "search_1762809225520_rfc28c7xl",```

  "origen": {"code": "LIM", "city": "Lima"},

  "destino": {"code": "CUZ", "city": "Cusco"},### 8.5 Listar itinerarios compartidos conmigo

  "fechaSalida": "2026-02-15T00:00:00.000Z",

  "fechaRegreso": "2026-02-20T00:00:00.000Z",```powershell

  "ofertas": [curl -X GET http://localhost:4000/sharing/shared-with-me `

    {  -H "Authorization: Bearer $TOKEN"

      "id": "offer_1",```

      "precio": {"amount": 250.50, "currency": "USD"},

      "numeroEscalas": 0,### 8.6 Ver todas las comparticiones de un itinerario

      "duracionTotal": 90,

      "segmentos": [...]```powershell

    }curl -X GET "http://localhost:4000/sharing/itinerary/$ITINERARY_ID" `

  ],  -H "Authorization: Bearer $TOKEN"

  "numeroResultados": 50,```

  "estaCacheValido": true,

  "expiraEn": "2025-11-10T21:00:00.000Z"### 8.7 Actualizar permisos

}

``````powershell

curl -X PATCH "http://localhost:4000/sharing/$SHARE_ID/permission" `

#### 4.2 Aplicar Filtros  -H "Content-Type: application/json" `

  -H "Authorization: Bearer $TOKEN" `

**Endpoint:** `POST /integrations/flights/searches/:searchId/filters`  -d '{

    "permiso": "EDITOR"

**Request:**  }'

```json```

{

  "precioMaximo": 500,### 8.8 Renovar link de compartición

  "escalasMaximas": 1,

  "aerolineas": ["LA", "AV"],```powershell

  "duracionMaxima": 180curl -X PATCH "http://localhost:4000/sharing/$SHARE_ID/renew" `

}  -H "Content-Type: application/json" `

```  -H "Authorization: Bearer $TOKEN" `

  -d '{

**PowerShell:**    "diasValidez": 14

```powershell  }'

$filterBody = @{```

  precioMaximo=500

  escalasMaximas=1### 8.9 Revocar acceso

} | ConvertTo-Json

```powershell

$filtered = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$searchId/filters" -Method POST -ContentType "application/json" -Headers $headers -Body $filterBodycurl -X DELETE "http://localhost:4000/sharing/$SHARE_ID/revoke" `

  -H "Authorization: Bearer $TOKEN"

Write-Host "Filtros aplicados: $($filtered.totalResultados) results"```

```

### 8.10 Verificar permisos del usuario

**Response Exitoso (200):**

```json```powershell

{curl -X GET "http://localhost:4000/sharing/permissions/$ITINERARY_ID" `

  "busquedaId": "search_1762809225520_rfc28c7xl",  -H "Authorization: Bearer $TOKEN"

  "ofertasFiltradas": [...],```

  "filtrosAplicados": {

    "precioMaximo": 500,### 8.11 Obtener estadísticas de compartición

    "escalasMaximas": 1

  },```powershell

  "totalResultados": 25curl -X GET http://localhost:4000/sharing/stats `

}  -H "Authorization: Bearer $TOKEN"

``````



#### 4.3 Ordenar Ofertas---



**Endpoint:** `GET /integrations/flights/searches/:searchId/sort/:criterio`## 📊 Paso 9: Monitoreo y Estadísticas



**Criterios de Ordenamiento Válidos:**### 9.1 Ver historial de búsquedas de vuelos

- `PRECIO` - Menor a mayor precio

- `DURACION` - Menor duración primero```powershell

- `MEJOR_VALORADO` - Mejor balance precio/calidadcurl -X GET "http://localhost:4000/integrations/flights/searches?limit=10" `

  -H "Authorization: Bearer $TOKEN"

**PowerShell:**```

```powershell

# Ordenar por precio### 9.2 Ver estado de integraciones

$sortedPrecio = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$searchId/sort/PRECIO" -Method GET -Headers $headers

Write-Host "Ordenado por PRECIO: $($sortedPrecio.totalResultados) results"```powershell

curl -X GET http://localhost:4000/integrations/status `

# Ordenar por duración  -H "Authorization: Bearer $TOKEN"

$sortedDuracion = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$searchId/sort/DURACION" -Method GET -Headers $headers```

Write-Host "Ordenado por DURACION: $($sortedDuracion.totalResultados) results"

**Respuesta esperada:**

# Ordenar por mejor valorado```json

$sortedMejor = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$searchId/sort/MEJOR_VALORADO" -Method GET -Headers $headers{

Write-Host "Ordenado por MEJOR_VALORADO: $($sortedMejor.totalResultados) results"  "integraciones": {

```    "amadeus": {

      "disponible": true,

**Response Exitoso (200):**      "ultimaVerificacion": "2025-11-06T16:45:00.000Z"

```json    }

{  },

  "busquedaId": "search_1762809225520_rfc28c7xl",  "cache": {

  "ofertas": [...],    "totalBusquedas": 5,

  "criterioOrden": "PRECIO",    "enCache": 3,

  "totalResultados": 50    "hitRate": 0.6

}  }

```}

```

---

### 9.3 Ver todas mis solicitudes de plan

### 📊 5. Google Sheets (Exportación)

```powershell

#### ⚠️ IMPORTANTE - Estrategia de Templatecurl -X GET http://localhost:4000/planning/requests `

  -H "Authorization: Bearer $TOKEN"

Actualmente el sistema usa un template público que se actualiza directamente. **No crea copias** debido a que el proyecto Google Cloud no tiene cuenta de facturación configurada.```



**Template ID:** `1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw`  ### 9.4 Ver todos mis itinerarios

**Service Account:** `travelsia-sheets-service@travelsia-backend.iam.gserviceaccount.com`

```powershell

#### 5.1 Verificar Estado del Serviciocurl -X GET http://localhost:4000/itineraries `

  -H "Authorization: Bearer $TOKEN"

**Endpoint:** `GET /sheets/status````



**PowerShell:**---

```powershell

$status = Invoke-RestMethod -Uri "http://localhost:4000/sheets/status" -Method GET -Headers $headers## 🔄 Paso 10: Gestión de Sesión

```

### 10.1 Refrescar token (cuando expire)

**Response Exitoso (200):**

```json```powershell

{$REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Tu refresh token

  "status": "connected",

  "serviceAccountEmail": "travelsia-sheets-service@travelsia-backend.iam.gserviceaccount.com",curl -X POST http://localhost:4000/auth/refresh `

  "templateId": "1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw"  -H "Content-Type: application/json" `

}  -d "{

```    \`"refreshToken\`": \`"$REFRESH_TOKEN\`"

  }"

#### 5.2 Exportar Itinerario a Google Sheets```



**Endpoint:** `POST /sheets/export/:itineraryId`**Respuesta:**

```json

**PowerShell:**{

```powershell  "accessToken": "nuevo_access_token...",

$export = Invoke-RestMethod -Uri "http://localhost:4000/sheets/export/$itinId" -Method POST -Headers $headers  "refreshToken": "nuevo_refresh_token..."

}

Write-Host "Spreadsheet exportado:"```

Write-Host "URL: $($export.spreadsheetUrl)"

Write-Host "ID: $($export.spreadsheetId)"**Actualizar token:**

``````powershell

$TOKEN = "nuevo_access_token..."

**Response Exitoso (200):**```

```json

{### 10.2 Cerrar sesión

  "spreadsheetId": "1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw",

  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw",```powershell

  "serviceAccountEmail": "travelsia-sheets-service@travelsia-backend.iam.gserviceaccount.com",curl -X POST http://localhost:4000/auth/logout `

  "note": "Template actualizado directamente (versión sin copias)"  -H "Content-Type: application/json" `

}  -d "{

```    \`"refreshToken\`": \`"$REFRESH_TOKEN\`"

  }"

**Hojas del Spreadsheet:**```

1. **Resumen** - Información general del itinerario (título, fechas, presupuesto)

2. **Días** - Lista de días con fecha, actividades y costo diario---

3. **Actividades** - Detalle completo de cada actividad (tipo, lugar, horario, costo)

4. **Presupuesto** - Desglose de costos por tipo de actividad## 🎯 Flujo Completo de Ejemplo



#### 5.3 Obtener Info de ExportaciónAquí está todo el flujo en secuencia:



**Endpoint:** `GET /sheets/itinerary/:itineraryId````powershell

# 1. Registrar usuario

**PowerShell:**curl -X POST http://localhost:4000/auth/register `

```powershell  -H "Content-Type: application/json" `

$sheetInfo = Invoke-RestMethod -Uri "http://localhost:4000/sheets/itinerary/$itinId" -Method GET -Headers $headers  -d '{"name":"María García","email":"maria@example.com","password":"Pass1234!","role":"user"}'

```

# Guardar token

**Response Exitoso (200):**$TOKEN = "tu_access_token_aqui"

```json

{# 2. Crear solicitud de plan

  "spreadsheetId": "1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw",curl -X POST http://localhost:4000/planning/requests `

  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",  -H "Content-Type: application/json" `

  "createdAt": "2025-11-10T20:00:00.000Z",  -H "Authorization: Bearer $TOKEN" `

  "updatedAt": "2025-11-10T20:30:00.000Z"  -d '{"destination":"Barcelona, España","startDate":"2025-07-01","endDate":"2025-07-05","budgetAmount":800,"budgetCurrency":"EUR","interests":["playa","arquitectura"]}'

}

```# Guardar ID (ej: 1)

$PLAN_ID = 1

#### 5.4 Sincronizar Sheet (Forzar Actualización)

# 3. Crear itinerario

**Endpoint:** `PUT /sheets/sync/:itineraryId`curl -X POST "http://localhost:4000/itineraries/from-plan/$PLAN_ID" `

  -H "Content-Type: application/json" `

**PowerShell:**  -H "Authorization: Bearer $TOKEN" `

```powershell  -d '{"titulo":"Verano en Barcelona"}'

$sync = Invoke-RestMethod -Uri "http://localhost:4000/sheets/sync/$itinId" -Method PUT -Headers $headers

```# Guardar ID (ej: 1)

$ITINERARY_ID = 1

#### 5.5 Listar Mis Sheets

# 4. Buscar vuelos

**Endpoint:** `GET /sheets/my-sheets`curl -X POST http://localhost:4000/integrations/flights/search `

  -H "Content-Type: application/json" `

**PowerShell:**  -H "Authorization: Bearer $TOKEN" `

```powershell  -d '{"origen":"MAD","destino":"BCN","fechaSalida":"2025-07-01","numeroPasajeros":1,"cabina":"ECONOMY"}'

$mySheets = Invoke-RestMethod -Uri "http://localhost:4000/sheets/my-sheets" -Method GET -Headers $headers

```# Guardar IDs

$SEARCH_ID = "uuid-de-busqueda"

#### 5.6 Desvincular Sheet$OFFER_ID = "1"



**Endpoint:** `DELETE /sheets/unlink/:itineraryId`# 5. Agregar vuelo al itinerario

curl -X POST "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/offers/$OFFER_ID/add-to-itinerary" `

**PowerShell:**  -H "Content-Type: application/json" `

```powershell  -H "Authorization: Bearer $TOKEN" `

Invoke-RestMethod -Uri "http://localhost:4000/sheets/unlink/$itinId" -Method DELETE -Headers $headers  -d "{\`"itinerarioId\`":$ITINERARY_ID}"

```

# 6. Agregar actividad

---curl -X POST "http://localhost:4000/itineraries/$ITINERARY_ID/days/1/activities" `

  -H "Content-Type: application/json" `

### 🔗 6. Compartición de Itinerarios  -H "Authorization: Bearer $TOKEN" `

  -d '{"titulo":"Visita Sagrada Familia","tipo":"VISITA","lugar":"Sagrada Familia","horaInicio":"10:00","horaFin":"12:30","costoAmount":26,"costoCurrency":"EUR"}'

#### 6.1 Generar Link de Compartición

# 7. Ver resumen financiero

**Endpoint:** `POST /sharing/itineraries/:itineraryId/share`curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/financial-summary" `

  -H "Authorization: Bearer $TOKEN"

**Request:**

```json# 8. Publicar itinerario

{curl -X PATCH "http://localhost:4000/itineraries/$ITINERARY_ID/publish" `

  "permiso": "VIEW"  -H "Authorization: Bearer $TOKEN"

}

```# 9. Compartir con amigo

curl -X POST http://localhost:4000/sharing/share `

**Permisos Válidos:**  -H "Content-Type: application/json" `

- `VIEW` - Solo lectura  -H "Authorization: Bearer $TOKEN" `

- `EDIT` - Puede editar  -d "{\`"itinerarioId\`":$ITINERARY_ID,\`"compartidoConEmail\`":\`"amigo@example.com\`",\`"permiso\`":\`"LECTOR\`",\`"mensaje\`":\`"¡Únete a mi viaje!\`"}"

```

**PowerShell:**

```powershell---

$shareBody = @{permiso="VIEW"} | ConvertTo-Json

## 🐛 Solución de Problemas

$share = Invoke-RestMethod -Uri "http://localhost:4000/sharing/itineraries/$itinId/share" -Method POST -ContentType "application/json" -Headers $headers -Body $shareBody

### Error: "Cannot POST /..."

# Guardar token- **Causa:** URL incorrecta

$shareToken = $share.token- **Solución:** Verifica que estés usando el puerto 4000 y la ruta correcta

Write-Host "Link generado: $($share.linkComparticion)"

```### Error: "Faltan campos requeridos"

- **Causa:** Falta algún campo obligatorio

**Response Exitoso (201):**- **Solución:** Revisa la lista de campos requeridos en cada endpoint

```json

{### Error: Unauthorized

  "linkComparticion": "https://travelsia.app/shared/abc123xyz",- **Causa:** Token expirado o inválido

  "token": "abc123xyz",- **Solución:** Refresca el token con `/auth/refresh`

  "permiso": "VIEW",

  "expiraEn": "2025-12-10T20:00:00.000Z"### Error: "No tiene permisos"

}- **Causa:** Intentando acceder a recurso de otro usuario

```- **Solución:** Verifica que el recurso pertenezca a tu usuario



#### 6.2 Acceder a Itinerario Compartido (Público)### Error de Amadeus API

- **Causa:** Credenciales incorrectas o API caída

**Endpoint:** `GET /sharing/public/:token`- **Solución:** Verifica `AMADEUS_CLIENT_ID` y `AMADEUS_CLIENT_SECRET` en `.env`



**PowerShell:**---

```powershell

# ⚠️ NO requiere autenticación## ✅ Checklist de Testing Completo

$public = Invoke-RestMethod -Uri "http://localhost:4000/sharing/public/$shareToken" -Method GET

```### Configuración

- [ ] `.env` configurado correctamente

**Response Exitoso (200):**- [ ] Base de datos corriendo

```json- [ ] Migraciones ejecutadas

{- [ ] Servidor en puerto 4000

  "itinerario": {

    "titulo": "Viaje a Cusco - Aventura",### Autenticación

    "dias": [...],- [ ] Registro exitoso

    "propietario": {- [ ] Login exitoso

      "nombre": "Usuario Test"- [ ] Refresh token funciona

    }- [ ] Logout funciona

  },

  "permiso": "VIEW",### Planificación

  "expiraEn": "2025-12-10T20:00:00.000Z"- [ ] Crear solicitud de plan

}- [ ] Listar solicitudes

```- [ ] Ver solicitud específica



---### Itinerarios

- [ ] Crear itinerario desde plan

## Scripts Automatizados- [ ] Listar itinerarios

- [ ] Ver itinerario completo

### Script de Testing Completo- [ ] Agregar actividades

- [ ] Actualizar actividades

Guarda como `test_complete.ps1`:- [ ] Eliminar actividades

- [ ] Ver resumen financiero

```powershell- [ ] Validar horarios

Write-Host "=== TRAVELSIA BACKEND - TEST COMPLETO ===" -ForegroundColor Cyan- [ ] Publicar itinerario

Write-Host ""

### Vuelos (Amadeus)

$baseUrl = "http://localhost:4000"- [ ] Buscar vuelos (solo ida)

$testResults = @()- [ ] Buscar vuelos (ida y vuelta)

- [ ] Cache funciona correctamente

function Add-TestResult {- [ ] Aplicar filtros

    param($name, $success, $message)- [ ] Ordenar resultados

    $testResults += [PSCustomObject]@{- [ ] Ver detalle de oferta

        Test = $name- [ ] Agregar vuelo a itinerario

        Success = $success

        Message = $message### Compartición

    }- [ ] Compartir itinerario

}- [ ] Ver link de compartición

- [ ] Aceptar compartición

# 1. AUTENTICACION- [ ] Listar compartidos por mí

Write-Host "1. Testing Autenticación..." -ForegroundColor Yellow- [ ] Listar compartidos conmigo

- [ ] Actualizar permisos

# 1.1 Registro- [ ] Renovar link

try {- [ ] Revocar acceso

    $regBody = @{fullName="Usuario Test";email="test@example.com";password="password123"} | ConvertTo-Json

    $register = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $regBody---

    Add-TestResult "Registro" $true "Usuario creado"

} catch {## 📚 Códigos IATA Útiles

    if ($_.Exception.Message -like "*409*") {

        Add-TestResult "Registro" $true "Usuario ya existe"### España

    } else {- `MAD` - Madrid

        Add-TestResult "Registro" $false $_.Exception.Message- `BCN` - Barcelona

    }- `AGP` - Málaga

}- `PMI` - Palma de Mallorca

- `SVQ` - Sevilla

# 1.2 Login

try {### Francia

    $loginBody = @{email="test@example.com";password="password123"} | ConvertTo-Json- `CDG` - París Charles de Gaulle

    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody- `ORY` - París Orly

    $token = $login.accessToken- `NCE` - Niza

    $headers = @{"Authorization"="Bearer $token"}- `LYS` - Lyon

    Add-TestResult "Login" $true "Token obtenido"

} catch {### Italia

    Add-TestResult "Login" $false $_.Exception.Message- `FCO` - Roma Fiumicino

    exit 1- `MXP` - Milán Malpensa

}- `VCE` - Venecia



# 2. PLANNING### Reino Unido

Write-Host "2. Testing Planning..." -ForegroundColor Yellow- `LHR` - Londres Heathrow

- `LGW` - Londres Gatwick

try {

    $planBody = @{---

        destination="Cusco"

        startDate="2026-02-15"## 🎉 ¡Testing Completo!

        endDate="2026-02-20"

        budgetAmount=2000Has completado el flujo completo de testing del backend de Travelsia. Ahora puedes:

        budgetCurrency="USD"

        interests=@("cultura","aventura")1. ✅ Registrar usuarios

    } | ConvertTo-Json2. ✅ Crear planes de viaje

    3. ✅ Generar itinerarios

    $plan = Invoke-RestMethod -Uri "$baseUrl/planning/requests" -Method POST -ContentType "application/json" -Headers $headers -Body $planBody4. ✅ Buscar vuelos reales con Amadeus

    $planId = $plan.data.id5. ✅ Agregar actividades

    Add-TestResult "Crear Plan" $true "Plan ID: $planId"6. ✅ Gestionar presupuestos

} catch {7. ✅ Compartir con otros usuarios

    Add-TestResult "Crear Plan" $false $_.Exception.Message

    exit 1**¡Feliz Testing! 🚀**

}

# 3. ITINERARIOS
Write-Host "3. Testing Itinerarios..." -ForegroundColor Yellow

try {
    $itinBody = @{titulo="Viaje a Cusco - Test"} | ConvertTo-Json
    $itin = Invoke-RestMethod -Uri "$baseUrl/itineraries/from-plan/$planId" -Method POST -ContentType "application/json" -Headers $headers -Body $itinBody
    $itinId = $itin.data.id
    Add-TestResult "Crear Itinerario" $true "Itinerario ID: $itinId"
} catch {
    Add-TestResult "Crear Itinerario" $false $_.Exception.Message
    exit 1
}

# 3.2 Agregar Actividad
try {
    $actBody = @{
        titulo="Visita a Machu Picchu"
        tipo="VISITA"
        lugar=@{label="Machu Picchu";latitude=-13.1631;longitude=-72.5450}
        horaInicio="2026-02-15T08:00:00Z"
        horaFin="2026-02-15T14:00:00Z"
        costoAmount=150
        costoCurrency="USD"
    } | ConvertTo-Json -Depth 5
    
    Invoke-RestMethod -Uri "$baseUrl/itineraries/$itinId/days/1/activities" -Method POST -ContentType "application/json" -Headers $headers -Body $actBody | Out-Null
    Add-TestResult "Agregar Actividad" $true "Actividad agregada al día 1"
} catch {
    Add-TestResult "Agregar Actividad" $false $_.Exception.Message
}

# 4. VUELOS
Write-Host "4. Testing Búsqueda de Vuelos..." -ForegroundColor Yellow

try {
    $searchBody = @{
        origen="LIM"
        destino="CUZ"
        fechaSalida="2026-02-15"
        fechaRegreso="2026-02-20"
        numeroPasajeros=1
        cabina="ECONOMY"
    } | ConvertTo-Json
    
    $search = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/search" -Method POST -ContentType "application/json" -Headers $headers -Body $searchBody
    $searchId = $search.id
    Add-TestResult "Búsqueda Vuelos" $true "Search ID: $searchId, Ofertas: $($search.numeroResultados)"
    
    # 4.1 Filtros
    try {
        $filterBody = @{precioMaximo=500;escalasMaximas=1} | ConvertTo-Json
        $filtered = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/searches/$searchId/filters" -Method POST -ContentType "application/json" -Headers $headers -Body $filterBody
        Add-TestResult "Aplicar Filtros" $true "Filtrados: $($filtered.totalResultados)"
    } catch {
        Add-TestResult "Aplicar Filtros" $false $_.Exception.Message
    }
    
    # 4.2 Ordenamiento
    try {
        $sorted = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/searches/$searchId/sort/PRECIO" -Method GET -Headers $headers
        Add-TestResult "Ordenar Vuelos" $true "Ordenados: $($sorted.totalResultados)"
    } catch {
        Add-TestResult "Ordenar Vuelos" $false $_.Exception.Message
    }
    
} catch {
    Add-TestResult "Búsqueda Vuelos" $false $_.Exception.Message
}

# 5. GOOGLE SHEETS
Write-Host "5. Testing Google Sheets..." -ForegroundColor Yellow

try {
    $export = Invoke-RestMethod -Uri "$baseUrl/sheets/export/$itinId" -Method POST -Headers $headers
    Add-TestResult "Exportar a Sheets" $true "Spreadsheet: $($export.spreadsheetId)"
    Write-Host "   URL: $($export.spreadsheetUrl)" -ForegroundColor Gray
} catch {
    Add-TestResult "Exportar a Sheets" $false $_.Exception.Message
}

# 6. COMPARTICION
Write-Host "6. Testing Compartición..." -ForegroundColor Yellow

try {
    $shareBody = @{permiso="VIEW"} | ConvertTo-Json
    $share = Invoke-RestMethod -Uri "$baseUrl/sharing/itineraries/$itinId/share" -Method POST -ContentType "application/json" -Headers $headers -Body $shareBody
    Add-TestResult "Generar Link" $true "Token: $($share.token)"
    
    # Acceder públicamente
    try {
        $public = Invoke-RestMethod -Uri "$baseUrl/sharing/public/$($share.token)" -Method GET
        Add-TestResult "Acceder Público" $true "Itinerario compartido accesible"
    } catch {
        Add-TestResult "Acceder Público" $false $_.Exception.Message
    }
} catch {
    Add-TestResult "Generar Link" $false $_.Exception.Message
}

# RESUMEN
Write-Host "`n=== RESUMEN DE PRUEBAS ===" -ForegroundColor Cyan
$testResults | Format-Table -AutoSize

$passed = ($testResults | Where-Object {$_.Success}).Count
$total = $testResults.Count
$percentage = [math]::Round(($passed / $total) * 100, 2)

Write-Host "`nResultado: $passed/$total pruebas exitosas ($percentage%)" -ForegroundColor $(if($passed -eq $total){"Green"}else{"Yellow"})
Write-Host ""
```

### Ejecutar el Test Completo

```powershell
# PowerShell (Windows)
.\test_complete.ps1

# O con ejecución explícita
powershell -ExecutionPolicy Bypass -File .\test_complete.ps1
```

---

## Solución de Problemas

### Error: "Token requerido"
- Verificar que el header `Authorization: Bearer {token}` está presente
- Verificar que el token no ha expirado (TTL: 15 minutos)
- Renovar token con `/auth/refresh` si es necesario

### Error: "Solo se puede marcar como borrador generado desde el estado pendiente"
- **NO** completar el plan antes de crear el itinerario
- El plan debe estar en estado `pending`
- Verificar el estado con `GET /planning/requests`

### Error: "Tipo de actividad inválido"
- Usar solo tipos válidos: `VUELO`, `HOSPEDAJE`, `VISITA`, `TRANSPORTE`, `COMIDA`, `ACTIVIDAD`, `OTROS`
- Verificar que el tipo está en mayúsculas

### Error: "The caller does not have permission" (Google Sheets)
- Verificar que el template está compartido con la Service Account
- Email: `travelsia-sheets-service@travelsia-backend.iam.gserviceaccount.com`
- Permiso requerido: Editor
- Verificar `GOOGLE_SHEETS_TEMPLATE_ID` en `.env`

### Error: "La búsqueda ha expirado"
- Las búsquedas de vuelos expiran después de 1 hora
- Crear una nueva búsqueda con `POST /integrations/flights/search`

### Error: "Origen, destino y fecha de salida son requeridos"
- Verificar que usas `fechaSalida` (NO fechaIda)
- Verificar que usas `fechaRegreso` (NO fechaVuelta)
- Verificar que usas `numeroPasajeros` (NO adultos)

### Error: "Cannot POST /integrations/flights/searches//filters"
- El searchId está vacío
- Verificar que extraes el campo correcto: `$search.id` (NO busquedaId)

### Error conexión Amadeus
- Verificar credenciales en `.env`
- Verificar que `AMADEUS_TEST_MODE=true`
- Las credenciales de test tienen límites de rate (1 request/segundo)

---

## ✅ Checklist de Verificación

Antes de considerar el sistema listo:

### Configuración
- [ ] Base de datos creada y migrada
- [ ] Todas las variables de entorno configuradas en `.env`
- [ ] Servidor inicia sin errores
- [ ] Google Sheets Adapter se inicializa correctamente
- [ ] Template de Google Sheets compartido con Service Account

### Autenticación
- [ ] Usuario puede registrarse
- [ ] Usuario puede hacer login
- [ ] Token se devuelve correctamente
- [ ] Endpoints protegidos requieren token
- [ ] Token expira después de 15 minutos

### Planning
- [ ] Puede crear planes de viaje
- [ ] Validaciones de fechas funcionan
- [ ] Puede listar planes del usuario
- [ ] Budget se calcula por día correctamente

### Itinerarios
- [ ] Puede crear itinerarios desde planes
- [ ] Itinerarios generan días automáticamente
- [ ] Puede agregar actividades a días
- [ ] Validaciones de horarios funcionan
- [ ] Costo total se calcula correctamente

### Vuelos (Amadeus)
- [ ] Búsqueda de vuelos funciona (con credenciales válidas)
- [ ] Caché funciona correctamente (respuestas <50ms)
- [ ] Filtros de vuelos funcionan
- [ ] Ordenamiento de vuelos funciona (PRECIO, DURACION, MEJOR_VALORADO)
- [ ] Búsquedas expiran después de 1 hora

### Google Sheets
- [ ] Estado del servicio devuelve "connected"
- [ ] Exportación a Google Sheets funciona
- [ ] Template se actualiza correctamente
- [ ] 4 hojas se generan (Resumen, Días, Actividades, Presupuesto)
- [ ] Formato de celdas se aplica correctamente

### Compartición
- [ ] Puede generar links de compartición
- [ ] Links compartidos son accesibles sin autenticación
- [ ] Permisos VIEW y EDIT funcionan
- [ ] Links expiran correctamente

---

## 📝 Notas Adicionales

### Limitaciones Conocidas

1. **Google Sheets - Estrategia de Template**
   - El sistema actualiza el template directamente en lugar de crear copias
   - Motivo: Google Cloud requiere cuenta de facturación para crear nuevos archivos
   - Todos los usuarios comparten el mismo template (cada export sobrescribe el anterior)
   - Para múltiples exports simultáneos se necesita configurar billing en GCP

2. **Caché de Vuelos**
   - Las búsquedas se cachean por 1 hora
   - Después de 1 hora se marca como expirada pero los datos persisten
   - Use `forzarNuevaBusqueda: true` para forzar una nueva búsqueda

3. **Amadeus Test Mode**
   - Las credenciales de test devuelven datos simulados
   - Límite de rate: 1 request/segundo
   - Para producción cambiar `AMADEUS_TEST_MODE=false`

### Mejores Prácticas

1. **Testing en Orden**
   - Siempre ejecutar en secuencia: auth → planning → itinerary → activities → flights
   - Guardar IDs intermedios para requests subsecuentes

2. **Manejo de Tokens**
   - Guardar accessToken para reutilizar durante 15 minutos
   - Guardar refreshToken para renovar sesión
   - Implementar renovación automática antes de expiración

3. **Campos Correctos**
   - Siempre usar `fechaSalida`, `fechaRegreso`, `numeroPasajeros`
   - Extraer respuestas con `id`, `numeroResultados`
   - Verificar tipos de actividad en mayúsculas

4. **PowerShell JSON**
   - Usar hash tables `@{}` y convertir con `| ConvertTo-Json`
   - Usar `-Depth 5` para objetos anidados
   - NO escribir JSON inline en strings

---

## 🚀 Siguiente Pasos

### 1. Conectar con AppSheet

Una vez que todas las pruebas pasan:

```
1. Exportar un itinerario a Google Sheets
2. Copiar URL del spreadsheet
3. Ir a https://www.appsheet.com/
4. Create → App → Start with existing data
5. Seleccionar Google Sheets
6. Pegar URL del spreadsheet
7. AppSheet detectará las 4 hojas automáticamente
```

### 2. Deploy a Producción

Cambios necesarios para producción:

```env
# Cambiar en .env
AMADEUS_TEST_MODE=false
AMADEUS_BASE_URL=https://api.amadeus.com

# Configurar dominio real
CORS_ORIGIN=https://tu-dominio.com

# Usar secretos fuertes (64 caracteres)
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

**Plataformas recomendadas:**
- Railway (fácil, incluye PostgreSQL)
- Render (tier gratuito disponible)
- Fly.io (global edge deployment)
- Heroku (PostgreSQL incluido)

### 3. Habilitar Facturación en Google Cloud

Para crear copias de spreadsheets en lugar de actualizar template:

```
1. Ir a Google Cloud Console
2. Billing → Link a billing account
3. El tier gratuito cubre 5 millones de operaciones/mes
4. Modificar GoogleSheetsAdapter para crear copias
```

### 4. Monitoreo y Logging

Configurar para producción:

- Winston para logging estructurado
- Sentry para error tracking
- New Relic o Datadog para APM
- CloudWatch (AWS) o Stackdriver (GCP) para logs

---

**Última actualización:** 10 de Noviembre, 2025  
**Versión:** 2.0.0  
**Estado:** ✅ Todos los endpoints verificados y funcionando
