import { Itinerario } from '../domain/aggregates/Itinerario.js';
import { Actividad } from '../domain/entities/Actividad.js';
import { ItinerarioRepository } from '../infrastructure/repositories/ItinerarioRepository.js';
import { PlanRequestRepository } from '../infrastructure/repositories/PlanRequestRepository.js';
import { TimeSlot } from '../domain/value-objects/TimeSlot.js';
import { Money } from '../domain/value-objects/Money.js';
import { Place } from '../domain/value-objects/Place.js';
import { ActividadTipo } from '../domain/value-objects/ActividadTipo.js';
import { EstadoActividad } from '../domain/value-objects/EstadoActividad.js';
import { CalculadoraDeCostos } from '../domain/services/CalculadoraDeCostos.js';
import { ValidadorDeSolapes } from '../domain/services/ValidadorDeSolapes.js';

/**
 * Servicio de Aplicación: ItinerarioService
 * Orquesta casos de uso del contexto de Itinerarios
 */
export class ItinerarioService {
  constructor() {
    this.itinerarioRepository = new ItinerarioRepository();
    this.planRequestRepository = new PlanRequestRepository();
    this.calculadoraCostos = new CalculadoraDeCostos();
    this.validadorSolapes = new ValidadorDeSolapes();
  }

  /**
   * Caso de uso: Crear itinerario desde una solicitud de plan
   */
  async crearItinerarioDesdeSolicitud(planRequestId, userId, titulo = null) {
    try {
      // Obtener la solicitud de plan
      const solicitudPlan = await this.planRequestRepository.findById(planRequestId);
      
      if (!solicitudPlan) {
        return {
          success: false,
          error: 'Solicitud de plan no encontrada'
        };
      }

      // Verificar propiedad
      if (solicitudPlan.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para crear un itinerario desde esta solicitud'
        };
      }

      // Crear el itinerario usando el factory del agregado
      const itinerario = Itinerario.crearDesdeSolicitudPlan(solicitudPlan, titulo);
      
      // Persistir
      const saved = await this.itinerarioRepository.save(itinerario);
      
      // Marcar la solicitud como borrador generado
      solicitudPlan.markAsDraftGenerated();
      await this.planRequestRepository.save(solicitudPlan);

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
   * Caso de uso: Obtener itinerario por ID
   */
  async obtenerItinerario(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      // Verificar propiedad
      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para acceder a este itinerario'
        };
      }

      return {
        success: true,
        data: itinerario.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener todos los itinerarios del usuario
   */
  async obtenerItinerariosUsuario(userId) {
    try {
      const itinerarios = await this.itinerarioRepository.findByUserId(userId);
      
      return {
        success: true,
        data: itinerarios.map(it => it.toJSON())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Agregar actividad a un día
   */
  async agregarActividad(itinerarioId, userId, diaNumero, actividadData) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      // Crear la actividad
      const actividad = new Actividad({
        titulo: actividadData.titulo,
        descripcion: actividadData.descripcion || '',
        tipo: new ActividadTipo(actividadData.tipo),
        lugar: new Place(actividadData.lugar, actividadData.latitud, actividadData.longitud),
        timeSlot: new TimeSlot(actividadData.horaInicio, actividadData.horaFin),
        costo: new Money(actividadData.costoAmount, actividadData.costoCurrency || itinerario.monedaBase),
        estado: actividadData.estado ? new EstadoActividad(actividadData.estado) : new EstadoActividad(EstadoActividad.PROPUESTA),
        metadataExterna: actividadData.metadataExterna || null
      });

      // Agregar la actividad (esto verifica solapes automáticamente)
      itinerario.agregarActividad(diaNumero, actividad);

      // Persistir
      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Actualizar actividad
   */
  async actualizarActividad(itinerarioId, userId, diaNumero, actividadId, actualizaciones) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      // Preparar actualizaciones con objetos de dominio
      const actualizacionesDominio = {};
      
      if (actualizaciones.titulo) {
        actualizacionesDominio.titulo = actualizaciones.titulo;
      }
      
      if (actualizaciones.descripcion !== undefined) {
        actualizacionesDominio.descripcion = actualizaciones.descripcion;
      }
      
      if (actualizaciones.horaInicio && actualizaciones.horaFin) {
        actualizacionesDominio.timeSlot = new TimeSlot(
          actualizaciones.horaInicio,
          actualizaciones.horaFin
        );
      }
      
      if (actualizaciones.costoAmount) {
        actualizacionesDominio.costo = new Money(
          actualizaciones.costoAmount,
          actualizaciones.costoCurrency || itinerario.monedaBase
        );
      }

      itinerario.actualizarActividad(diaNumero, actividadId, actualizacionesDominio);

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Eliminar actividad
   */
  async eliminarActividad(itinerarioId, userId, diaNumero, actividadId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      itinerario.eliminarActividad(diaNumero, actividadId);

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Confirmar actividad
   */
  async confirmarActividad(itinerarioId, userId, diaNumero, actividadId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      itinerario.confirmarActividad(diaNumero, actividadId);

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Cancelar actividad
   */
  async cancelarActividad(itinerarioId, userId, diaNumero, actividadId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      itinerario.cancelarActividad(diaNumero, actividadId);

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Publicar itinerario
   */
  async publicarItinerario(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      itinerario.publicar();

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Archivar itinerario
   */
  async archivarItinerario(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      itinerario.archivar();

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Obtener resumen financiero
   */
  async obtenerResumenFinanciero(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para acceder a este itinerario'
        };
      }

      // Obtener la solicitud de plan para el presupuesto original
      let budgetMax = null;
      if (itinerario.planRequestId) {
        const solicitud = await this.planRequestRepository.findById(itinerario.planRequestId);
        if (solicitud) {
          budgetMax = solicitud.budget;
        }
      }

      const resumen = this.calculadoraCostos.obtenerResumenFinanciero(itinerario, budgetMax);

      return {
        success: true,
        data: resumen
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Validar integridad de horarios
   */
  async validarIntegridadHorarios(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para acceder a este itinerario'
        };
      }

      const validacion = this.validadorSolapes.validarIntegridadHorarios(itinerario);

      return {
        success: true,
        data: validacion
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener reporte de ocupación
   */
  async obtenerReporteOcupacion(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para acceder a este itinerario'
        };
      }

      const reporte = this.validadorSolapes.generarReporteOcupacion(itinerario);

      return {
        success: true,
        data: reporte
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Actualizar título y descripción
   */
  async actualizarInformacion(itinerarioId, userId, { titulo, descripcion }) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar este itinerario'
        };
      }

      if (titulo) {
        itinerario.actualizarTitulo(titulo);
      }

      if (descripcion !== undefined) {
        itinerario.actualizarDescripcion(descripcion);
      }

      const saved = await this.itinerarioRepository.save(itinerario);

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
   * Caso de uso: Eliminar itinerario
   */
  async eliminarItinerario(itinerarioId, userId) {
    try {
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId !== userId) {
        return {
          success: false,
          error: 'No tienes permiso para eliminar este itinerario'
        };
      }

      await this.itinerarioRepository.delete(itinerarioId);

      return {
        success: true,
        message: 'Itinerario eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
