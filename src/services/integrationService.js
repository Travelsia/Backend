import { BusquedaVuelos } from '../domain/aggregates/BusquedaVuelos.js';
import { ActividadTipo } from '../domain/value-objects/ActividadTipo.js';

/**
 * Service de aplicación para integraciones (principalmente vuelos)
 */
export class IntegrationService {
  #busquedaVuelosRepository;
  #itinerarioRepository;
  #amadeusAdapter;

  constructor({ busquedaVuelosRepository, itinerarioRepository, amadeusAdapter }) {
    this.#busquedaVuelosRepository = busquedaVuelosRepository;
    this.#itinerarioRepository = itinerarioRepository;
    this.#amadeusAdapter = amadeusAdapter;
  }

  /**
   * Caso de uso: Buscar vuelos
   */
  async buscarVuelos({
    userId,
    origen,
    destino,
    fechaSalida,
    fechaRegreso,
    numeroPasajeros = 1,
    cabina = 'ECONOMY',
    forzarNuevaBusqueda = false
  }) {
    try {
      // Si no se fuerza nueva búsqueda, verificar cache
      if (!forzarNuevaBusqueda) {
        const busquedaCache = await this.#busquedaVuelosRepository.findByCriteria({
          userId,
          origen,
          destino,
          fechaSalida,
          fechaRegreso,
          numeroPasajeros,
          cabina
        });

        if (busquedaCache && busquedaCache.estaCacheValido) {
          console.log('Retornando resultados del cache');
          return busquedaCache;
        }
      }

      // Crear agregado de búsqueda
      const busqueda = BusquedaVuelos.crear({
        userId,
        origen,
        destino,
        fechaSalida,
        fechaRegreso,
        numeroPasajeros,
        cabina
      });

