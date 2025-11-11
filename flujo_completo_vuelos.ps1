# Script completo: Registro -> Busqueda vuelos -> Crear itinerario -> Exportar a Sheets
# Flujo end-to-end completo con datos nuevos

$baseUrl = "http://localhost:4000"
$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FLUJO COMPLETO: USUARIO -> VUELOS -> SHEETS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Generar email unico con timestamp
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$uniqueEmail = "usuario_$timestamp@test.com"

# ==================== PASO 1: REGISTRAR NUEVO USUARIO ====================
Write-Host "PASO 1: Registrando nuevo usuario..." -ForegroundColor Yellow
Write-Host "Email: $uniqueEmail" -ForegroundColor Gray

$registerData = @{
    name = "Usuario Test $timestamp"
    email = $uniqueEmail
    password = "Password123!"
    role = "user"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method POST `
        -Body $registerData `
        -ContentType "application/json"
    
    $token = $registerResponse.accessToken
    $userId = $registerResponse.user.id
    
    Write-Host "   EXITO! Usuario creado" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor White
    Write-Host "   Nombre: $($registerResponse.user.name)" -ForegroundColor White
} catch {
    Write-Host "   ERROR: No se pudo registrar usuario" -ForegroundColor Red
    Write-Host "   Detalles: $_" -ForegroundColor Red
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# ==================== PASO 2: BUSCAR VUELOS ====================
Write-Host "`nPASO 2: Buscando vuelos con Amadeus..." -ForegroundColor Yellow

# Calcular fechas futuras (30 dias desde hoy)
$fechaSalida = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
$fechaRegreso = (Get-Date).AddDays(35).ToString("yyyy-MM-dd")

Write-Host "   Origen: LIM (Lima)" -ForegroundColor Gray
Write-Host "   Destino: CUZ (Cusco)" -ForegroundColor Gray
Write-Host "   Salida: $fechaSalida" -ForegroundColor Gray
Write-Host "   Regreso: $fechaRegreso" -ForegroundColor Gray

$flightSearchData = @{
    origen = "LIM"
    destino = "CUZ"
    fechaSalida = $fechaSalida
    fechaRegreso = $fechaRegreso
    numeroPasajeros = 1
    cabina = "ECONOMY"
    forzarNuevaBusqueda = $true
} | ConvertTo-Json

try {
    $flightSearch = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/search" `
        -Method POST `
        -Headers $headers `
        -Body $flightSearchData `
        -ContentType "application/json"
    
    $searchId = $flightSearch.id
    $numOfertas = $flightSearch.ofertas.Count
    
    Write-Host "   EXITO! Vuelos encontrados" -ForegroundColor Green
    Write-Host "   Search ID: $searchId" -ForegroundColor Cyan
    
    # Debug: Guardar searchId para verificar
    if ([string]::IsNullOrEmpty($searchId)) {
        Write-Host "   ADVERTENCIA: searchId esta vacio!" -ForegroundColor Yellow
        Write-Host "   Respuesta completa:" -ForegroundColor Gray
        $flightSearch | ConvertTo-Json -Depth 2 | Write-Host -ForegroundColor Gray
    }
    Write-Host "   Ofertas: $numOfertas" -ForegroundColor White
    
    if ($numOfertas -gt 0) {
        # Mostrar primer vuelo como ejemplo
        $primerVuelo = $flightSearch.ofertas[0]
        Write-Host "   Ejemplo: $($primerVuelo.precio) $($primerVuelo.moneda)" -ForegroundColor White
    }
} catch {
    Write-Host "   ERROR: No se pudo buscar vuelos" -ForegroundColor Red
    Write-Host "   Detalles: $_" -ForegroundColor Red
    exit 1
}

# ==================== PASO 3: CREAR PLAN REQUEST ====================
Write-Host "`nPASO 3: Creando plan request..." -ForegroundColor Yellow

$planData = @{
    destination = "Cusco, Peru"
    startDate = $fechaSalida
    endDate = $fechaRegreso
    budgetAmount = 1000
    budgetCurrency = "USD"
    interests = @("cultura", "aventura")
} | ConvertTo-Json

try {
    $plan = Invoke-RestMethod -Uri "$baseUrl/planning/requests" `
        -Method POST `
        -Headers $headers `
        -Body $planData `
        -ContentType "application/json"
    
    $planId = $plan.data.id
    
    Write-Host "   EXITO! Plan request creado" -ForegroundColor Green
    Write-Host "   Plan ID: $planId" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: No se pudo crear plan request" -ForegroundColor Red
    Write-Host "   Detalles: $_" -ForegroundColor Red
    exit 1
}

# ==================== PASO 4: CREAR ITINERARIO DESDE PLAN ====================
Write-Host "`nPASO 4: Creando itinerario desde plan..." -ForegroundColor Yellow

try {
    $itinerarioBody = @{ titulo = "Viaje a Cusco - Test $timestamp" } | ConvertTo-Json
    $itinerario = Invoke-RestMethod -Uri "$baseUrl/itineraries/from-plan/$planId" `
        -Method POST `
        -Headers $headers `
        -Body $itinerarioBody `
        -ContentType "application/json"
    
    $itinerarioId = $itinerario.data.id
    
    Write-Host "   EXITO! Itinerario creado" -ForegroundColor Green
    Write-Host "   Itinerario ID: $itinerarioId" -ForegroundColor Cyan
    Write-Host "   Titulo: $($itinerario.data.titulo)" -ForegroundColor White
    Write-Host "   Dias: $($itinerario.data.dias.Count)" -ForegroundColor White
} catch {
    Write-Host "   ERROR: No se pudo crear itinerario" -ForegroundColor Red
    Write-Host "   Detalles: $_" -ForegroundColor Red
    exit 1
}

# ==================== PASO 5: EXPORTAR A GOOGLE SHEETS CON VUELOS ====================
Write-Host "`nPASO 5: Exportando a Google Sheets con vuelos..." -ForegroundColor Yellow
Write-Host "   Spreadsheet Template: 1mpIdMwy27E5ZGt9JmDeJUWuhZ46LiPVjuxBJTDNj5sw" -ForegroundColor Gray

$exportUrl = "$baseUrl/sheets/export/$itinerarioId`?searchId=$searchId"
Write-Host "   URL: $exportUrl" -ForegroundColor Gray

try {
    $exportResult = Invoke-RestMethod -Uri $exportUrl `
        -Method POST `
        -Headers $headers
    
    Write-Host "`n   EXITO! Exportacion completa" -ForegroundColor Green
    Write-Host "   Spreadsheet ID: $($exportResult.spreadsheetId)" -ForegroundColor Cyan
    Write-Host "   Vuelos incluidos: $($exportResult.vuelosIncluidos)" -ForegroundColor White
    Write-Host "   URL: $($exportResult.spreadsheetUrl)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: No se pudo exportar" -ForegroundColor Red
    Write-Host "   Detalles: $_" -ForegroundColor Red
    exit 1
}

# ==================== RESUMEN FINAL ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DEL FLUJO COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nUsuario:" -ForegroundColor Yellow
Write-Host "  Email: $uniqueEmail" -ForegroundColor White
Write-Host "  ID: $userId" -ForegroundColor White

Write-Host "`nBusqueda de Vuelos:" -ForegroundColor Yellow
Write-Host "  Search ID: $searchId" -ForegroundColor White
Write-Host "  Ofertas encontradas: $numOfertas" -ForegroundColor White
Write-Host "  Ruta: LIM -> CUZ" -ForegroundColor White
Write-Host "  Fechas: $fechaSalida a $fechaRegreso" -ForegroundColor White

Write-Host "`nItinerario:" -ForegroundColor Yellow
Write-Host "  ID: $itinerarioId" -ForegroundColor White
Write-Host "  Titulo: Viaje a Cusco - Test Completo $timestamp" -ForegroundColor White
Write-Host "  Dias: $($itinerario.data.dias.Count)" -ForegroundColor White

Write-Host "`nGoogle Sheets:" -ForegroundColor Yellow
Write-Host "  URL: $($exportResult.spreadsheetUrl)" -ForegroundColor Cyan
Write-Host "  Hojas exportadas: 5 (Resumen, Dias, Actividades, Presupuesto, Vuelos)" -ForegroundColor White
Write-Host "  Vuelos en hoja: $($exportResult.vuelosIncluidos)" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SIGUIENTE PASO: CONFIGURAR APPSHEET" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Ve a: https://www.appsheet.com/" -ForegroundColor White
Write-Host "2. Crea una nueva app" -ForegroundColor White
Write-Host "3. Conecta con Google Sheets usando la URL de arriba" -ForegroundColor White
Write-Host "4. AppSheet detectara automaticamente las 5 tablas:" -ForegroundColor White
Write-Host "   - Resumen" -ForegroundColor Gray
Write-Host "   - Dias" -ForegroundColor Gray
Write-Host "   - Actividades" -ForegroundColor Gray
Write-Host "   - Presupuesto" -ForegroundColor Gray
Write-Host "   - Vuelos (con $($exportResult.vuelosIncluidos) ofertas de Amadeus)" -ForegroundColor Cyan

Write-Host "`n5. Configura vistas y acciones para cada tabla" -ForegroundColor White
Write-Host "6. La tabla Vuelos mostrara:" -ForegroundColor White
Write-Host "   - Precios, aerolineas, horarios" -ForegroundColor Gray
Write-Host "   - Numero de escalas" -ForegroundColor Gray
Write-Host "   - Duracion del vuelo" -ForegroundColor Gray
Write-Host "   - Asientos disponibles" -ForegroundColor Gray

Write-Host "`nPara mas detalles, revisa: IMPLEMENTACION_VUELOS.md" -ForegroundColor Gray
Write-Host ""
