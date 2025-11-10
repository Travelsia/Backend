import { google } from 'googleapis';

/**
 * Anti-Corruption Layer para Google Sheets API
 * Traduce nuestro dominio (Itinerario) al formato de Google Sheets
 */
export class GoogleSheetsAdapter {
  #auth;
  #sheets;
  #drive;
  #serviceAccountEmail;
  #templateId;

  constructor({ serviceAccountKey, templateId }) {
    if (!serviceAccountKey) {
      throw new Error('Google Service Account credentials are required');
    }

    if (!templateId) {
      throw new Error('Google Sheets Template ID is required');
    }

    try {
      // Parsear credenciales (puede venir como string o objeto)
      const credentials = typeof serviceAccountKey === 'string' 
        ? JSON.parse(serviceAccountKey) 
        : serviceAccountKey;

      // Configurar autenticación con Service Account
      this.#auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ]
      });

      this.#sheets = google.sheets({ version: 'v4', auth: this.#auth });
      this.#drive = google.drive({ version: 'v3', auth: this.#auth });
      this.#serviceAccountEmail = credentials.client_email;
      this.#templateId = templateId;

      console.log('✅ Google Sheets Adapter inicializado correctamente');
      console.log(`   Template ID: ${templateId}`);
    } catch (error) {
      throw new Error(`Error inicializando Google Sheets: ${error.message}`);
    }
  }

  /**
   * Exportar itinerario actualizando el template directamente
   * NOTA: Esta versión no hace copias, actualiza el template compartido
   */
  async exportarItinerario(itinerario) {
    try {
      // Usar el template ID directamente (no hacemos copia)
      const spreadsheetId = this.#templateId;

      // 1. Limpiar hojas primero
      await this.#limpiarHojas(spreadsheetId);

      // 2. Preparar datos en formato de sheets
      const datosResumen = this.#generarHojaResumen(itinerario);
      const datosDias = this.#generarHojaDias(itinerario);
      const datosActividades = this.#generarHojaActividades(itinerario);
      const datosPresupuesto = this.#generarHojaPresupuesto(itinerario);

      // 3. Escribir datos en las diferentes hojas
      await this.#escribirDatos(spreadsheetId, 'Resumen', datosResumen);
      await this.#escribirDatos(spreadsheetId, 'Días', datosDias);
      await this.#escribirDatos(spreadsheetId, 'Actividades', datosActividades);
      await this.#escribirDatos(spreadsheetId, 'Presupuesto', datosPresupuesto);

      // 4. Aplicar formato
      await this.#aplicarFormato(spreadsheetId);

      return {
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        serviceAccountEmail: this.#serviceAccountEmail,
        note: 'Template actualizado directamente (versión sin copias)'
      };

    } catch (error) {
      throw new Error(`Error exportando itinerario: ${error.message}`);
    }
  }

  /**
   * Actualizar spreadsheet existente con datos actualizados
   */
  async actualizarItinerario(spreadsheetId, itinerario) {
    try {
      // Verificar que el spreadsheet existe
      await this.#sheets.spreadsheets.get({ spreadsheetId });

      // Limpiar contenido actual (mantener encabezados)
      await this.#limpiarHojas(spreadsheetId);

      // Escribir datos actualizados
      const datosResumen = this.#generarHojaResumen(itinerario);
      const datosDias = this.#generarHojaDias(itinerario);
      const datosActividades = this.#generarHojaActividades(itinerario);
      const datosPresupuesto = this.#generarHojaPresupuesto(itinerario);

      await this.#escribirDatos(spreadsheetId, 'Resumen', datosResumen);
      await this.#escribirDatos(spreadsheetId, 'Días', datosDias);
      await this.#escribirDatos(spreadsheetId, 'Actividades', datosActividades);
      await this.#escribirDatos(spreadsheetId, 'Presupuesto', datosPresupuesto);

      return {
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        actualizado: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Error actualizando itinerario: ${error.message}`);
    }
  }

  /**
   * Obtener datos del spreadsheet (para sincronización bidireccional futura)
   */
  async obtenerDatosSheet(spreadsheetId) {
    try {
      const response = await this.#sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: ['Resumen!A:Z', 'Días!A:Z', 'Actividades!A:Z', 'Presupuesto!A:Z']
      });

      return response.data.valueRanges;

    } catch (error) {
      throw new Error(`Error obteniendo datos del sheet: ${error.message}`);
    }
  }

  /**
   * Verificar conexión con Google Sheets API
   */
  async verificarConexion() {
    try {
      const auth = await this.#auth.getClient();
      await auth.getAccessToken();
      
      return {
        conectado: true,
        serviceAccount: this.#serviceAccountEmail,
        mensaje: 'Conexión exitosa con Google Sheets API'
      };
    } catch (error) {
      return {
        conectado: false,
        error: error.message
      };
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  /**
   * Crear nuevo spreadsheet
   */
  /**
   * Copiar el template y renombrarlo
   */
  async #copiarTemplate(itinerario) {
    const titulo = `${itinerario.titulo} - ${itinerario.destino}`;
    
    try {
      // Hacer una copia del template usando Drive API
      const response = await this.#drive.files.copy({
        fileId: this.#templateId,
        requestBody: {
          name: titulo
        }
      });

      return response.data.id;
    } catch (error) {
      throw new Error(`Error copiando template: ${error.message}`);
    }
  }

  /**
   * Generar datos para hoja "Resumen"
   */
  #generarHojaResumen(itinerario) {
    const json = itinerario.toJSON();
    
    return [
      // Encabezados
      ['Campo', 'Valor'],
      // Datos
      ['ID', json.id],
      ['Título', json.titulo],
      ['Destino', json.destino],
      ['Fecha Inicio', json.startDate],
      ['Fecha Fin', json.endDate],
      ['Duración (días)', json.duracionDias],
      ['Presupuesto', json.presupuestoTotal?.toString() || '0'],
      ['Moneda', json.moneda],
      ['Estado', json.status],
      ['Notas', json.notas || ''],
      ['Creado', json.createdAt],
      ['Actualizado', json.updatedAt]
    ];
  }

  /**
   * Generar datos para hoja "Días"
   */
  #generarHojaDias(itinerario) {
    const json = itinerario.toJSON();
    const rows = [
      // Encabezados
      ['Día #', 'Fecha', 'Total Actividades', 'Actividades Confirmadas', 'Costo Total', 'Tiene Conflictos']
    ];

    json.dias.forEach((dia) => {
      rows.push([
        dia.numeroDia,
        dia.fecha,
        dia.actividades.length,
        dia.actividades.filter(a => a.estado === 'CONFIRMADO').length,
        dia.actividades.reduce((sum, a) => sum + (a.costo?.amount || 0), 0),
        dia.tieneSolapes ? 'SÍ' : 'NO'
      ]);
    });

    return rows;
  }

  /**
   * Generar datos para hoja "Actividades"
   */
  #generarHojaActividades(itinerario) {
    const json = itinerario.toJSON();
    const rows = [
      // Encabezados
      [
        'ID', 'Día #', 'Fecha', 'Título', 'Tipo', 'Estado', 
        'Lugar', 'Hora Inicio', 'Hora Fin', 'Duración (min)', 
        'Costo', 'Moneda', 'Descripción', 'Metadata'
      ]
    ];

    json.dias.forEach((dia) => {
      dia.actividades.forEach((actividad) => {
        rows.push([
          actividad.id,
          dia.numeroDia,
          dia.fecha,
          actividad.titulo,
          actividad.tipo,
          actividad.estado,
          actividad.lugar?.label || '',
          actividad.horaInicio || '',
          actividad.horaFin || '',
          actividad.duracionMinutos || 0,
          actividad.costo?.amount || 0,
          actividad.costo?.currency || '',
          actividad.descripcion || '',
          actividad.metadataExterna ? JSON.stringify(actividad.metadataExterna) : ''
        ]);
      });
    });

    return rows;
  }

  /**
   * Generar datos para hoja "Presupuesto"
   */
  #generarHojaPresupuesto(itinerario) {
    const json = itinerario.toJSON();
    const actividadesPorTipo = {};

    // Agrupar por tipo
    json.dias.forEach((dia) => {
      dia.actividades.forEach((actividad) => {
        const tipo = actividad.tipo;
        if (!actividadesPorTipo[tipo]) {
          actividadesPorTipo[tipo] = {
            cantidad: 0,
            costoTotal: 0,
            confirmadas: 0
          };
        }
        actividadesPorTipo[tipo].cantidad++;
        actividadesPorTipo[tipo].costoTotal += actividad.costo?.amount || 0;
        if (actividad.estado === 'CONFIRMADO') {
          actividadesPorTipo[tipo].confirmadas++;
        }
      });
    });

    const rows = [
      // Encabezados
      ['Tipo de Actividad', 'Cantidad', 'Confirmadas', 'Costo Total', 'Costo Promedio'],
      // Datos por tipo
      ...Object.entries(actividadesPorTipo).map(([tipo, datos]) => [
        tipo,
        datos.cantidad,
        datos.confirmadas,
        datos.costoTotal,
        datos.cantidad > 0 ? (datos.costoTotal / datos.cantidad).toFixed(2) : 0
      ]),
      // Totales
      [],
      ['TOTAL', '', '', json.presupuestoTotal || 0, '']
    ];

    return rows;
  }

  /**
   * Escribir datos en una hoja específica
   */
  async #escribirDatos(spreadsheetId, nombreHoja, datos) {
    const range = `${nombreHoja}!A1`;
    
    await this.#sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: datos }
    });
  }

  /**
   * Aplicar formato a las hojas
   */
  async #aplicarFormato(spreadsheetId) {
    const requests = [
      // Formato para encabezados (negrita, fondo gris)
      {
        repeatCell: {
          range: {
            sheetId: 0, // Resumen
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              textFormat: { bold: true }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      }
    ];

    await this.#sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: { requests }
    });
  }

  /**
   * Hacer el spreadsheet accesible (para AppSheet)
   */
  async #hacerPublico(spreadsheetId) {
    const drive = google.drive({ version: 'v3', auth: this.#auth });
    
    // Dar permisos de lectura a cualquiera con el link
    await drive.permissions.create({
      fileId: spreadsheetId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
  }

  /**
   * Limpiar contenido de las hojas (mantener encabezados)
   */
  async #limpiarHojas(spreadsheetId) {
    const ranges = [
      'Resumen!A2:Z',
      'Días!A2:Z',
      'Actividades!A2:Z',
      'Presupuesto!A2:Z'
    ];

    await this.#sheets.spreadsheets.values.batchClear({
      spreadsheetId,
      resource: { ranges }
    });
  }
}
