import { Router } from 'express';
import { ItinerarioService } from '../services/itinerarioService.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
const itinerarioService = new ItinerarioService();

/**
 * POST /itineraries/from-plan/:planRequestId
 * Crear itinerario desde una solicitud de plan
 */
router.post('/from-plan/:planRequestId', authenticate, async (req, res) => {
  try {
    const planRequestId = parseInt(req.params.planRequestId);
    const { titulo } = req.body;

    if (isNaN(planRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    const result = await itinerarioService.crearItinerarioDesdeSolicitud(
      planRequestId,
      req.user.id,
      titulo
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /itineraries
 * Obtener todos los itinerarios del usuario
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await itinerarioService.obtenerItinerariosUsuario(req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /itineraries/:id
 * Obtener un itinerario específico
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.obtenerItinerario(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /itineraries/:id
 * Actualizar título y descripción del itinerario
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);
    const { titulo, descripcion } = req.body;

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.actualizarInformacion(
      itinerarioId,
      req.user.id,
      { titulo, descripcion }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /itineraries/:id
 * Eliminar un itinerario
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.eliminarItinerario(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /itineraries/:id/days/:dayNumber/activities
 * Agregar actividad a un día específico
 */
router.post('/:id/days/:dayNumber/activities', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);
    const diaNumero = parseInt(req.params.dayNumber);
    const actividadData = req.body;

    if (isNaN(itinerarioId) || isNaN(diaNumero)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    // Validar campos requeridos
    if (!actividadData.titulo || !actividadData.tipo || !actividadData.lugar ||
        !actividadData.horaInicio || !actividadData.horaFin || actividadData.costoAmount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: titulo, tipo, lugar, horaInicio, horaFin, costoAmount'
      });
    }

    const result = await itinerarioService.agregarActividad(
      itinerarioId,
      req.user.id,
      diaNumero,
      actividadData
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /itineraries/:id/days/:dayNumber/activities/:activityId
 * Actualizar una actividad
 */
router.patch('/:id/days/:dayNumber/activities/:activityId', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);
    const diaNumero = parseInt(req.params.dayNumber);
    const actividadId = parseInt(req.params.activityId);
    const actualizaciones = req.body;

    if (isNaN(itinerarioId) || isNaN(diaNumero) || isNaN(actividadId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    const result = await itinerarioService.actualizarActividad(
      itinerarioId,
      req.user.id,
      diaNumero,
      actividadId,
      actualizaciones
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /itineraries/:id/days/:dayNumber/activities/:activityId
 * Eliminar una actividad
 */
router.delete('/:id/days/:dayNumber/activities/:activityId', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);
    const diaNumero = parseInt(req.params.dayNumber);
    const actividadId = parseInt(req.params.activityId);

    if (isNaN(itinerarioId) || isNaN(diaNumero) || isNaN(actividadId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    const result = await itinerarioService.eliminarActividad(
      itinerarioId,
      req.user.id,
      diaNumero,
      actividadId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /itineraries/:id/days/:dayNumber/activities/:activityId/confirm
 * Confirmar una actividad
 */
router.patch('/:id/days/:dayNumber/activities/:activityId/confirm', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);
    const diaNumero = parseInt(req.params.dayNumber);
    const actividadId = parseInt(req.params.activityId);

    if (isNaN(itinerarioId) || isNaN(diaNumero) || isNaN(actividadId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    const result = await itinerarioService.confirmarActividad(
      itinerarioId,
      req.user.id,
      diaNumero,
      actividadId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error confirming activity:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /itineraries/:id/days/:dayNumber/activities/:activityId/cancel
 * Cancelar una actividad
 */
router.patch('/:id/days/:dayNumber/activities/:activityId/cancel', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);
    const diaNumero = parseInt(req.params.dayNumber);
    const actividadId = parseInt(req.params.activityId);

    if (isNaN(itinerarioId) || isNaN(diaNumero) || isNaN(actividadId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    const result = await itinerarioService.cancelarActividad(
      itinerarioId,
      req.user.id,
      diaNumero,
      actividadId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error canceling activity:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /itineraries/:id/publish
 * Publicar itinerario
 */
router.patch('/:id/publish', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.publicarItinerario(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error publishing itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /itineraries/:id/archive
 * Archivar itinerario
 */
router.patch('/:id/archive', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.archivarItinerario(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error archiving itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /itineraries/:id/financial-summary
 * Obtener resumen financiero del itinerario
 */
router.get('/:id/financial-summary', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.obtenerResumenFinanciero(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /itineraries/:id/schedule-validation
 * Validar integridad de horarios
 */
router.get('/:id/schedule-validation', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.validarIntegridadHorarios(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error validating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /itineraries/:id/occupancy-report
 * Obtener reporte de ocupación
 */
router.get('/:id/occupancy-report', authenticate, async (req, res) => {
  try {
    const itinerarioId = parseInt(req.params.id);

    if (isNaN(itinerarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de itinerario inválido'
      });
    }

    const result = await itinerarioService.obtenerReporteOcupacion(itinerarioId, req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching occupancy report:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
