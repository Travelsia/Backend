import { pool } from '../../db.js';
import { Comparticion } from '../../domain/aggregates/Comparticion.js';

/**
 * Repository: SharedItineraryRepository
 * Gestiona la persistencia de comparticiones de itinerarios
 */
export class SharedItineraryRepository {
  /**
   * Guardar o actualizar compartición
   */
  async save(comparticion) {
    const data = comparticion.toPersistence();

    if (data.id) {
      // Actualizar existente
      const query = `
        UPDATE shared_itineraries
        SET 
          shared_with_id = $1,
          role = $2,
          share_token = $3,
          expires_at = $4,
          estado = $5,
          accepted_at = $6,
          revoked_at = $7
        WHERE id = $8
        RETURNING *
      `;

      const result = await pool.query(query, [
        data.shared_with_id,
        data.role,
        data.share_token,
        data.expires_at,
        data.estado,
        data.accepted_at,
        data.revoked_at,
        data.id
      ]);

      return Comparticion.fromPersistence(result.rows[0]);
    } else {
      // Crear nueva
      const query = `
        INSERT INTO shared_itineraries (
          itinerary_id, owner_id, shared_with_id, shared_with_email,
          role, share_token, expires_at, estado, mensaje
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await pool.query(query, [
        data.itinerary_id,
        data.owner_id,
        data.shared_with_id,
        data.shared_with_email,
        data.role,
        data.share_token,
        data.expires_at,
        data.estado,
        data.mensaje
      ]);

      return Comparticion.fromPersistence(result.rows[0]);
    }
  }

  /**
   * Buscar por ID
   */
  async findById(id) {
    const query = 'SELECT * FROM shared_itineraries WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return Comparticion.fromPersistence(result.rows[0]);
  }

  /**
   * Buscar por token de compartición
   */
  async findByToken(token) {
    const query = 'SELECT * FROM shared_itineraries WHERE share_token = $1';
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    return Comparticion.fromPersistence(result.rows[0]);
  }

  /**
   * Buscar comparticiones de un itinerario específico
   */
  async findByItinerarioId(itinerarioId) {
    const query = `
      SELECT * FROM shared_itineraries 
      WHERE itinerary_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [itinerarioId]);

    return result.rows.map(row => Comparticion.fromPersistence(row));
  }

  /**
   * Buscar comparticiones activas de un itinerario
   */
  async findActiveByItinerarioId(itinerarioId) {
    const query = `
      SELECT * FROM shared_itineraries 
      WHERE itinerary_id = $1 
        AND estado = 'ACEPTADO'
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [itinerarioId]);

    return result.rows.map(row => Comparticion.fromPersistence(row));
  }

  /**
   * Buscar comparticiones donde un usuario es el propietario
   */
  async findByOwnerId(ownerId) {
    const query = `
      SELECT * FROM shared_itineraries 
      WHERE owner_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [ownerId]);

    return result.rows.map(row => Comparticion.fromPersistence(row));
  }

  /**
   * Buscar comparticiones donde un usuario es el destinatario
   */
  async findBySharedWithId(userId) {
    const query = `
      SELECT * FROM shared_itineraries 
      WHERE shared_with_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);

    return result.rows.map(row => Comparticion.fromPersistence(row));
  }

  /**
   * Buscar comparticiones por email (pendientes de aceptar)
   */
  async findPendingByEmail(email) {
    const query = `
      SELECT * FROM shared_itineraries 
      WHERE shared_with_email = $1 
        AND estado = 'PENDIENTE'
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [email]);

    return result.rows.map(row => Comparticion.fromPersistence(row));
  }

  /**
   * Verificar si un usuario tiene acceso a un itinerario
   */
  async checkAccess(itinerarioId, userId) {
    const query = `
      SELECT * FROM shared_itineraries 
      WHERE itinerary_id = $1 
        AND shared_with_id = $2
        AND estado = 'ACEPTADO'
        AND expires_at > NOW()
      LIMIT 1
    `;
    const result = await pool.query(query, [itinerarioId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return Comparticion.fromPersistence(result.rows[0]);
  }

  /**
   * Obtener rol/permiso de un usuario en un itinerario
   */
  async getUserRole(itinerarioId, userId) {
    const comparticion = await this.checkAccess(itinerarioId, userId);
    return comparticion ? comparticion.permiso : null;
  }

  /**
   * Eliminar compartición
   */
  async delete(id) {
    const query = 'DELETE FROM shared_itineraries WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    return result.rowCount > 0;
  }

  /**
   * Eliminar todas las comparticiones de un itinerario
   */
  async deleteByItinerarioId(itinerarioId) {
    const query = 'DELETE FROM shared_itineraries WHERE itinerary_id = $1';
    const result = await pool.query(query, [itinerarioId]);

    return result.rowCount;
  }

  /**
   * Limpiar comparticiones expiradas (tarea de mantenimiento)
   */
  async cleanupExpired() {
    const query = `
      UPDATE shared_itineraries
      SET estado = 'EXPIRADO'
      WHERE expires_at < NOW()
        AND estado IN ('PENDIENTE', 'ACEPTADO')
      RETURNING *
    `;
    const result = await pool.query(query);

    return result.rows.map(row => Comparticion.fromPersistence(row));
  }

  /**
   * Contar comparticiones activas por itinerario
   */
  async countActiveByItinerario(itinerarioId) {
    const query = `
      SELECT COUNT(*) as total
      FROM shared_itineraries 
      WHERE itinerary_id = $1 
        AND estado = 'ACEPTADO'
        AND expires_at > NOW()
    `;
    const result = await pool.query(query, [itinerarioId]);

    return parseInt(result.rows[0].total);
  }

  /**
   * Obtener estadísticas de compartición
   */
  async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE owner_id = $1) as compartidos_por_mi,
        COUNT(*) FILTER (WHERE shared_with_id = $1) as compartidos_conmigo,
        COUNT(*) FILTER (WHERE owner_id = $1 AND estado = 'ACEPTADO') as activos_compartidos,
        COUNT(*) FILTER (WHERE shared_with_id = $1 AND estado = 'ACEPTADO') as activos_recibidos,
        COUNT(*) FILTER (WHERE owner_id = $1 AND estado = 'PENDIENTE') as pendientes_enviados,
        COUNT(*) FILTER (WHERE shared_with_id = $1 AND estado = 'PENDIENTE') as pendientes_recibidos
      FROM shared_itineraries
      WHERE owner_id = $1 OR shared_with_id = $1
    `;
    const result = await pool.query(query, [userId]);

    return {
      compartidosPorMi: parseInt(result.rows[0].compartidos_por_mi),
      compartidosConmigo: parseInt(result.rows[0].compartidos_conmigo),
      activosCompartidos: parseInt(result.rows[0].activos_compartidos),
      activosRecibidos: parseInt(result.rows[0].activos_recibidos),
      pendientesEnviados: parseInt(result.rows[0].pendientes_enviados),
      pendientesRecibidos: parseInt(result.rows[0].pendientes_recibidos)
    };
  }
}
