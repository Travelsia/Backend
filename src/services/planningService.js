import { SolicitudPlan } from '../domain/aggregates/SolicitudPlan.js';
import { PlanRequestRepository } from '../infrastructure/repositories/PlanRequestRepository.js';

/**
 * Servicio de Aplicación: PlanningService
 * Orquesta casos de uso del contexto de Planificación
 */
export class PlanningService {
  constructor() {
    this.repository = new PlanRequestRepository();
  }

  /**
   * Caso de uso: Crear una nueva solicitud de plan
   */
  async createPlanRequest({ userId, destination, startDate, endDate, budgetAmount, budgetCurrency = 'USD', interests = [] }) {
    try {
      // Crear el agregado usando el método factory
      const solicitudPlan = SolicitudPlan.create({
        userId,
        destination,
        startDate,
        endDate,
        budgetAmount,
        budgetCurrency,
        interests
      });

      // Persistir
      const saved = await this.repository.save(solicitudPlan);
      
      return {
        success: true,
        data: saved.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener solicitud por ID
   */
  async getPlanRequestById(planRequestId, userId) {
    try {
      const solicitudPlan = await this.repository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      // Verificar que el usuario sea el propietario
      if (solicitudPlan.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para acceder a esta solicitud'
        };
      }

      return {
        success: true,
        data: solicitudPlan.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener todas las solicitudes de un usuario
   */
  async getUserPlanRequests(userId) {
    try {
      const solicitudes = await this.repository.findByUserId(userId);
      
      return {
        success: true,
        data: solicitudes.map(s => s.toJSON())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Agregar un interés a la solicitud
   */
  async addInterestToPlanRequest(planRequestId, userId, interest) {
    try {
      const solicitudPlan = await this.repository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      if (solicitudPlan.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar esta solicitud'
        };
      }

      if (!solicitudPlan.canBeModified()) {
        return {
          success: false,
          error: 'La solicitud no puede ser modificada en su estado actual'
        };
      }

      solicitudPlan.addInterest(interest);
      const updated = await this.repository.save(solicitudPlan);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Remover un interés de la solicitud
   */
  async removeInterestFromPlanRequest(planRequestId, userId, interest) {
    try {
      const solicitudPlan = await this.repository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      if (solicitudPlan.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar esta solicitud'
        };
      }

      if (!solicitudPlan.canBeModified()) {
        return {
          success: false,
          error: 'La solicitud no puede ser modificada en su estado actual'
        };
      }

      solicitudPlan.removeInterest(interest);
      const updated = await this.repository.save(solicitudPlan);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Marcar solicitud como borrador generado
   * (Se llamará cuando el sistema genere el borrador del itinerario)
   */
  async markPlanRequestAsDraftGenerated(planRequestId) {
    try {
      const solicitudPlan = await this.repository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      solicitudPlan.markAsDraftGenerated();
      const updated = await this.repository.save(solicitudPlan);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Marcar solicitud como completada
   */
  async markPlanRequestAsCompleted(planRequestId, userId) {
    try {
      const solicitudPlan = await this.repository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      if (solicitudPlan.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar esta solicitud'
        };
      }

      solicitudPlan.markAsCompleted();
      const updated = await this.repository.save(solicitudPlan);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Eliminar solicitud de plan
   */
  async deletePlanRequest(planRequestId, userId) {
    try {
      const solicitudPlan = await this.repository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      if (solicitudPlan.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para eliminar esta solicitud'
        };
      }

      await this.repository.delete(planRequestId);

      return {
        success: true,
        message: 'Solicitud eliminada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
