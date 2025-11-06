# 🧪 Guía Completa de Testing - Travelsia Backend

## 📋 Prerequisitos

✅ Base de datos PostgreSQL corriendo  
✅ Migraciones ejecutadas (`npm run migrate`)  
✅ Variables de entorno configuradas en `.env`  
✅ Servidor iniciado (`npm start` en puerto **4000**)  
✅ Credenciales de Amadeus configuradas

---

## 🔐 Paso 1: Registro de Usuario

### 1.1 Registrar nuevo usuario

```powershell
curl -X POST http://localhost:4000/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test User",
    "email": "test@travelsia.com",
    "password": "Test1234!",
    "role": "user"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@travelsia.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 Guardar el token

```powershell
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Pega tu accessToken aquí
```

---

## 📝 Paso 2: Crear Solicitud de Plan de Viaje

```powershell
curl -X POST http://localhost:4000/planning/requests `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "destination": "París, Francia",
    "startDate": "2025-06-15",
    "endDate": "2025-06-20",
    "budgetAmount": 1500,
    "budgetCurrency": "EUR",
    "interests": ["cultura", "gastronomia", "historia"]
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
      "label": "París, Francia"
    },
    "dateRange": {
      "startDate": "2025-06-15",
      "endDate": "2025-06-20",
      "durationDays": 6
    },
    "budget": {
      "amount": 1500,
      "currency": "EUR"
    },
    "budgetPerDay": {
      "amount": 250,
      "currency": "EUR"
    },
    "interests": ["cultura", "gastronomia", "historia"],
    "status": "pending"
  }
}
```

**Guardar el ID:**
```powershell
$PLAN_ID = 1  # Usa el ID que recibiste
```

---

## 🗺️ Paso 3: Crear Itinerario desde la Solicitud

```powershell
curl -X POST "http://localhost:4000/itineraries/from-plan/$PLAN_ID" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "titulo": "Escapada a París - Junio 2025"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "planRequestId": 1,
    "titulo": "Escapada a París - Junio 2025",
    "descripcion": null,
    "fechaInicio": "2025-06-15",
    "fechaFin": "2025-06-20",
    "dias": [
      {
        "numero": 1,
        "fecha": "2025-06-15",
        "actividades": []
      },
      {
        "numero": 2,
        "fecha": "2025-06-16",
        "actividades": []
      },
      ...
    ],
    "estado": "borrador"
  }
}
```

**Guardar el ID del itinerario:**
```powershell
$ITINERARY_ID = 1  # Usa el ID que recibiste
```

---

## ✈️ Paso 4: Buscar Vuelos con Amadeus API

### 4.1 Búsqueda de vuelos (solo ida)

```powershell
curl -X POST http://localhost:4000/integrations/flights/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "origen": "MAD",
    "destino": "CDG",
    "fechaSalida": "2025-06-15",
    "numeroPasajeros": 2,
    "cabina": "ECONOMY"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 1,
  "origen": "MAD",
  "destino": "CDG",
  "fechaSalida": "2025-06-15",
  "numeroPasajeros": 2,
  "cabina": "ECONOMY",
  "ofertas": [
    {
      "id": "1",
      "precio": {
        "cantidad": 350.50,
        "moneda": "EUR"
      },
      "segmentos": [
        {
          "origen": "MAD",
          "destino": "CDG",
          "salida": "2025-06-15T10:30:00",
          "llegada": "2025-06-15T13:00:00",
          "aerolinea": "AF",
          "numeroVuelo": "AF1234",
          "duracion": "PT2H30M",
          "cabina": "ECONOMY"
        }
      ],
      "disponibilidad": 9,
      "escalas": 0,
      "duracionTotal": "PT2H30M"
    }
  ],
  "creadaEn": "2025-11-06T16:30:00.000Z"
}
```

**Guardar el ID de búsqueda:**
```powershell
$SEARCH_ID = "550e8400-e29b-41d4-a716-446655440000"  # Usa el ID que recibiste
```

### 4.2 Búsqueda con vuelta (round trip)

```powershell
curl -X POST http://localhost:4000/integrations/flights/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "origen": "MAD",
    "destino": "CDG",
    "fechaSalida": "2025-06-15",
    "fechaRegreso": "2025-06-20",
    "numeroPasajeros": 2,
    "cabina": "ECONOMY"
  }'
