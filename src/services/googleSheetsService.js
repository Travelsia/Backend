/**
 * Service de aplicación para exportación a Google Sheets
 */
export class GoogleSheetsService {
  #googleSheetsAdapter;
  #googleSheetsRepository;
  #itinerarioRepository;

  constructor({ googleSheetsAdapter, googleSheetsRepository, itinerarioRepository }) {
    this.#googleSheetsAdapter = googleSheetsAdapter;
    this.#googleSheetsRepository = googleSheetsRepository;
    this.#itinerarioRepository = itinerarioRepository;
  }

  /**
   * Caso de uso: Exportar itinerario a Google Sheets
   */
  async exportarItinerario(itinerarioId, userId) {
    try {
      // 1. Obtener itinerario
      const itinerario = await this.#itinerarioRepository.findById(itinerarioId);

      if (!itinerario) {
        throw new Error('Itinerario no encontrado');
      }

      // Verificar permisos
      if (itinerario.userId !== userId) {
        throw new Error('No tiene permisos para exportar este itinerario');
      }

      // 2. Verificar si ya existe una exportación
      const exportacionExistente = await this.#googleSheetsRepository.findByItineraryId(itinerarioId);

      let resultado;

      if (exportacionExistente) {
        // Actualizar spreadsheet existente
        console.log(`Actualizando spreadsheet existente: ${exportacionExistente.spreadsheet_id}`);
        resultado = await this.#googleSheetsAdapter.actualizarItinerario(
          exportacionExistente.spreadsheet_id,
          itinerario
        );
      } else {
        // Crear nuevo spreadsheet
        console.log('Creando nuevo spreadsheet...');
        resultado = await this.#googleSheetsAdapter.exportarItinerario(itinerario);
      }

      // 3. Guardar vínculo en BD
      await this.#googleSheetsRepository.save({
        itinerarioId,
        userId,
        spreadsheetId: resultado.spreadsheetId,
        spreadsheetUrl: resultado.spreadsheetUrl
      });

      return {
        itinerarioId,
        spreadsheetId: resultado.spreadsheetId,
        spreadsheetUrl: resultado.spreadsheetUrl,
        serviceAccountEmail: resultado.serviceAccountEmail,
        mensaje: exportacionExistente 
          ? 'Spreadsheet actualizado exitosamente' 
          : 'Spreadsheet creado exitosamente',
        esNuevo: !exportacionExistente
      };

    } catch (error) {
      throw new Error(`Error exportando itinerario: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Obtener información del sheet vinculado
   */
  async obtenerSheetInfo(itinerarioId, userId) {
    try {
      // Verificar permisos del itinerario
      const itinerario = await this.#itinerarioRepository.findById(itinerarioId);

      if (!itinerario) {
        throw new Error('Itinerario no encontrado');
      }

      if (itinerario.userId !== userId) {
        throw new Error('No tiene permisos para ver este itinerario');
      }

      // Obtener vínculo
      const vinculo = await this.#googleSheetsRepository.findByItineraryId(itinerarioId);

      if (!vinculo) {
        return {
          tieneSheet: false,
          mensaje: 'Este itinerario no ha sido exportado a Google Sheets'
        };
      }

      return {
        tieneSheet: true,
        spreadsheetId: vinculo.spreadsheet_id,
        spreadsheetUrl: vinculo.spreadsheet_url,
        creadoEn: vinculo.created_at,
        actualizadoEn: vinculo.updated_at
      };

    } catch (error) {
      throw new Error(`Error obteniendo información del sheet: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Sincronizar (actualizar) spreadsheet existente
   */
  async sincronizarSheet(itinerarioId, userId) {
    try {
      // Obtener itinerario
      const itinerario = await this.#itinerarioRepository.findById(itinerarioId);

      if (!itinerario) {
        throw new Error('Itinerario no encontrado');
      }

      if (itinerario.userId !== userId) {
        throw new Error('No tiene permisos para sincronizar este itinerario');
      }

      // Obtener vínculo existente
      const vinculo = await this.#googleSheetsRepository.findByItineraryId(itinerarioId);

      if (!vinculo) {
        throw new Error('Este itinerario no tiene un spreadsheet vinculado. Use /export primero.');
      }

      // Actualizar spreadsheet
      const resultado = await this.#googleSheetsAdapter.actualizarItinerario(
        vinculo.spreadsheet_id,
        itinerario
      );

      // Actualizar timestamp en BD
      await this.#googleSheetsRepository.save({
        itinerarioId,
        userId,
        spreadsheetId: vinculo.spreadsheet_id,
        spreadsheetUrl: vinculo.spreadsheet_url
      });

      return {
        itinerarioId,
        spreadsheetId: resultado.spreadsheetId,
        spreadsheetUrl: resultado.spreadsheetUrl,
        actualizado: resultado.actualizado,
        mensaje: 'Spreadsheet sincronizado exitosamente'
      };

    } catch (error) {
      throw new Error(`Error sincronizando sheet: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Listar todos los sheets del usuario
   */
  async listarSheetsUsuario(userId) {
    try {
      const vinculos = await this.#googleSheetsRepository.findByUserId(userId);

      return vinculos.map(v => ({
        itinerarioId: v.itinerary_id,
        spreadsheetId: v.spreadsheet_id,
        spreadsheetUrl: v.spreadsheet_url,
        creadoEn: v.created_at,
        actualizadoEn: v.updated_at
      }));

    } catch (error) {
      throw new Error(`Error listando sheets: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Eliminar vínculo (no elimina el spreadsheet, solo el registro)
   */
  async desvincularSheet(itinerarioId, userId) {
    try {
      // Verificar permisos
      const itinerario = await this.#itinerarioRepository.findById(itinerarioId);

      if (!itinerario) {
        throw new Error('Itinerario no encontrado');
      }

      if (itinerario.userId !== userId) {
        throw new Error('No tiene permisos para desvincular este itinerario');
      }

      await this.#googleSheetsRepository.delete(itinerarioId);

      return {
        mensaje: 'Vínculo eliminado exitosamente',
        nota: 'El spreadsheet en Google Drive no fue eliminado'
      };

    } catch (error) {
      throw new Error(`Error desvinculando sheet: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Verificar estado de la integración
   */
  async verificarEstado() {
    try {
      return await this.#googleSheetsAdapter.verificarConexion();
    } catch (error) {
      return {
        conectado: false,
        error: error.message
      };
    }
  }
}
