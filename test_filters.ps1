Write-Host "Test de Endpoints de Filtros y Ordenamiento" -ForegroundColor Cyan# Script de prueba rápida para endpoints de filtros y ordenamiento

Write-Host ""# Asegúrate de tener un servidor corriendo en puerto 4000



# 1. Login$baseUrl = "http://localhost:4000"

Write-Host "1. Obteniendo token..." -ForegroundColor Yellow

$loginBody = @{email="test@example.com";password="password123"} | ConvertTo-JsonWrite-Host "=== TEST ENDPOINTS FILTROS Y ORDENAMIENTO ===" -ForegroundColor Cyan

$login = Invoke-RestMethod -Uri "http://localhost:4000/auth/login" -Method POST -ContentType "application/json" -Body $loginBodyWrite-Host ""

$token = $login.accessToken

$headers = @{"Authorization"="Bearer $token"}# Paso 1: Login para obtener token

Write-Host "   OK - Token obtenido" -ForegroundColor GreenWrite-Host "1. Login..." -ForegroundColor Yellow

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{

# 2. Crear una búsqueda de vuelos    email = "test@example.com"

Write-Host "2. Creando busqueda de vuelos..." -ForegroundColor Yellow    password = "password123"

$searchBody = @{} | ConvertTo-Json)

    origen="LIM"

    destino="CUZ"$token = $loginResponse.accessToken

    fechaIda="2026-02-15"Write-Host "   Token obtenido: $($token.Substring(0,20))..." -ForegroundColor Green

    fechaVuelta="2026-02-20"Write-Host ""

    adultos=1

    cabina="ECONOMY"# Paso 2: Crear búsqueda de vuelos

} | ConvertTo-JsonWrite-Host "2. Creando búsqueda de vuelos..." -ForegroundColor Yellow

try {

try {    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/search" -Method POST -ContentType "application/json" -Headers @{

    $search = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/search" -Method POST -ContentType "application/json" -Headers $headers -Body $searchBody        "Authorization" = "Bearer $token"

    $searchId = $search.busquedaId    } -Body (@{

    Write-Host "   OK - Search ID: $searchId" -ForegroundColor Green        origen = "LIM"

    Write-Host "   Total ofertas: $($search.totalResultados)" -ForegroundColor Gray        destino = "CUZ"

} catch {        fechaSalida = "2025-12-15"

    Write-Host "   ERROR: $_" -ForegroundColor Red        fechaRegreso = "2025-12-20"

    Write-Host "   Nota: Esto puede fallar si las credenciales de Amadeus no son validas" -ForegroundColor Yellow        numeroPasajeros = 1

    Write-Host "   Usando un searchId de prueba..." -ForegroundColor Yellow        cabina = "ECONOMY"

    $searchId = "test-search-id"    } | ConvertTo-Json)

}

    $searchId = $searchResponse.id

# 3. Probar endpoint de filtros    Write-Host "   Búsqueda creada: $searchId" -ForegroundColor Green

Write-Host "`n3. Probando endpoint de FILTROS..." -ForegroundColor Yellow    Write-Host "   Ofertas encontradas: $($searchResponse.numeroResultados)" -ForegroundColor Green

$filtrosBody = @{    Write-Host ""

    precioMaximo=500

    escalasMaximas=1    # Paso 3: Aplicar filtros

    aerolineas=@("LA")    Write-Host "3. Aplicando filtros..." -ForegroundColor Yellow

} | ConvertTo-Json    try {

        $filterResponse = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/searches/$searchId/filters" -Method POST -ContentType "application/json" -Headers @{

try {            "Authorization" = "Bearer $token"

    $filtered = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$searchId/filters" -Method POST -ContentType "application/json" -Headers $headers -Body $filtrosBody        } -Body (@{

    Write-Host "   OK - Filtros aplicados" -ForegroundColor Green            precioMaximo = 500

    Write-Host "   Ofertas filtradas: $($filtered.totalResultados)" -ForegroundColor Gray            soloDirectos = $true

    Write-Host "   Filtros aplicados: $($filtered.filtrosAplicados | ConvertTo-Json -Compress)" -ForegroundColor Gray        } | ConvertTo-Json)

} catch {

    Write-Host "   ERROR: $_" -ForegroundColor Red        Write-Host "   Filtros aplicados exitosamente!" -ForegroundColor Green

    $errorDetail = $_.Exception.Response        Write-Host "   Resultados filtrados: $($filterResponse.totalResultados)" -ForegroundColor Green

    if ($errorDetail) {        Write-Host ""

        $reader = [System.IO.StreamReader]::new($errorDetail.GetResponseStream())    } catch {

        $responseBody = $reader.ReadToEnd()        Write-Host "   ERROR en filtros:" -ForegroundColor Red

        Write-Host "   Detalle: $responseBody" -ForegroundColor Red        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red

    }        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red

}        Write-Host ""

    }

# 4. Probar endpoint de ordenamiento

Write-Host "`n4. Probando endpoint de ORDENAMIENTO..." -ForegroundColor Yellow    # Paso 4: Ordenar por precio

    Write-Host "4. Ordenando por precio..." -ForegroundColor Yellow

$criterios = @("PRECIO", "DURACION", "MEJOR_VALORADO")    try {

        $sortResponse = Invoke-RestMethod -Uri "$baseUrl/integrations/flights/searches/$searchId/sort/PRECIO_ASC" -Method GET -Headers @{

foreach ($criterio in $criterios) {            "Authorization" = "Bearer $token"

    try {        }

        $sorted = Invoke-RestMethod -Uri "http://localhost:4000/integrations/flights/searches/$searchId/sort/$criterio" -Method GET -Headers $headers

        Write-Host "   OK - Ordenado por: $criterio" -ForegroundColor Green        Write-Host "   Ordenamiento exitoso!" -ForegroundColor Green

        Write-Host "      Total resultados: $($sorted.totalResultados)" -ForegroundColor Gray        Write-Host "   Resultados ordenados: $($sortResponse.totalResultados)" -ForegroundColor Green

    } catch {        Write-Host "   Criterio: $($sortResponse.criterioOrden)" -ForegroundColor Green

        Write-Host "   ERROR al ordenar por $criterio : $_" -ForegroundColor Red        Write-Host ""

        $errorDetail = $_.Exception.Response    } catch {

        if ($errorDetail) {        Write-Host "   ERROR en ordenamiento:" -ForegroundColor Red

            $reader = [System.IO.StreamReader]::new($errorDetail.GetResponseStream())        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red

            $responseBody = $reader.ReadToEnd()        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red

            Write-Host "      Detalle: $responseBody" -ForegroundColor Red        Write-Host ""

        }    }

    }

}} catch {

    Write-Host "   ERROR creando búsqueda:" -ForegroundColor Red

Write-Host "`n=========================================" -ForegroundColor Cyan    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red

Write-Host "TEST COMPLETADO" -ForegroundColor Cyan    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red

Write-Host "=========================================" -ForegroundColor Cyan}


Write-Host ""
Write-Host "=== FIN DE PRUEBAS ===" -ForegroundColor Cyan