```

### 4.3 Verificar cache (ejecuta la misma búsqueda nuevamente)

Ejecuta el comando 4.1 nuevamente. Deberías obtener:
- Respuesta instantánea (<50ms)
- Mismos resultados de la primera búsqueda

---

## 📊 Paso 5: Aplicar Filtros y Ordenamiento

### 5.1 Aplicar filtros a búsqueda

```powershell
curl -X POST "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/filters" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "precioMaximo": 400,
    "escalaMaxima": 0,
    "aerolineas": ["AF", "IB"],
    "duracionMaxima": "PT4H"
  }'
```

### 5.2 Ordenar ofertas por precio

```powershell
curl -X GET "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/sort/PRECIO" `
  -H "Authorization: Bearer $TOKEN"
```

**Criterios de ordenamiento disponibles:**
- `PRECIO` - Más barato primero
- `DURACION` - Más rápido primero
- `ESCALAS` - Menos escalas primero
- `SALIDA` - Más temprano primero
- `LLEGADA` - Llegada más temprana
- `MEJOR_OPCION` - Balance precio/duración

### 5.3 Obtener detalle de una oferta específica

```powershell
$OFFER_ID = "1"  # ID de la oferta que quieres ver

curl -X GET "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/offers/$OFFER_ID" `
  -H "Authorization: Bearer $TOKEN"
```

---

## 📅 Paso 6: Agregar Vuelo al Itinerario

### 6.1 Agregar vuelo directamente desde búsqueda

```powershell
curl -X POST "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/offers/$OFFER_ID/add-to-itinerary" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d "{
    \`"itinerarioId\`": $ITINERARY_ID
  }"
```

**Respuesta esperada:**
```json
{
  "mensaje": "Vuelo agregado al itinerario exitosamente",
  "itinerario": {
    "id": 1,
    "titulo": "Escapada a París - Junio 2025"
  },
  "actividadesCreadas": [
    {
      "id": 1,
      "titulo": "Vuelo MAD → CDG",
      "tipo": "VUELO"
    }
  ]
}
```

### 6.2 Agregar actividad manualmente al itinerario

```powershell
$DAY_NUMBER = 1  # Día del itinerario (1-6)

curl -X POST "http://localhost:4000/itineraries/$ITINERARY_ID/days/$DAY_NUMBER/activities" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "titulo": "Visita Torre Eiffel",
    "tipo": "VISITA",
    "lugar": "Torre Eiffel",
    "horaInicio": "14:00",
    "horaFin": "17:00",
    "costoAmount": 25.50,
    "costoCurrency": "EUR",
    "notas": "Comprar tickets con anticipación"
  }'
```

**Tipos de actividad válidos:**
- `VUELO` - Vuelos
- `HOSPEDAJE` - Hoteles, alojamiento
- `TRANSPORTE` - Taxis, trenes, buses
- `VISITA` - Museos, atracciones
- `RESTAURANTE` - Comidas
- `COMPRAS` - Shopping
- `ENTRETENIMIENTO` - Shows, eventos
- `OTRO` - Otros

---

## 📋 Paso 7: Gestionar Itinerario

### 7.1 Ver itinerario completo

```powershell
curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID" `
  -H "Authorization: Bearer $TOKEN"
```

### 7.2 Ver resumen financiero

```powershell
curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/financial-summary" `
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "costoTotal": {
      "amount": 876.00,
      "currency": "EUR"
    },
    "costoPorDia": [
      {
        "dia": 1,
        "costo": {
          "amount": 375.50,
          "currency": "EUR"
        }
      }
    ],
    "costoPorTipo": [
      {
        "tipo": "VUELO",
        "total": {
          "amount": 350.50,
          "currency": "EUR"
        },
        "cantidad": 1
      }
    ],
    "presupuestoRestante": {
      "amount": 624.00,
      "currency": "EUR"
    },
    "porcentajeUsado": 58.4
  }
}
```

### 7.3 Validar horarios (detectar solapes)

```powershell
curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/schedule-validation" `
  -H "Authorization: Bearer $TOKEN"
