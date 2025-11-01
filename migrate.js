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
    
    console.log('✅ Migraciones completadas exitosamente');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    console.error('Detalle:', error);
    process.exit(1);
  }
}

migrate();
