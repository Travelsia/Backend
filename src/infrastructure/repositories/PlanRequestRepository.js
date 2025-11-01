import { pool } from '../../db.js';
import { SolicitudPlan } from '../../domain/aggregates/SolicitudPlan.js';

/**
 * Repositorio: PlanRequestRepository
 * Gestiona la persistencia del agregado SolicitudPlan
 */
export class PlanRequestRepository {
  async save(solicitudPlan) {
    const data = solicitudPlan.toPersistence();
    
    if (data.id) {
      // Actualizar existente
      const query = `
        UPDATE plan_requests
        SET destination = $1,
            start_date = $2,
            end_date = $3,
            budget_amount = $4,
            budget_currency = $5,
            interests = $6,
            status = $7,
            updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      
      const values = [
        data.destination,
        data.start_date,
        data.end_date,
        data.budget_amount,
        data.budget_currency,
        data.interests,
        data.status,
        data.id
      ];

      const result = await pool.query(query, values);
      return SolicitudPlan.fromPersistence(result.rows[0]);
    } else {
      // Crear nuevo
      const query = `
        INSERT INTO plan_requests (
          user_id, destination, start_date, end_date,
          budget_amount, budget_currency, interests, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        data.user_id,
        data.destination,
        data.start_date,
        data.end_date,
        data.budget_amount,
        data.budget_currency,
        data.interests,
        data.status
      ];

      const result = await pool.query(query, values);
      return SolicitudPlan.fromPersistence(result.rows[0]);
    }
  }

  async findById(id) {
    const query = 'SELECT * FROM plan_requests WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return SolicitudPlan.fromPersistence(result.rows[0]);
  }

  async findByUserId(userId) {
    const query = `
      SELECT * FROM plan_requests 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => SolicitudPlan.fromPersistence(row));
  }

  async findByUserIdAndStatus(userId, status) {
    const query = `
      SELECT * FROM plan_requests 
      WHERE user_id = $1 AND status = $2 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId, status]);
    
    return result.rows.map(row => SolicitudPlan.fromPersistence(row));
  }

  async delete(id) {
    const query = 'DELETE FROM plan_requests WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM plan_requests WHERE id = $1)';
    const result = await pool.query(query, [id]);
    
    return result.rows[0].exists;
  }
}