```

### 7.4 Ver reporte de ocupación

```powershell
curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/occupancy-report" `
  -H "Authorization: Bearer $TOKEN"
```

### 7.5 Actualizar información del itinerario

```powershell
curl -X PATCH "http://localhost:4000/itineraries/$ITINERARY_ID" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "titulo": "Viaje Romántico a París",
    "descripcion": "Escapada de 6 días con mi pareja"
  }'
```

### 7.6 Publicar itinerario

```powershell
curl -X PATCH "http://localhost:4000/itineraries/$ITINERARY_ID/publish" `
  -H "Authorization: Bearer $TOKEN"
```

---

## 🤝 Paso 8: Compartir Itinerario

### 8.1 Compartir con otro usuario

```powershell
curl -X POST http://localhost:4000/sharing/share `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d "{
    \`"itinerarioId\`": $ITINERARY_ID,
    \`"compartidoConEmail\`": \`"amigo@example.com\`",
    \`"permiso\`": \`"LECTOR\`",
    \`"mensaje\`": \`"¡Mira nuestro plan para París!\`",
    \`"diasValidez\`": 7
  }"
```

**Niveles de permiso:**
- `PROPIETARIO` - Control total (solo el creador)
- `EDITOR` - Puede modificar
- `LECTOR` - Solo visualización

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "itinerarioId": 1,
    "propietarioId": 1,
    "compartidoConEmail": "amigo@example.com",
    "permiso": "LECTOR",
    "estado": "PENDIENTE",
    "linkComparticion": "abc123xyz456...",
    "expiraEn": "2025-11-13T16:30:00.000Z",
    "mensaje": "¡Mira nuestro plan para París!"
  }
}
```

**Guardar el token del link:**
```powershell
$SHARE_TOKEN = "abc123xyz456..."  # Del campo linkComparticion
$SHARE_ID = 1  # Del campo id
```

### 8.2 Ver información de compartición (antes de aceptar)

```powershell
curl -X GET "http://localhost:4000/sharing/link/$SHARE_TOKEN"
```

### 8.3 Aceptar compartición (como receptor)

```powershell
# El receptor debe iniciar sesión con su cuenta
curl -X POST "http://localhost:4000/sharing/accept/$SHARE_TOKEN" `
  -H "Authorization: Bearer $TOKEN_RECEPTOR"
```

### 8.4 Listar itinerarios compartidos por mí

```powershell
curl -X GET http://localhost:4000/sharing/shared-by-me `
  -H "Authorization: Bearer $TOKEN"
```

### 8.5 Listar itinerarios compartidos conmigo

```powershell
curl -X GET http://localhost:4000/sharing/shared-with-me `
  -H "Authorization: Bearer $TOKEN"
```

### 8.6 Ver todas las comparticiones de un itinerario

```powershell
curl -X GET "http://localhost:4000/sharing/itinerary/$ITINERARY_ID" `
  -H "Authorization: Bearer $TOKEN"
```

### 8.7 Actualizar permisos

```powershell
curl -X PATCH "http://localhost:4000/sharing/$SHARE_ID/permission" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "permiso": "EDITOR"
  }'
```

### 8.8 Renovar link de compartición

```powershell
curl -X PATCH "http://localhost:4000/sharing/$SHARE_ID/renew" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{
    "diasValidez": 14
  }'
```

### 8.9 Revocar acceso

```powershell
curl -X DELETE "http://localhost:4000/sharing/$SHARE_ID/revoke" `
  -H "Authorization: Bearer $TOKEN"
```

### 8.10 Verificar permisos del usuario

```powershell
curl -X GET "http://localhost:4000/sharing/permissions/$ITINERARY_ID" `
  -H "Authorization: Bearer $TOKEN"
```

