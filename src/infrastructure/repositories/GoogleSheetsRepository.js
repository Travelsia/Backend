/**
 * Repository para gestionar vínculos entre Itinerarios y Google Sheets
 */
export class GoogleSheetsRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  /**
   * Guardar vínculo itinerario-spreadsheet
   */
  async save({ itinerarioId, userId, spreadsheetId, spreadsheetUrl }) {
    const query = `
      INSERT INTO google_sheets_exports (
        itinerary_id,
        user_id,
        spreadsheet_id,
        spreadsheet_url,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (itinerary_id)
      DO UPDATE SET
        spreadsheet_id = $3,
        spreadsheet_url = $4,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.#pool.query(query, [
      itinerarioId,
      userId,
      spreadsheetId,
      spreadsheetUrl
    ]);

    return result.rows[0];
  }

  /**
   * Obtener vínculo por itinerario ID
   */
  async findByItineraryId(itinerarioId) {
    const query = `
      SELECT * FROM google_sheets_exports
      WHERE itinerary_id = $1
    `;

    const result = await this.#pool.query(query, [itinerarioId]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los vínculos de un usuario
   */
  async findByUserId(userId) {
    const query = `
      SELECT * FROM google_sheets_exports
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;

    const result = await this.#pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Eliminar vínculo
   */
  async delete(itinerarioId) {
    const query = `
      DELETE FROM google_sheets_exports
      WHERE itinerary_id = $1
    `;

    await this.#pool.query(query, [itinerarioId]);
  }

  /**
   * Verificar si un itinerario ya tiene sheet exportado
   */
  async exists(itinerarioId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM google_sheets_exports
        WHERE itinerary_id = $1
      ) as exists
    `;

    const result = await this.#pool.query(query, [itinerarioId]);
    return result.rows[0].exists;
  }
}
