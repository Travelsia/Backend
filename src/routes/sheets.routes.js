import express from 'express';
import { GoogleSheetsService } from '../services/googleSheetsService.js';
import { GoogleSheetsAdapter } from '../infrastructure/adapters/GoogleSheetsAdapter.js';
import { GoogleSheetsRepository } from '../infrastructure/repositories/GoogleSheetsRepository.js';
import { ItinerarioRepository } from '../infrastructure/repositories/ItinerarioRepository.js';
import { pool } from '../db.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Inicializar dependencias
const googleSheetsRepository = new GoogleSheetsRepository(pool);
const itinerarioRepository = new ItinerarioRepository(pool);

// Verificar que las credenciales y template ID existan
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.warn('⚠️ GOOGLE_SERVICE_ACCOUNT_KEY no configurado - endpoints de Google Sheets no funcionarán');
}
if (!process.env.GOOGLE_SHEETS_TEMPLATE_ID) {
  console.warn('⚠️ GOOGLE_SHEETS_TEMPLATE_ID no configurado - endpoints de Google Sheets no funcionarán');
}

const googleSheetsAdapter = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEETS_TEMPLATE_ID)
  ? new GoogleSheetsAdapter({
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      templateId: process.env.GOOGLE_SHEETS_TEMPLATE_ID
    })
  : null;

const googleSheetsService = googleSheetsAdapter
  ? new GoogleSheetsService({
      googleSheetsAdapter,
      googleSheetsRepository,
      itinerarioRepository
    })
  : null;

/**
 * POST /sheets/export/:itineraryId
 * Exportar itinerario a Google Sheets (crea o actualiza)
 */
router.post('/export/:itineraryId', authenticate, async (req, res) => {
  try {
    if (!googleSheetsService) {
      return res.status(503).json({
        error: 'Google Sheets no está configurado. Configure GOOGLE_SERVICE_ACCOUNT_KEY en .env'
      });
    }

    const { itineraryId } = req.params;

    const resultado = await googleSheetsService.exportarItinerario(
      parseInt(itineraryId),
      req.user.id
    );

    res.status(resultado.esNuevo ? 201 : 200).json(resultado);

  } catch (error) {
    console.error('Error exportando a Google Sheets:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({
      error: error.message
    });
  }
});

/**
 * GET /sheets/itinerary/:itineraryId
 * Obtener información del sheet vinculado a un itinerario
 */
router.get('/itinerary/:itineraryId', authenticate, async (req, res) => {
  try {
    if (!googleSheetsService) {
      return res.status(503).json({
        error: 'Google Sheets no está configurado'
      });
    }

    const { itineraryId } = req.params;

    const info = await googleSheetsService.obtenerSheetInfo(
      parseInt(itineraryId),
      req.user.id
    );

    res.status(200).json(info);

  } catch (error) {
    console.error('Error obteniendo info del sheet:', error);
    res.status(error.message.includes('permisos') ? 403 : 404).json({
      error: error.message
    });
  }
});

/**
 * PUT /sheets/sync/:itineraryId
 * Sincronizar (actualizar) spreadsheet existente
 */
router.put('/sync/:itineraryId', authenticate, async (req, res) => {
  try {
    if (!googleSheetsService) {
      return res.status(503).json({
        error: 'Google Sheets no está configurado'
      });
    }

    const { itineraryId } = req.params;

    const resultado = await googleSheetsService.sincronizarSheet(
      parseInt(itineraryId),
      req.user.id
    );

    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error sincronizando sheet:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({
      error: error.message
    });
  }
});

/**
 * GET /sheets/my-sheets
 * Listar todos los sheets del usuario
 */
router.get('/my-sheets', authenticate, async (req, res) => {
  try {
    if (!googleSheetsService) {
      return res.status(503).json({
        error: 'Google Sheets no está configurado'
      });
    }

    const sheets = await googleSheetsService.listarSheetsUsuario(req.user.id);

    res.status(200).json({
      sheets,
      total: sheets.length
    });

  } catch (error) {
    console.error('Error listando sheets:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * DELETE /sheets/unlink/:itineraryId
 * Desvincular itinerario de su spreadsheet
 */
router.delete('/unlink/:itineraryId', authenticate, async (req, res) => {
  try {
    if (!googleSheetsService) {
      return res.status(503).json({
        error: 'Google Sheets no está configurado'
      });
    }

    const { itineraryId } = req.params;

    const resultado = await googleSheetsService.desvincularSheet(
      parseInt(itineraryId),
      req.user.id
    );

    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error desvinculando sheet:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({
      error: error.message
    });
  }
});

/**
 * GET /sheets/status
 * Verificar estado de la integración con Google Sheets
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    if (!googleSheetsService) {
      return res.status(200).json({
        conectado: false,
        configurado: false,
        mensaje: 'Google Sheets no está configurado. Configure GOOGLE_SERVICE_ACCOUNT_KEY en .env'
      });
    }

    const estado = await googleSheetsService.verificarEstado();

    res.status(200).json({
      ...estado,
      configurado: true
    });

  } catch (error) {
    console.error('Error verificando estado de Google Sheets:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

export { router as googleSheetsRoutes };