### 8.11 Obtener estadísticas de compartición

```powershell
curl -X GET http://localhost:4000/sharing/stats `
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Paso 9: Monitoreo y Estadísticas

### 9.1 Ver historial de búsquedas de vuelos

```powershell
curl -X GET "http://localhost:4000/integrations/flights/searches?limit=10" `
  -H "Authorization: Bearer $TOKEN"
```

### 9.2 Ver estado de integraciones

```powershell
curl -X GET http://localhost:4000/integrations/status `
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "integraciones": {
    "amadeus": {
      "disponible": true,
      "ultimaVerificacion": "2025-11-06T16:45:00.000Z"
    }
  },
  "cache": {
    "totalBusquedas": 5,
    "enCache": 3,
    "hitRate": 0.6
  }
}
```

### 9.3 Ver todas mis solicitudes de plan

```powershell
curl -X GET http://localhost:4000/planning/requests `
  -H "Authorization: Bearer $TOKEN"
```

### 9.4 Ver todos mis itinerarios

```powershell
curl -X GET http://localhost:4000/itineraries `
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Paso 10: Gestión de Sesión

### 10.1 Refrescar token (cuando expire)

```powershell
$REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Tu refresh token

curl -X POST http://localhost:4000/auth/refresh `
  -H "Content-Type: application/json" `
  -d "{
    \`"refreshToken\`": \`"$REFRESH_TOKEN\`"
  }"
```

**Respuesta:**
```json
{
  "accessToken": "nuevo_access_token...",
  "refreshToken": "nuevo_refresh_token..."
}
```

**Actualizar token:**
```powershell
$TOKEN = "nuevo_access_token..."
```

### 10.2 Cerrar sesión

```powershell
curl -X POST http://localhost:4000/auth/logout `
  -H "Content-Type: application/json" `
  -d "{
    \`"refreshToken\`": \`"$REFRESH_TOKEN\`"
  }"
```

---

## 🎯 Flujo Completo de Ejemplo

Aquí está todo el flujo en secuencia:

```powershell
# 1. Registrar usuario
curl -X POST http://localhost:4000/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"María García","email":"maria@example.com","password":"Pass1234!","role":"user"}'

# Guardar token
$TOKEN = "tu_access_token_aqui"

# 2. Crear solicitud de plan
curl -X POST http://localhost:4000/planning/requests `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"destination":"Barcelona, España","startDate":"2025-07-01","endDate":"2025-07-05","budgetAmount":800,"budgetCurrency":"EUR","interests":["playa","arquitectura"]}'

# Guardar ID (ej: 1)
$PLAN_ID = 1

# 3. Crear itinerario
curl -X POST "http://localhost:4000/itineraries/from-plan/$PLAN_ID" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"titulo":"Verano en Barcelona"}'

# Guardar ID (ej: 1)
$ITINERARY_ID = 1

# 4. Buscar vuelos
curl -X POST http://localhost:4000/integrations/flights/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"origen":"MAD","destino":"BCN","fechaSalida":"2025-07-01","numeroPasajeros":1,"cabina":"ECONOMY"}'

# Guardar IDs
$SEARCH_ID = "uuid-de-busqueda"
$OFFER_ID = "1"

# 5. Agregar vuelo al itinerario
curl -X POST "http://localhost:4000/integrations/flights/searches/$SEARCH_ID/offers/$OFFER_ID/add-to-itinerary" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d "{\`"itinerarioId\`":$ITINERARY_ID}"

# 6. Agregar actividad
curl -X POST "http://localhost:4000/itineraries/$ITINERARY_ID/days/1/activities" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"titulo":"Visita Sagrada Familia","tipo":"VISITA","lugar":"Sagrada Familia","horaInicio":"10:00","horaFin":"12:30","costoAmount":26,"costoCurrency":"EUR"}'

# 7. Ver resumen financiero
curl -X GET "http://localhost:4000/itineraries/$ITINERARY_ID/financial-summary" `
  -H "Authorization: Bearer $TOKEN"

