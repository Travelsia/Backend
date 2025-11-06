import { pool } from '../../db.js';
import { Itinerario } from '../../domain/aggregates/Itinerario.js';
import { Dia } from '../../domain/entities/Dia.js';
import { Actividad } from '../../domain/entities/Actividad.js';

/**
 * Repositorio: ItinerarioRepository
 * Gestiona la persistencia del agregado Itinerario con sus entidades internas
 */
export class ItinerarioRepository {
  async save(itinerario) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const itinerarioData = itinerario.toPersistence();
      
      if (itinerarioData.id) {
        // Actualizar itinerario existente
        const updateItinerarioQuery = `
          UPDATE itineraries
          SET titulo = $1, descripcion = $2, estado = $3, updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        
        const result = await client.query(updateItinerarioQuery, [
          itinerarioData.titulo,
          itinerarioData.descripcion,
          itinerarioData.estado,
          itinerarioData.id
        ]);
        
        // Actualizar días y actividades (simplificado: borrar y recrear)
        await this.#saveDays(client, itinerarioData.id, itinerario.dias);
        
        await client.query('COMMIT');
        return await this.findById(result.rows[0].id);
        
      } else {
        // Crear nuevo itinerario
        const insertItinerarioQuery = `
          INSERT INTO itineraries (
            plan_request_id, user_id, titulo, descripcion,
            start_date, end_date, estado, moneda_base
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        
        const result = await client.query(insertItinerarioQuery, [
          itinerarioData.plan_request_id,
          itinerarioData.user_id,
          itinerarioData.titulo,
          itinerarioData.descripcion,
          itinerarioData.start_date,
          itinerarioData.end_date,
          itinerarioData.estado,
          itinerarioData.moneda_base
        ]);
        
        const itinerarioId = result.rows[0].id;
        
        // Guardar días y actividades
        await this.#saveDays(client, itinerarioId, itinerario.dias);
        
        await client.query('COMMIT');
        return await this.findById(itinerarioId);
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async #saveDays(client, itinerarioId, dias) {
    // Eliminar días y actividades existentes
    await client.query('DELETE FROM days WHERE itinerary_id = $1', [itinerarioId]);
    
    // Insertar días
    for (const dia of dias) {
      const diaData = dia.toPersistence();
      const insertDayQuery = `
        INSERT INTO days (itinerary_id, fecha, numero)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      
      const dayResult = await client.query(insertDayQuery, [
        itinerarioId,
        diaData.fecha,
        diaData.numero
      ]);
      
      const dayId = dayResult.rows[0].id;
      
      // Insertar actividades del día
      for (const actividad of dia.actividades) {
        const actData = actividad.toPersistence();
        const insertActivityQuery = `
          INSERT INTO activities (
            day_id, titulo, descripcion, tipo,
            lugar_label, lugar_latitude, lugar_longitude,
            start_time, end_time, costo_amount, costo_currency,
            estado, metadata_externa
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        
        await client.query(insertActivityQuery, [
          dayId,
          actData.titulo,
          actData.descripcion,
          actData.tipo,
          actData.lugar_label,
          actData.lugar_latitude,
          actData.lugar_longitude,
          actData.start_time,
          actData.end_time,
          actData.costo_amount,
          actData.costo_currency,
          actData.estado,
          actData.metadata_externa
        ]);
      }
    }
  }

  async findById(id) {
    const itinerarioQuery = 'SELECT * FROM itineraries WHERE id = $1';
    const itinerarioResult = await pool.query(itinerarioQuery, [id]);
    
    if (itinerarioResult.rows.length === 0) {
      return null;
    }
    
    const itinerarioData = itinerarioResult.rows[0];
    
    // Cargar días
    const diasQuery = 'SELECT * FROM days WHERE itinerary_id = $1 ORDER BY numero';
    const diasResult = await pool.query(diasQuery, [id]);
    
    const dias = [];
    for (const diaData of diasResult.rows) {
      // Cargar actividades del día
      const actividadesQuery = `
        SELECT * FROM activities 
        WHERE day_id = $1 
        ORDER BY start_time
      `;
      const actividadesResult = await pool.query(actividadesQuery, [diaData.id]);
      
      const actividades = actividadesResult.rows.map(actData => 
        Actividad.fromPersistence(actData)
      );
      
      dias.push(Dia.fromPersistence(diaData, actividades));
    }
    
    return Itinerario.fromPersistence(itinerarioData, dias);
  }

  async findByUserId(userId) {
    const query = `
      SELECT * FROM itineraries 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    
    const itinerarios = [];
    for (const row of result.rows) {
      const itinerario = await this.findById(row.id);
      if (itinerario) {
        itinerarios.push(itinerario);
      }
    }
    
    return itinerarios;
  }

  async findByPlanRequestId(planRequestId) {
    const query = `
      SELECT * FROM itineraries 
      WHERE plan_request_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [planRequestId]);
    
    const itinerarios = [];
    for (const row of result.rows) {
      const itinerario = await this.findById(row.id);
      if (itinerario) {
        itinerarios.push(itinerario);
      }
    }
    
    return itinerarios;
  }

  async delete(id) {
    // Las actividades y días se eliminan en cascada por la BD
    const query = 'DELETE FROM itineraries WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM itineraries WHERE id = $1)';
    const result = await pool.query(query, [id]);
    
    return result.rows[0].exists;
  }
}
