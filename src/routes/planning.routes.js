import { Router } from 'express';
import { PlanningService } from '../services/planningService.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
const planningService = new PlanningService();

/**
 * POST /planning/requests
 * Crear una nueva solicitud de plan de viaje
 */
router.post('/requests', authenticate, async (req, res) => {
  try {
    const { destination, startDate, endDate, budgetAmount, budgetCurrency, interests } = req.body;
    
    // Validaciones básicas
    if (!destination || !startDate || !endDate || !budgetAmount) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: destination, startDate, endDate, budgetAmount'
      });
    }

    const result = await planningService.createPlanRequest({
      userId: req.user.id,
      destination,
      startDate,
      endDate,
      budgetAmount: parseFloat(budgetAmount),
      budgetCurrency: budgetCurrency || 'USD',
      interests: interests || []
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating plan request:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /planning/requests
 * Obtener todas las solicitudes del usuario autenticado
 */
router.get('/requests', authenticate, async (req, res) => {
  try {
    const result = await planningService.getUserPlanRequests(req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching plan requests:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /planning/requests/:id
 * Obtener una solicitud específica por ID
 */
router.get('/requests/:id', authenticate, async (req, res) => {
  try {
    const planRequestId = parseInt(req.params.id);

    if (isNaN(planRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    const result = await planningService.getPlanRequestById(planRequestId, req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching plan request:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /planning/requests/:id/interests
 * Agregar un interés a la solicitud
 */
router.post('/requests/:id/interests', authenticate, async (req, res) => {
  try {
    const planRequestId = parseInt(req.params.id);
    const { interest } = req.body;

    if (isNaN(planRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    if (!interest) {
      return res.status(400).json({
        success: false,
        error: 'El campo interest es requerido'
      });
    }

    const result = await planningService.addInterestToPlanRequest(
      planRequestId,
      req.user.id,
      interest
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error adding interest:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /planning/requests/:id/interests
 * Remover un interés de la solicitud
 */
router.delete('/requests/:id/interests', authenticate, async (req, res) => {
  try {
    const planRequestId = parseInt(req.params.id);
    const { interest } = req.body;

    if (isNaN(planRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    if (!interest) {
      return res.status(400).json({
        success: false,
        error: 'El campo interest es requerido'
      });
    }

    const result = await planningService.removeInterestFromPlanRequest(
      planRequestId,
      req.user.id,
      interest
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error removing interest:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /planning/requests/:id/complete
 * Marcar solicitud como completada
 */
router.patch('/requests/:id/complete', authenticate, async (req, res) => {
  try {
    const planRequestId = parseInt(req.params.id);

    if (isNaN(planRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    const result = await planningService.markPlanRequestAsCompleted(
      planRequestId,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing plan request:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /planning/requests/:id
 * Eliminar una solicitud de plan
 */
router.delete('/requests/:id', authenticate, async (req, res) => {
  try {
    const planRequestId = parseInt(req.params.id);

    if (isNaN(planRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    const result = await planningService.deletePlanRequest(
      planRequestId,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting plan request:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
