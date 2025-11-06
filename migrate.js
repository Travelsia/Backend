import { pool } from './src/db.js';

async function migrate() {
  try {
    console.log('🔄 Ejecutando migraciones...');
    console.log(`📍 Conectando a: ${process.env.PG_DATABASE} en ${process.env.PG_HOST}`);
    
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Crear tabla users (si no existe)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await pool.query(createUsersTable);
    console.log('✅ Tabla users creada/verificada exitosamente');
    
    // Crear tabla refresh_tokens (si no existe)
    const createRefreshTokensTable = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await pool.query(createRefreshTokensTable);
    console.log('✅ Tabla refresh_tokens creada/verificada exitosamente');
    
    // Crear tabla plan_requests
    const createPlanRequestsTable = `
      CREATE TABLE IF NOT EXISTS plan_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        destination VARCHAR(200) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        budget_amount DECIMAL(10,2) NOT NULL,
        budget_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        interests TEXT[],
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT valid_date_range CHECK (end_date >= start_date),
        CONSTRAINT valid_budget CHECK (budget_amount >= 0)
      )
    `;
    
    await pool.query(createPlanRequestsTable);
    console.log('✅ Tabla plan_requests creada/verificada exitosamente');
    
    // Crear tabla itineraries
    const createItinerariesTable = `
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        plan_request_id INTEGER REFERENCES plan_requests(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        estado VARCHAR(20) DEFAULT 'borrador',
        moneda_base VARCHAR(3) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT valid_itinerary_date_range CHECK (end_date >= start_date)
      )
    `;
    
    await pool.query(createItinerariesTable);
    console.log('✅ Tabla itineraries creada/verificada exitosamente');
    
    // Crear tabla days
    const createDaysTable = `
      CREATE TABLE IF NOT EXISTS days (
        id SERIAL PRIMARY KEY,
        itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        numero INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_day_per_itinerary UNIQUE(itinerary_id, numero),
        CONSTRAINT valid_day_number CHECK (numero > 0)
      )
    `;
    
    await pool.query(createDaysTable);
    console.log('✅ Tabla days creada/verificada exitosamente');
    
    // Crear tabla activities
    const createActivitiesTable = `
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(20) NOT NULL,
        lugar_label VARCHAR(200) NOT NULL,
        lugar_latitude DECIMAL(10, 8),
        lugar_longitude DECIMAL(11, 8),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        costo_amount DECIMAL(10,2) NOT NULL,
        costo_currency VARCHAR(3) NOT NULL,
        estado VARCHAR(20) DEFAULT 'PROPUESTA',
        metadata_externa JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT valid_activity_time CHECK (end_time > start_time),
        CONSTRAINT valid_activity_cost CHECK (costo_amount >= 0)
      )
    `;
    
    await pool.query(createActivitiesTable);
    console.log('✅ Tabla activities creada/verificada exitosamente');
    
    // Crear índices para itinerarios
    await pool.query('CREATE INDEX IF NOT EXISTS idx_itineraries_user ON itineraries(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_itineraries_plan_request ON itineraries(plan_request_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_days_itinerary ON days(itinerary_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activities_day ON activities(day_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activities_tipo ON activities(tipo)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activities_estado ON activities(estado)');
    console.log('✅ Índices de itinerarios creados/verificados exitosamente');
    
    // Crear tabla flight_searches
    const createFlightSearchesTable = `
      CREATE TABLE IF NOT EXISTS flight_searches (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        origen VARCHAR(3) NOT NULL,
        destino VARCHAR(3) NOT NULL,
        fecha_salida TIMESTAMP NOT NULL,
        fecha_regreso TIMESTAMP,
        numero_pasajeros INTEGER NOT NULL DEFAULT 1,
        cabina VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
        ofertas JSONB NOT NULL DEFAULT '[]',
        creado_en TIMESTAMP DEFAULT NOW(),
        expira_en TIMESTAMP NOT NULL,
        filtros_aplicados JSONB DEFAULT '{}',
        CONSTRAINT valid_passengers CHECK (numero_pasajeros >= 1 AND numero_pasajeros <= 9),
        CONSTRAINT valid_search_dates CHECK (fecha_regreso IS NULL OR fecha_regreso > fecha_salida)
      )
    `;
    
    await pool.query(createFlightSearchesTable);
    console.log('✅ Tabla flight_searches creada/verificada exitosamente');
    
    // Crear índices para búsquedas de vuelos
    await pool.query('CREATE INDEX IF NOT EXISTS idx_flight_searches_user ON flight_searches(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_flight_searches_criteria ON flight_searches(user_id, origen, destino, fecha_salida)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_flight_searches_expiry ON flight_searches(expira_en)');
    console.log('✅ Índices de búsquedas de vuelos creados/verificados exitosamente');
    
    // Crear tabla shared_itineraries (Contexto de Colaboración)
    const createSharedItinerariesTable = `
      CREATE TABLE IF NOT EXISTS shared_itineraries (
        id SERIAL PRIMARY KEY,
        itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        shared_with_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        shared_with_email VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'LECTOR',
        share_token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        mensaje TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        revoked_at TIMESTAMP,
        CONSTRAINT valid_role CHECK (role IN ('PROPIETARIO', 'EDITOR', 'LECTOR')),
        CONSTRAINT valid_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'REVOCADO', 'EXPIRADO'))
      )
    `;
    
    await pool.query(createSharedItinerariesTable);
    console.log('✅ Tabla shared_itineraries creada/verificada exitosamente');
    
    // Crear índices para comparticiones
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_itinerary ON shared_itineraries(itinerary_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_owner ON shared_itineraries(owner_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_shared_with ON shared_itineraries(shared_with_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_email ON shared_itineraries(shared_with_email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_token ON shared_itineraries(share_token)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_estado ON shared_itineraries(estado)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shared_itineraries_expiry ON shared_itineraries(expires_at)');
    console.log('✅ Índices de comparticiones creados/verificados exitosamente');
    
    console.log('🎉 Todas las migraciones completadas exitosamente');
    console.log('📊 Total de tablas: 8 (users, refresh_tokens, plan_requests, itineraries, days, activities, flight_searches, shared_itineraries)');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    console.error('Detalle:', error);
    process.exit(1);
  }
}

migrate();
