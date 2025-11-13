# 🧪 Guía Completa de Testing - Travelsia Backend

> **Versión:** 2.0  
> **Última actualización:** Noviembre 2025  
> **Autor:** Equipo Travelsia

---

## 📑 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [Requisitos Previos](#-requisitos-previos)
3. [Configuración Inicial](#%EF%B8%8F-configuración-inicial)
4. [Testing Automatizado](#-testing-automatizado)
5. [Testing Manual](#-testing-manual-thunder-client)
6. [Flujos Completos](#-flujos-de-prueba-completos)
7. [Troubleshooting](#-troubleshooting)
8. [Referencia Rápida](#-referencia-rápida)

---

## 🎯 Introducción

Esta guía te ayudará a probar todas las funcionalidades del backend de Travelsia:

- ✅ **Autenticación** y gestión de usuarios
- ✅ **Planes de viaje** con presupuesto
- ✅ **Itinerarios** con actividades
- ✅ **Búsqueda de vuelos** (Amadeus API)
- ✅ **Exportación** a Google Sheets
- ✅ **Compartición** entre usuarios

---

## ✅ Requisitos Previos

### Software Necesario

| Software | Versión | Verificar |
|----------|---------|-----------|
| **Node.js** | v18+ | `node --version` |
| **PostgreSQL** | v13+ | `psql --version` |
| **PowerShell** | v5.1+ | `$PSVersionTable.PSVersion` |
| **npm** | v8+ | `npm --version` |

### Credenciales API

#### 🔑 Amadeus API (Búsqueda de Vuelos)
- Registrarse en: [developers.amadeus.com](https://developers.amadeus.com)
- Obtener: Client ID + Client Secret
- Modo: Test (gratuito)

#### 🔑 Google Cloud (Google Sheets)
- Crear Service Account en: [console.cloud.google.com](https://console.cloud.google.com)
- Habilitar: Google Sheets API + Google Drive API
- Descargar: JSON key del Service Account

---

## ⚙️ Configuración Inicial

### Paso 1: Instalar Dependencias

```powershell
# Instalar paquetes
npm install
```

### Paso 2: Configurar Variables de Entorno

Crear archivo `.env`:

```env
# SERVER
PORT=4000

# DATABASE
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=tu_password
PG_DATABASE=authdb

# JWT
JWT_ACCESS_SECRET=secret_al_menos_32_caracteres_access
JWT_REFRESH_SECRET=secret_al_menos_32_caracteres_refresh
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# AMADEUS
AMADEUS_CLIENT_ID=tu_client_id
AMADEUS_CLIENT_SECRET=tu_client_secret
AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_TEST_MODE=true

# GOOGLE SHEETS
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEETS_TEMPLATE_ID=1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw
```

### Paso 3: Inicializar Base de Datos

```powershell
# Conectar a PostgreSQL
psql -U postgres

# Crear BD
CREATE DATABASE authdb;
\c authdb
\i migrations/add_google_sheets_table.sql
\q
```

### Paso 4: Iniciar Servidor

```powershell
npm run dev

# Deberías ver:
# ✅ Connected to PostgreSQL
# ✅ Google Sheets Adapter inicializado
# 🚀 Server running on http://localhost:4000
```

---

## 🤖 Testing Automatizado

### Script Principal

```powershell
# Ejecutar flujo completo
.\flujo_completo_vuelos.ps1
```

Este script automáticamente:

1. ✅ Registra nuevo usuario
2. ✅ Busca 50 vuelos LIM → CUZ
3. ✅ Crea plan de viaje
4. ✅ Genera itinerario de 6 días
5. ✅ Exporta a Google Sheets

**Salida esperada:**

```
========================================
  FLUJO COMPLETO
========================================

PASO 1: Registrando usuario...
   ✓ Usuario creado - ID: 1

PASO 2: Buscando vuelos...
   ✓ Vuelos encontrados - Ofertas: 50

PASO 3: Creando plan...
   ✓ Plan creado - ID: 1

PASO 4: Creando itinerario...
   ✓ Itinerario creado - ID: 1

PASO 5: Exportando a Sheets...
   ✓ Exportado - Vuelos: 50
   URL: https://docs.google.com/spreadsheets/d/...
```

### Limpiar Base de Datos

```powershell
# Resetear todo
psql -U postgres -d authdb -f reset_all_data.sql
```

---

## 🔧 Testing Manual (Thunder Client)

### 1. Autenticación

#### Registrar Usuario

```http
POST http://localhost:4000/auth/register
Content-Type: application/json

{
  "name": "María García",
  "email": "maria@test.com",
  "password": "Pass1234!",
  "role": "user"
}
```

**Respuesta (201):**
```json
{
  "user": { "id": 1, "name": "María García", ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

> 💾 Guarda el `accessToken` para las siguientes peticiones.

#### Login

```http
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "email": "maria@test.com",
  "password": "Pass1234!"
}
```

---

### 2. Planes de Viaje

#### Crear Plan

```http
POST http://localhost:4000/planning/requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "destination": "París, Francia",
  "startDate": "2025-06-15",
  "endDate": "2025-06-20",
  "budgetAmount": 1500,
  "budgetCurrency": "EUR",
  "interests": ["cultura", "gastronomia"]
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "destination": { "label": "París, Francia" },
    "dateRange": {
      "startDate": "2025-06-15",
      "endDate": "2025-06-20",
      "durationDays": 6
    },
    "budget": { "amount": 1500, "currency": "EUR" },
    "budgetPerDay": { "amount": 250, "currency": "EUR" }
  }
}
```

---

### 3. Itinerarios

#### Crear Itinerario

```http
POST http://localhost:4000/itineraries/from-plan/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "Escapada Romántica a París"
}
```

#### Agregar Actividad

```http
POST http://localhost:4000/itineraries/1/days/1/activities
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "Torre Eiffel",
  "tipo": "VISITA",
  "lugar": "Torre Eiffel, París",
  "horaInicio": "14:00",
  "horaFin": "17:00",
  "costoAmount": 25.50,
  "costoCurrency": "EUR",
  "notas": "Comprar tickets online"
}
```

**Tipos de actividad:**
- `VUELO` - Vuelos
- `HOSPEDAJE` - Hoteles
- `TRANSPORTE` - Trenes, taxis
- `VISITA` - Museos, monumentos
- `RESTAURANTE` - Comidas
- `COMPRAS` - Shopping
- `ENTRETENIMIENTO` - Shows
- `OTRO` - Otros

---

### 4. Búsqueda de Vuelos

#### Buscar Vuelos

```http
POST http://localhost:4000/integrations/flights/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "origen": "MAD",
  "destino": "CDG",
  "fechaSalida": "2025-06-15",
  "fechaRegreso": "2025-06-20",
  "numeroPasajeros": 2,
  "cabina": "ECONOMY"
}
```

**Respuesta (200):**
```json
{
  "id": "search_abc123...",
  "origen": "MAD",
  "destino": "CDG",
  "ofertas": [
    {
      "id": "1",
      "precio": { "amount": 350.50, "currency": "EUR" },
      "segmentos": [
        {
          "origen": "MAD",
          "destino": "CDG",
          "fechaSalida": "2025-06-15T10:30:00",
          "aerolinea": "AF",
          "numeroVuelo": "AF1234",
          "duracion": 150
        }
      ],
      "asientosDisponibles": 9
    }
  ]
}
```

#### Aplicar Filtros

```http
POST http://localhost:4000/integrations/flights/searches/{searchId}/filters
Authorization: Bearer {token}
Content-Type: application/json

{
  "precioMaximo": 400,
  "escalaMaxima": 0,
  "aerolineas": ["AF", "IB"]
}
```

#### Ordenar

```http
GET http://localhost:4000/integrations/flights/searches/{searchId}/sort/PRECIO
Authorization: Bearer {token}
```

**Criterios:**
- `PRECIO` - Más barato
- `DURACION` - Más rápido
- `ESCALAS` - Menos escalas
- `MEJOR_OPCION` - Balance

#### Agregar a Itinerario

```http
POST http://localhost:4000/integrations/flights/searches/{searchId}/offers/1/add-to-itinerary
Authorization: Bearer {token}
Content-Type: application/json

{
  "itinerarioId": 1
}
```

---

### 5. Google Sheets

#### Exportar

```http
POST http://localhost:4000/sheets/export/1?searchId={searchId}
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "spreadsheetId": "1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "vuelos": 50
}
```

**Hojas generadas:**
1. Resumen - Info general
2. Dias - Lista de días
3. Actividades - Detalle
4. Presupuesto - Costos
5. Vuelos - Ofertas (cada segmento = 1 fila)

---

### 6. Compartición

#### Compartir

```http
POST http://localhost:4000/sharing/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "itinerarioId": 1,
  "compartidoConEmail": "amigo@test.com",
  "permiso": "LECTOR",
  "mensaje": "¡Mira nuestro viaje!",
  "diasValidez": 7
}
```

**Permisos:**
- `PROPIETARIO` - Control total
- `EDITOR` - Puede modificar
- `LECTOR` - Solo ver

#### Ver Link Compartido

```http
GET http://localhost:4000/sharing/link/{token}
```

> No requiere autenticación

---

## 🎯 Flujos de Prueba Completos

### Flujo 1: Viaje Básico

```powershell
# 1. Registrar
$user = Invoke-RestMethod -Uri "http://localhost:4000/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body '{"name":"Test","email":"test@test.com","password":"Pass123!"}'
$token = $user.accessToken

