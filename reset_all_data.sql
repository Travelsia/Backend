-- Script para limpiar completamente la base de datos y reiniciar autoincrementales
-- Ejecutar con: psql -U postgres -d authdb -f reset_all_data.sql

-- Desactivar restricciones temporalmente
SET session_replication_role = 'replica';

-- Vaciar todas las tablas
TRUNCATE TABLE google_sheets_exports CASCADE;
TRUNCATE TABLE shared_itineraries CASCADE;
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE days CASCADE;
TRUNCATE TABLE itineraries CASCADE;
TRUNCATE TABLE plan_requests CASCADE;
TRUNCATE TABLE flight_searches CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reactivar restricciones
SET session_replication_role = 'origin';

-- Reiniciar secuencias (autoincrementales)
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS plan_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS itineraries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS days_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS activities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS shared_itineraries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS google_sheets_exports_id_seq RESTART WITH 1;

-- Verificar que las tablas estén vacías
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'plan_requests', COUNT(*) FROM plan_requests
UNION ALL
SELECT 'itineraries', COUNT(*) FROM itineraries
UNION ALL
SELECT 'days', COUNT(*) FROM days
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'flight_searches', COUNT(*) FROM flight_searches
UNION ALL
SELECT 'shared_itineraries', COUNT(*) FROM shared_itineraries
UNION ALL
SELECT 'google_sheets_exports', COUNT(*) FROM google_sheets_exports;

-- Mensaje de confirmación
\echo '✅ Base de datos limpiada completamente'
\echo '✅ Autoincrementales reiniciados a 1'
