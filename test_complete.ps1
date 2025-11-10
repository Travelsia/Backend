Write-Host "=== TEST ENDPOINTS FILTROS Y ORDENAMIENTO ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:4000"

# Paso 1: Login
Write-Host "1. Login..." -ForegroundColor Yellow
$loginBody = @{email="test@example.com";password="password123"} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResponse.accessToken
$headers = @{"Authorization"="Bearer $token"}
Write-Host "   OK - Token obtenido" -ForegroundColor Green
Write-Host ""

# Paso 2: Crear busqueda de vuelos
Write-Host "2. Creando busqueda de vuelos..." -ForegroundColor Yellow
$searchBody = @{origen="LIM";destino="CUZ";fechaSalida="2026-02-15";fechaRegreso="2026-02-20";numeroPasajeros=1;cabina="ECONOMY"} | ConvertTo-Json

try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/search" -Method POST -ContentType "application/json" -Headers $headers -Body $searchBody
    $searchId = $searchResponse.id
    Write-Host "   OK - Search ID: $searchId" -ForegroundColor Green
    Write-Host "   Total ofertas: $($searchResponse.numeroResultados)" -ForegroundColor Green
    Write-Host ""
    
    # Paso 3: Aplicar filtros
    Write-Host "3. Aplicando filtros..." -ForegroundColor Yellow
    $filterBody = @{precioMaximo=500;escalasMaximas=1} | ConvertTo-Json
    
    try {
        $filterResponse = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/searches/$searchId/filters" -Method POST -ContentType "application/json" -Headers $headers -Body $filterBody
        Write-Host "   OK - Filtros aplicados" -ForegroundColor Green
        Write-Host "   Resultados filtrados: $($filterResponse.totalResultados)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "   ERROR en filtros:" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    # Paso 4: Ordenar ofertas
    Write-Host "4. Ordenando ofertas..." -ForegroundColor Yellow
    $criterios = @("PRECIO", "DURACION", "MEJOR_VALORADO")
    
    foreach ($criterio in $criterios) {
        try {
            $sortResponse = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/searches/$searchId/sort/$criterio" -Method GET -Headers $headers
            Write-Host "   OK - Ordenado por: $criterio" -ForegroundColor Green
            Write-Host "      Total resultados: $($sortResponse.totalResultados)" -ForegroundColor Green
        } catch {
            Write-Host "   ERROR al ordenar por $criterio : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "   ERROR creando busqueda:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== FIN DE PRUEBAS ===" -ForegroundColor Cyan