# 2. Crear plan
$plan = Invoke-RestMethod -Uri "http://localhost:4000/planning/requests" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"destination":"Barcelona","startDate":"2025-07-01","endDate":"2025-07-05","budgetAmount":800,"budgetCurrency":"EUR","interests":["playa"]}'

# 3. Crear itinerario
$itinerary = Invoke-RestMethod -Uri "http://localhost:4000/itineraries/from-plan/$($plan.data.id)" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"titulo":"Verano Barcelona"}'

Write-Host "✅ Itinerario: $($itinerary.data.id)"
```

### Flujo 2: Con Vuelos

```powershell
# Ejecuta Flujo 1 primero

# 4. Buscar vuelos
$search = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/search" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"origen":"MAD","destino":"BCN","fechaSalida":"2025-07-01","numeroPasajeros":1,"cabina":"ECONOMY"}'

# 5. Agregar vuelo
Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$($search.id)/offers/1/add-to-itinerary" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body "{`"itinerarioId`":$($itinerary.data.id)}"

Write-Host "✅ Vuelo agregado"
```

### Flujo 3: Exportar

```powershell
# Ejecuta Flujos 1 y 2

# 6. Exportar
$export = Invoke-RestMethod -Uri "http://localhost:4000/sheets/export/$($itinerary.data.id)?searchId=$($search.id)" `
  -Method POST -Headers @{Authorization="Bearer $token"}

Write-Host "📊 URL: $($export.spreadsheetUrl)"
```

---

## 🐛 Troubleshooting

### ❌ "Token requerido"

**Problema:** Header de autorización incorrecto

**Solución:**
```powershell
# ✅ Correcto
-Headers @{Authorization="Bearer $token"}

# ❌ Incorrecto
-Headers @{Authorization="$token"}
```

---

### ❌ "Credenciales inválidas" (Amadeus)

**Problema:** Client ID/Secret incorrectos

**Solución:**
1. Verifica en [developers.amadeus.com](https://developers.amadeus.com)
2. Confirma `AMADEUS_TEST_MODE=true`
3. Sin espacios en credenciales

---

### ❌ "The caller does not have permission" (Sheets)

**Problema:** Service Account sin acceso

**Solución:**
1. Abre template en Google Sheets
2. Compartir → Agregar: `[tu-service-account]@[proyecto].iam.gserviceaccount.com`
3. Permiso: **Editor**

---

### ❌ "La búsqueda ha expirado"

**Problema:** Búsquedas expiran en 1 hora

**Solución:** Crear nueva búsqueda

---

### ❌ "Cannot POST /.../searches//filters"

**Problema:** searchId vacío

**Solución:**
```powershell
# ✅ Correcto
$searchId = $search.id

# ❌ Incorrecto
$searchId = $search.busquedaId
```

---

## 📚 Referencia Rápida

### Códigos IATA

#### Perú
- `LIM` - Lima
- `CUZ` - Cusco
- `AQP` - Arequipa

#### España
- `MAD` - Madrid
- `BCN` - Barcelona
- `SVQ` - Sevilla

#### Francia
- `CDG` - París CDG
- `ORY` - París Orly
- `NCE` - Niza

#### Europa
- `LHR` - Londres
- `FCO` - Roma
- `AMS` - Ámsterdam

---

### Cabinas

- `ECONOMY` - Económica
- `PREMIUM_ECONOMY` - Premium
- `BUSINESS` - Ejecutiva
- `FIRST` - Primera

---

### Tipos Actividad

- `VUELO` - Vuelos
- `HOSPEDAJE` - Hoteles
- `TRANSPORTE` - Trenes/taxis
- `VISITA` - Museos/tours
- `RESTAURANTE` - Comidas
- `COMPRAS` - Shopping
- `ENTRETENIMIENTO` - Shows
- `OTRO` - Otros

---

## ✅ Checklist Completo

### Configuración
- [ ] BD creada (authdb)
- [ ] Migraciones ejecutadas
- [ ] Variables `.env` configuradas
- [ ] Servidor inicia OK
- [ ] Template compartido

### Autenticación
- [ ] Registro funciona
- [ ] Login devuelve token
- [ ] Token expira en 15min
- [ ] Refresh funciona

### Planning
- [ ] Crear plan OK
- [ ] Validación fechas OK
- [ ] Presupuesto/día correcto

### Itinerarios
- [ ] Crear desde plan OK
- [ ] Genera días auto
- [ ] Agregar actividades OK
- [ ] Costos correctos

### Vuelos
- [ ] Búsqueda funciona
- [ ] Cache <50ms
- [ ] Filtros OK
- [ ] Ordenamiento OK
- [ ] Agregar a itinerario OK

### Google Sheets
- [ ] Exportación OK
- [ ] 5 hojas generadas
- [ ] Vuelos por segmento
- [ ] Formato aplicado

### Compartición
- [ ] Generar link OK
- [ ] Acceso sin auth
- [ ] Permisos respetados
- [ ] Revocar funciona

---

## 🎉 ¡Listo!

Si todo pasa, estás listo para:

1. **Conectar AppSheet** - Usar URL del spreadsheet
2. **Deploy** - Railway, Render, Fly.io
3. **Producción** - Cambiar `AMADEUS_TEST_MODE=false`

---

**¡Feliz Testing! 🚀**

*Travelsia - Making travel planning easier*
