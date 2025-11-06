import express from 'express';
import { SharingService } from '../services/sharingService.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();
const sharingService = new SharingService();

/**
 * POST /sharing/share
 * Compartir un itinerario con otro usuario
 */
router.post('/share', authenticate, async (req, res) => {
  try {
    const {
      itinerarioId,
      compartidoConEmail,
      permiso,
      mensaje,
      diasValidez
    } = req.body;

    // Validaciones
    if (!itinerarioId || !compartidoConEmail || !permiso) {
      return res.status(400).json({
        success: false,
        error: 'itinerarioId, compartidoConEmail y permiso son requeridos'
      });
    }

    const result = await sharingService.compartirItinerario({
      itinerarioId: parseInt(itinerarioId),
      propietarioId: req.user.id,
      compartidoConEmail,
      permiso,
      mensaje: mensaje || null,
      diasValidez: diasValidez || 7
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Error compartiendo itinerario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /sharing/link/:token
 * Obtener información de una compartición por token (antes de aceptar)
 */
router.get('/link/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await sharingService.obtenerInfoComparticion(token);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error obteniendo info de compartición:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /sharing/accept/:token
 * Aceptar una compartición mediante token
 */
router.post('/accept/:token', authenticate, async (req, res) => {
  try {
    const { token } = req.params;

    const result = await sharingService.aceptarComparticion(
      token,
      req.user.id,
      req.user.email
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error aceptando compartición:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /sharing/:comparticionId/revoke
 * Revocar acceso a una compartición
 */
router.delete('/:comparticionId/revoke', authenticate, async (req, res) => {
  try {
    const comparticionId = parseInt(req.params.comparticionId);

    if (isNaN(comparticionId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de compartición inválido'
      });
    }

    const result = await sharingService.revocarAcceso(
      comparticionId,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error revocando acceso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /sharing/:comparticionId/permission
 * Actualizar permiso de una compartición
 */
router.patch('/:comparticionId/permission', authenticate, async (req, res) => {
  try {
    const comparticionId = parseInt(req.params.comparticionId);
    const { permiso } = req.body;

    if (isNaN(comparticionId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de compartición inválido'
      });
    }

    if (!permiso) {
      return res.status(400).json({
        success: false,
        error: 'El permiso es requerido'
      });
    }

    const result = await sharingService.actualizarPermiso(
      comparticionId,
      req.user.id,
      permiso
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error actualizando permiso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /sharing/:comparticionId/renew
 * Renovar link de compartición
 */
router.patch('/:comparticionId/renew', authenticate, async (req, res) => {
  try {
    const comparticionId = parseInt(req.params.comparticionId);
    const { diasValidez } = req.body;

    if (isNaN(comparticionId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de compartición inválido'
      });
    }

    const result = await sharingService.renovarLink(
      comparticionId,
      req.user.id,
      diasValidez || 7
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error renovando link:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /sharing/shared-by-me
 * Listar itinerarios compartidos por mí
 */
router.get('/shared-by-me', authenticate, async (req, res) => {
  try {
    const result = await sharingService.listarCompartidosPorMi(req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error listando compartidos por mí:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /sharing/shared-with-me
 * Listar itinerarios compartidos conmigo
 */
router.get('/shared-with-me', authenticate, async (req, res) => {
  try {
    const result = await sharingService.listarCompartidosConmigo(req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error listando compartidos conmigo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /sharing/itinerary/:itinerarioId
 * Listar todas las comparticiones de un itinerario específico
 */
router.get('/itinerary/:itinerarioId', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.itinerarioId);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await sharingService.listarComparticionesItinerario(
      itinerarioId,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error listando comparticiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /sharing/permissions/:itinerarioId
 * Verificar permisos del usuario actual en un itinerario
 */
router.get('/permissions/:itinerarioId', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.itinerarioId);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await sharingService.verificarPermisos(
      itinerarioId,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error verificando permisos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /sharing/stats
 * Obtener estadísticas de compartición del usuario
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await sharingService.obtenerEstadisticas(req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /sharing/cleanup
 * Limpiar comparticiones expiradas (admin/maintenance)
 */
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    // TODO: Agregar verificación de rol admin
    
    const result = await sharingService.limpiarExpiradas();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error limpiando expiradas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export { router as sharingRoutes };