      // Buscar en Amadeus
      const ofertas = await this.#amadeusAdapter.buscarVuelos({
        origen,
        destino,
        fechaSalida,
        fechaRegreso,
        adultos: numeroPasajeros,
        cabina
      });

      // Actualizar ofertas en el agregado
      busqueda.actualizarOfertas(ofertas);

      // Guardar en cache y BD
      await this.#busquedaVuelosRepository.save(busqueda);

      return busqueda;

    } catch (error) {
      throw new Error(`Error buscando vuelos: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Obtener búsqueda por ID
   */
  async obtenerBusqueda(busquedaId, userId) {
    try {
      const busqueda = await this.#busquedaVuelosRepository.findById(busquedaId);

      if (!busqueda) {
        throw new Error('Búsqueda no encontrada');
      }

      // Verificar permisos
      if (busqueda.userId !== userId) {
        throw new Error('No tiene permisos para ver esta búsqueda');
      }

      return busqueda;

    } catch (error) {
      throw new Error(`Error obteniendo búsqueda: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Aplicar filtros a una búsqueda existente
   */
  async aplicarFiltros(busquedaId, userId, filtros) {
    try {
      const busqueda = await this.obtenerBusqueda(busquedaId, userId);

      if (!busqueda.estaCacheValido) {
        throw new Error('La búsqueda ha expirado. Por favor, realice una nueva búsqueda.');
      }

      // Aplicar filtros
      const ofertasFiltradas = busqueda.aplicarFiltros(filtros);

      // Actualizar en repositorio
      await this.#busquedaVuelosRepository.save(busqueda);

      return {
        busqueda,
        ofertasFiltradas,
        filtrosAplicados: busqueda.filtrosAplicados
      };

    } catch (error) {
      throw new Error(`Error aplicando filtros: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Ordenar ofertas
   */
  async ordenarOfertas(busquedaId, userId, criterio) {
    try {
      const busqueda = await this.obtenerBusqueda(busquedaId, userId);

      if (!busqueda.estaCacheValido) {
        throw new Error('La búsqueda ha expirado. Por favor, realice una nueva búsqueda.');
      }

      const ofertasOrdenadas = busqueda.ordenarOfertas(criterio);

      return {
        busqueda,
        ofertas: ofertasOrdenadas,
        criterioOrden: criterio
      };

    } catch (error) {
      throw new Error(`Error ordenando ofertas: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Obtener detalle de oferta específica
   */
  async obtenerDetalleOferta(busquedaId, ofertaId, userId) {
    try {
      const busqueda = await this.obtenerBusqueda(busquedaId, userId);
      
      const oferta = busqueda.obtenerOferta(ofertaId);

      if (!oferta) {
        throw new Error('Oferta no encontrada en la búsqueda');
      }

      return oferta;

    } catch (error) {
      throw new Error(`Error obteniendo detalle de oferta: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Agregar vuelo a itinerario
   */
  async agregarVueloAItinerario(busquedaId, ofertaId, itinerarioId, userId) {
    try {
      // Obtener oferta
      const oferta = await this.obtenerDetalleOferta(busquedaId, ofertaId, userId);

      // Obtener itinerario
      const itinerario = await this.#itinerarioRepository.findById(itinerarioId);

      if (!itinerario) {
        throw new Error('Itinerario no encontrado');
      }

      // Verificar permisos
      if (itinerario.userId !== userId) {
        throw new Error('No tiene permisos para modificar este itinerario');
      }

      // Agregar cada segmento como actividad en el día correspondiente
      const actividadesCreadas = [];

      for (const segmento of oferta.segmentos) {
        const fechaVuelo = new Date(segmento.fechaSalida);
        const numeroDia = this.#calcularNumeroDia(itinerario.startDate, fechaVuelo);

        // Crear actividad de vuelo
        const actividad = {
          titulo: `Vuelo ${segmento.aerolinea} ${segmento.numeroVuelo}`,
          descripcion: `${segmento.origen} → ${segmento.destino}`,
          tipo: ActividadTipo.VUELO,
          lugar: {
            label: `${segmento.origen} - ${segmento.destino}`,
            latitude: null,
            longitude: null
          },
          horaInicio: segmento.fechaSalida,
          horaFin: segmento.fechaLlegada,
          costo: {
            amount: oferta.precio.amount / oferta.segmentos.length, // Prorratear costo
            currency: oferta.precio.currency
          },
          metadataExterna: {
            tipo: 'vuelo',
            ofertaId: oferta.id,
            segmento: segmento.toJSON(),
            aerolinea: segmento.aerolinea,
            numeroVuelo: segmento.numeroVuelo,
            cabina: segmento.cabina.toJSON()
          }
        };

        // Agregar al itinerario
        const actividadCreada = itinerario.agregarActividad(numeroDia, actividad);
        actividadesCreadas.push(actividadCreada);
      }

      // Guardar itinerario actualizado
      await this.#itinerarioRepository.save(itinerario);

      return {
        itinerario,
        actividadesCreadas,
        mensaje: `${actividadesCreadas.length} vuelo(s) agregado(s) al itinerario`
      };

    } catch (error) {
      throw new Error(`Error agregando vuelo a itinerario: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Obtener historial de búsquedas del usuario
   */
  async obtenerHistorialBusquedas(userId, limit = 10) {
    try {
      return await this.#busquedaVuelosRepository.findByUserId(userId, limit);
    } catch (error) {
      throw new Error(`Error obteniendo historial: ${error.message}`);
    }
  }

  /**
   * Caso de uso: Verificar estado de la integración con Amadeus
   */
  async verificarEstadoAmadeus() {
    try {
      return await this.#amadeusAdapter.verificarConexion();
    } catch (error) {
      return {
        conectado: false,
        error: error.message
      };
    }
  }

  /**
   * Caso de uso: Obtener estadísticas del cache
   */
  getCacheStats() {
    return this.#busquedaVuelosRepository.getCacheStats();
  }

  // Métodos auxiliares

  /**
   * Calcular número de día en el itinerario
   */
  #calcularNumeroDia(startDate, fecha) {
    const inicio = new Date(startDate);
    inicio.setHours(0, 0, 0, 0);
    
    const fechaVuelo = new Date(fecha);
    fechaVuelo.setHours(0, 0, 0, 0);

    const diffMs = fechaVuelo - inicio;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDias + 1; // Los días empiezan en 1
  }
}
