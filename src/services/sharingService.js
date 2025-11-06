import { Comparticion } from '../domain/aggregates/Comparticion.js';
import { SharedItineraryRepository } from '../infrastructure/repositories/SharedItineraryRepository.js';
import { ItinerarioRepository } from '../infrastructure/repositories/ItinerarioRepository.js';
import { Permiso } from '../domain/value-objects/Permiso.js';

/**
 * Service de Aplicación: SharingService
 * Orquesta casos de uso del contexto de Colaboración
 */
export class SharingService {
  constructor() {
    this.sharedItineraryRepository = new SharedItineraryRepository();
    this.itinerarioRepository = new ItinerarioRepository();
  }

  /**
   * Caso de uso: Compartir itinerario
   */
  async compartirItinerario({
    itinerarioId,
    propietarioId,
    compartidoConEmail,
    permiso,
    mensaje = null,
    diasValidez = 7
  }) {
    try {
      // Verificar que el itinerario existe
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      // Verificar que el usuario es el propietario
      if (itinerario.userId !== propietarioId) {
        return {
          success: false,
          error: 'Solo el propietario puede compartir el itinerario'
        };
      }

      // Verificar que no se intenta compartir con el propietario
      const propietarioResult = await this.#obtenerUsuarioPorId(propietarioId);
      if (propietarioResult.email === compartidoConEmail) {
        return {
          success: false,
          error: 'No puedes compartir un itinerario contigo mismo'
        };
      }

      // Verificar si ya existe una compartición activa con este email
      const comparticionesExistentes = await this.sharedItineraryRepository.findByItinerarioId(itinerarioId);
      const yaCompartido = comparticionesExistentes.some(c => 
        c.compartidoConEmail === compartidoConEmail && 
        (c.estado.isPendiente() || c.estado.estaActivo())
      );

      if (yaCompartido) {
        return {
          success: false,
          error: 'Ya existe una compartición activa con este usuario'
        };
      }

      // Crear la compartición
      const comparticion = Comparticion.crear({
        itinerarioId,
        propietarioId,
        compartidoConEmail,
        permiso,
        mensaje,
        diasValidez
      });

      // Guardar
      const saved = await this.sharedItineraryRepository.save(comparticion);

      // TODO: Enviar email de notificación al destinatario
      // await emailService.enviarInvitacionComparticion(saved);

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
   * Caso de uso: Aceptar compartición por token
   */
  async aceptarComparticion(token, userId, userEmail) {
    try {
      const comparticion = await this.sharedItineraryRepository.findByToken(token);

      if (!comparticion) {
        return {
          success: false,
          error: 'Link de compartición no encontrado'
        };
      }

      // Verificar que el email coincide
      if (comparticion.compartidoConEmail !== userEmail) {
        return {
          success: false,
          error: 'Este link no fue generado para tu email'
        };
      }

      // Aceptar la compartición
      comparticion.aceptar(userId);

      // Guardar
      const saved = await this.sharedItineraryRepository.save(comparticion);

      // Obtener el itinerario completo
      const itinerario = await this.itinerarioRepository.findById(comparticion.itinerarioId);

      return {
        success: true,
        data: {
          comparticion: saved.toJSON(),
          itinerario: itinerario.toJSON()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener información de compartición por token (antes de aceptar)
   */
  async obtenerInfoComparticion(token) {
    try {
      const comparticion = await this.sharedItineraryRepository.findByToken(token);

      if (!comparticion) {
        return {
          success: false,
          error: 'Link de compartición no encontrado'
        };
      }

      if (!comparticion.linkEsValido()) {
        return {
          success: false,
          error: 'Este link ha expirado'
        };
      }

      // Obtener información básica del itinerario
      const itinerario = await this.itinerarioRepository.findById(comparticion.itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      // Obtener información del propietario
      const propietario = await this.#obtenerUsuarioPorId(comparticion.propietarioId);

      return {
        success: true,
        data: {
          comparticion: {
            permiso: comparticion.permiso.toJSON(),
            mensaje: comparticion.mensaje,
            fechaExpiracion: comparticion.link.fechaExpiracion,
            tiempoRestante: comparticion.link.tiempoRestanteLegible()
          },
          itinerario: {
            id: itinerario.id,
            titulo: itinerario.titulo,
            descripcion: itinerario.descripcion,
            fechaInicio: itinerario.startDate,
            fechaFin: itinerario.endDate,
            duracionDias: itinerario.dateRange.getDurationInDays()
          },
          propietario: {
            id: propietario.id,
            nombre: propietario.name,
            email: propietario.email
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Revocar acceso
   */
  async revocarAcceso(comparticionId, propietarioId) {
    try {
      const comparticion = await this.sharedItineraryRepository.findById(comparticionId);

      if (!comparticion) {
        return {
          success: false,
          error: 'Compartición no encontrada'
        };
      }

      // Revocar
      comparticion.revocar(propietarioId);

      // Guardar
      const saved = await this.sharedItineraryRepository.save(comparticion);

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
   * Caso de uso: Actualizar permiso
   */
  async actualizarPermiso(comparticionId, propietarioId, nuevoPermiso) {
    try {
      const comparticion = await this.sharedItineraryRepository.findById(comparticionId);

      if (!comparticion) {
        return {
          success: false,
          error: 'Compartición no encontrada'
        };
      }

      // Actualizar
      comparticion.actualizarPermiso(propietarioId, nuevoPermiso);

      // Guardar
      const saved = await this.sharedItineraryRepository.save(comparticion);

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
   * Caso de uso: Renovar link de compartición
   */
  async renovarLink(comparticionId, propietarioId, diasValidez = 7) {
    try {
      const comparticion = await this.sharedItineraryRepository.findById(comparticionId);

      if (!comparticion) {
        return {
          success: false,
          error: 'Compartición no encontrada'
        };
      }

      // Renovar
      comparticion.renovarLink(propietarioId, diasValidez);

      // Guardar
      const saved = await this.sharedItineraryRepository.save(comparticion);

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
   * Caso de uso: Listar itinerarios compartidos por mí
   */
  async listarCompartidosPorMi(userId) {
    try {
      const comparticiones = await this.sharedItineraryRepository.findByOwnerId(userId);

      // Enriquecer con información del itinerario
      const comparticionesConItinerario = await Promise.all(
        comparticiones.map(async (comp) => {
          const itinerario = await this.itinerarioRepository.findById(comp.itinerarioId);
          return {
            ...comp.toJSON(),
            itinerario: itinerario ? {
              id: itinerario.id,
              titulo: itinerario.titulo,
              fechaInicio: itinerario.startDate,
              fechaFin: itinerario.endDate
            } : null
          };
        })
      );

      return {
        success: true,
        data: comparticionesConItinerario
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Listar itinerarios compartidos conmigo
   */
  async listarCompartidosConmigo(userId) {
    try {
      const comparticiones = await this.sharedItineraryRepository.findBySharedWithId(userId);

      // Enriquecer con información del itinerario y propietario
      const comparticionesEnriquecidas = await Promise.all(
        comparticiones.map(async (comp) => {
          const itinerario = await this.itinerarioRepository.findById(comp.itinerarioId);
          const propietario = await this.#obtenerUsuarioPorId(comp.propietarioId);
          
          return {
            ...comp.toJSON(),
            itinerario: itinerario ? {
              id: itinerario.id,
              titulo: itinerario.titulo,
              descripcion: itinerario.descripcion,
              fechaInicio: itinerario.startDate,
              fechaFin: itinerario.endDate
            } : null,
            propietario: {
              id: propietario.id,
              nombre: propietario.name
            }
          };
        })
      );

      return {
        success: true,
        data: comparticionesEnriquecidas
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Listar comparticiones de un itinerario
   */
  async listarComparticionesItinerario(itinerarioId, userId) {
    try {
      // Verificar que el usuario es el propietario
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
          error: 'Solo el propietario puede ver las comparticiones'
        };
      }

      const comparticiones = await this.sharedItineraryRepository.findByItinerarioId(itinerarioId);

      return {
        success: true,
        data: comparticiones.map(c => c.toJSON())
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Verificar permisos de usuario en itinerario
   */
  async verificarPermisos(itinerarioId, userId) {
    try {
      // Verificar si es el propietario
      const itinerario = await this.itinerarioRepository.findById(itinerarioId);
      
      if (!itinerario) {
        return {
          success: false,
          error: 'Itinerario no encontrado'
        };
      }

      if (itinerario.userId === userId) {
        return {
          success: true,
          data: {
            tieneAcceso: true,
            permiso: new Permiso(Permiso.PROPIETARIO).toJSON(),
            esPropietario: true
          }
        };
      }

      // Verificar si tiene acceso compartido
      const permiso = await this.sharedItineraryRepository.getUserRole(itinerarioId, userId);

      if (!permiso) {
        return {
          success: true,
          data: {
            tieneAcceso: false,
            permiso: null,
            esPropietario: false
          }
        };
      }

      return {
        success: true,
        data: {
          tieneAcceso: true,
          permiso: permiso.toJSON(),
          esPropietario: false
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener estadísticas de compartición
   */
  async obtenerEstadisticas(userId) {
    try {
      const stats = await this.sharedItineraryRepository.getStats(userId);

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Limpiar comparticiones expiradas
   */
  async limpiarExpiradas() {
    try {
      const expiradas = await this.sharedItineraryRepository.cleanupExpired();

      return {
        success: true,
        data: {
          cantidad: expiradas.length,
          comparticiones: expiradas.map(c => c.toJSON())
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Método auxiliar privado
  async #obtenerUsuarioPorId(userId) {
    const { pool } = await import('../db.js');
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return result.rows[0];
  }
}
