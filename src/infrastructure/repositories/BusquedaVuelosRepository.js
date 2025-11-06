import { BusquedaVuelos } from '../../domain/aggregates/BusquedaVuelos.js';

/**
 * Repository para BusquedaVuelos con cache en memoria
 */
export class BusquedaVuelosRepository {
  #cache; // Map<string, BusquedaVuelos>
  #pool;

  constructor(pool) {
    this.#pool = pool;
    this.#cache = new Map();
    
    // Limpiar cache expirado cada 5 minutos
    setInterval(() => this.#limpiarCacheExpirado(), 5 * 60 * 1000);
  }

  /**
   * Guardar búsqueda (cache + BD opcional)
   */
  async save(busqueda) {
    // Guardar en cache
    this.#cache.set(busqueda.id, busqueda);

    // Guardar en BD para historial (opcional)
    try {
      const data = busqueda.toPersistence();
      
      await this.#pool.query(
        `INSERT INTO flight_searches 
        (id, user_id, origen, destino, fecha_salida, fecha_regreso, 
         numero_pasajeros, cabina, ofertas, creado_en, expira_en, filtros_aplicados)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) 
        DO UPDATE SET 
          ofertas = EXCLUDED.ofertas,
          expira_en = EXCLUDED.expira_en,
          filtros_aplicados = EXCLUDED.filtros_aplicados`,
        [
          data.id,
          data.user_id,
          data.origen,
          data.destino,
          data.fecha_salida,
          data.fecha_regreso,
          data.numero_pasajeros,
          data.cabina,
          data.ofertas,
          data.creado_en,
          data.expira_en,
          data.filtros_aplicados
        ]
      );

      return busqueda;
    } catch (error) {
      // Si falla la BD, no es crítico, tenemos el cache
      console.error('Error guardando búsqueda en BD:', error);
      return busqueda;
    }
  }

  /**
   * Buscar por ID (cache primero, luego BD)
   */
  async findById(id) {
    // Buscar en cache primero
    const cached = this.#cache.get(id);
    if (cached && cached.estaCacheValido) {
      return cached;
    }

    // Si no está en cache o expiró, buscar en BD
    try {
      const result = await this.#pool.query(
        'SELECT * FROM flight_searches WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const busqueda = BusquedaVuelos.fromPersistence(result.rows[0]);
      
      // Actualizar cache si aún es válido
      if (busqueda.estaCacheValido) {
        this.#cache.set(id, busqueda);
      }

      return busqueda;
    } catch (error) {
      console.error('Error buscando en BD:', error);
      return cached || null; // Retornar cache aunque esté expirado si hay error en BD
    }
  }

  /**
   * Buscar en cache por criterios exactos
   */
  async findByCriteria({ userId, origen, destino, fechaSalida, fechaRegreso, numeroPasajeros, cabina }) {
    // Generar clave de búsqueda
    const key = this.#generarClaveBusqueda({
      userId,
      origen,
      destino,
      fechaSalida,
      fechaRegreso,
      numeroPasajeros,
      cabina
    });

    // Buscar en cache
    for (const busqueda of this.#cache.values()) {
      if (this.#coincideCriterios(busqueda, key) && busqueda.estaCacheValido) {
        return busqueda;
      }
    }

    // Buscar en BD
    try {
      const result = await this.#pool.query(
        `SELECT * FROM flight_searches 
         WHERE user_id = $1 
           AND origen = $2 
           AND destino = $3 
           AND fecha_salida::date = $4::date
           AND (fecha_regreso IS NULL AND $5 IS NULL OR fecha_regreso::date = $5::date)
           AND numero_pasajeros = $6
           AND cabina = $7
           AND expira_en > NOW()
         ORDER BY creado_en DESC
         LIMIT 1`,
        [
          userId,
          origen,
          destino,
          fechaSalida,
          fechaRegreso,
          numeroPasajeros,
          cabina
        ]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const busqueda = BusquedaVuelos.fromPersistence(result.rows[0]);
      this.#cache.set(busqueda.id, busqueda);

      return busqueda;
    } catch (error) {
      console.error('Error buscando por criterios:', error);
      return null;
    }
  }

  /**
   * Obtener historial de búsquedas del usuario
   */
  async findByUserId(userId, limit = 10) {
    try {
      const result = await this.#pool.query(
        `SELECT * FROM flight_searches 
         WHERE user_id = $1 
         ORDER BY creado_en DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => BusquedaVuelos.fromPersistence(row));
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Eliminar búsqueda
   */
  async delete(id) {
    // Eliminar de cache
    this.#cache.delete(id);

    // Eliminar de BD
    try {
      await this.#pool.query(
        'DELETE FROM flight_searches WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error eliminando búsqueda:', error);
    }
  }

  /**
   * Limpiar cache expirado
   */
  #limpiarCacheExpirado() {
    const ahora = new Date();
    const expirados = [];

    for (const [id, busqueda] of this.#cache.entries()) {
      if (!busqueda.estaCacheValido) {
        expirados.push(id);
      }
    }

    expirados.forEach(id => this.#cache.delete(id));

    if (expirados.length > 0) {
      console.log(`Cache limpiado: ${expirados.length} búsquedas expiradas eliminadas`);
    }
  }

  /**
   * Generar clave única para búsqueda
   */
  #generarClaveBusqueda({ userId, origen, destino, fechaSalida, fechaRegreso, numeroPasajeros, cabina }) {
    const partes = [
      userId,
      origen,
      destino,
      new Date(fechaSalida).toISOString().split('T')[0],
      fechaRegreso ? new Date(fechaRegreso).toISOString().split('T')[0] : 'solo-ida',
      numeroPasajeros,
      cabina
    ];

    return partes.join('|');
  }

  /**
   * Verificar si búsqueda coincide con criterios
   */
  #coincideCriterios(busqueda, clave) {
    const busquedaKey = this.#generarClaveBusqueda({
      userId: busqueda.userId,
      origen: busqueda.origen.code,
      destino: busqueda.destino.code,
      fechaSalida: busqueda.fechaSalida,
      fechaRegreso: busqueda.fechaRegreso,
      numeroPasajeros: busqueda.numeroPasajeros,
      cabina: busqueda.cabina.tipo
    });

    return busquedaKey === clave;
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    const total = this.#cache.size;
    let validos = 0;
    let expirados = 0;

    for (const busqueda of this.#cache.values()) {
      if (busqueda.estaCacheValido) {
        validos++;
      } else {
        expirados++;
      }
    }

    return {
      total,
      validos,
      expirados,
      hitRate: total > 0 ? (validos / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Limpiar todo el cache (útil para testing)
   */
  clearCache() {
    this.#cache.clear();
  }
}
