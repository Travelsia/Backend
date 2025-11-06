-- Script para limpiar completamente la base de datos
-- Ejecuta con: psql -U postgres -d authdb -f reset_db.sql

-- Deshabilitar constraints temporalmente
SET session_replication_role = 'replica';

-- Limpiar todas las tablas en orden inverso de dependencias
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE days CASCADE;
TRUNCATE TABLE itineraries CASCADE;
TRUNCATE TABLE flight_searches CASCADE;
TRUNCATE TABLE shared_itineraries CASCADE;
TRUNCATE TABLE plan_requests CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reiniciar secuencias (IDs empezarán desde 1)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE refresh_tokens_id_seq RESTART WITH 1;
ALTER SEQUENCE plan_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE itineraries_id_seq RESTART WITH 1;
ALTER SEQUENCE days_id_seq RESTART WITH 1;
ALTER SEQUENCE activities_id_seq RESTART WITH 1;
ALTER SEQUENCE shared_itineraries_id_seq RESTART WITH 1;

-- Rehabilitar constraints
SET session_replication_role = 'origin';

-- Verificar que las tablas están vacías
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
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
SELECT 'shared_itineraries', COUNT(*) FROM shared_itineraries;

-- Mensaje de confirmación
SELECT '✅ Base de datos limpiada exitosamente. Todos los IDs reiniciados.' as mensaje;