# 8. Publicar itinerario
curl -X PATCH "http://localhost:4000/itineraries/$ITINERARY_ID/publish" `
  -H "Authorization: Bearer $TOKEN"

# 9. Compartir con amigo
curl -X POST http://localhost:4000/sharing/share `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d "{\`"itinerarioId\`":$ITINERARY_ID,\`"compartidoConEmail\`":\`"amigo@example.com\`",\`"permiso\`":\`"LECTOR\`",\`"mensaje\`":\`"¡Únete a mi viaje!\`"}"
```

---

## 🐛 Solución de Problemas

### Error: "Cannot POST /..."
- **Causa:** URL incorrecta
- **Solución:** Verifica que estés usando el puerto 4000 y la ruta correcta

### Error: "Faltan campos requeridos"
- **Causa:** Falta algún campo obligatorio
- **Solución:** Revisa la lista de campos requeridos en cada endpoint

### Error: Unauthorized
- **Causa:** Token expirado o inválido
- **Solución:** Refresca el token con `/auth/refresh`

### Error: "No tiene permisos"
- **Causa:** Intentando acceder a recurso de otro usuario
- **Solución:** Verifica que el recurso pertenezca a tu usuario

### Error de Amadeus API
- **Causa:** Credenciales incorrectas o API caída
- **Solución:** Verifica `AMADEUS_CLIENT_ID` y `AMADEUS_CLIENT_SECRET` en `.env`

---

## ✅ Checklist de Testing Completo

### Configuración
- [ ] `.env` configurado correctamente
- [ ] Base de datos corriendo
- [ ] Migraciones ejecutadas
- [ ] Servidor en puerto 4000

### Autenticación
- [ ] Registro exitoso
- [ ] Login exitoso
- [ ] Refresh token funciona
- [ ] Logout funciona

### Planificación
- [ ] Crear solicitud de plan
- [ ] Listar solicitudes
- [ ] Ver solicitud específica

### Itinerarios
- [ ] Crear itinerario desde plan
- [ ] Listar itinerarios
- [ ] Ver itinerario completo
- [ ] Agregar actividades
- [ ] Actualizar actividades
- [ ] Eliminar actividades
- [ ] Ver resumen financiero
- [ ] Validar horarios
- [ ] Publicar itinerario

### Vuelos (Amadeus)
- [ ] Buscar vuelos (solo ida)
- [ ] Buscar vuelos (ida y vuelta)
- [ ] Cache funciona correctamente
- [ ] Aplicar filtros
- [ ] Ordenar resultados
- [ ] Ver detalle de oferta
- [ ] Agregar vuelo a itinerario

### Compartición
- [ ] Compartir itinerario
- [ ] Ver link de compartición
- [ ] Aceptar compartición
- [ ] Listar compartidos por mí
- [ ] Listar compartidos conmigo
- [ ] Actualizar permisos
- [ ] Renovar link
- [ ] Revocar acceso

---

## 📚 Códigos IATA Útiles

### España
- `MAD` - Madrid
- `BCN` - Barcelona
- `AGP` - Málaga
- `PMI` - Palma de Mallorca
- `SVQ` - Sevilla

### Francia
- `CDG` - París Charles de Gaulle
- `ORY` - París Orly
- `NCE` - Niza
- `LYS` - Lyon

### Italia
- `FCO` - Roma Fiumicino
- `MXP` - Milán Malpensa
- `VCE` - Venecia

### Reino Unido
- `LHR` - Londres Heathrow
- `LGW` - Londres Gatwick

---

## 🎉 ¡Testing Completo!

Has completado el flujo completo de testing del backend de Travelsia. Ahora puedes:

1. ✅ Registrar usuarios
2. ✅ Crear planes de viaje
3. ✅ Generar itinerarios
4. ✅ Buscar vuelos reales con Amadeus
5. ✅ Agregar actividades
6. ✅ Gestionar presupuestos
7. ✅ Compartir con otros usuarios

**¡Feliz Testing! 🚀**
