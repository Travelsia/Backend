import Amadeus from 'amadeus';
import { IATA } from '../../domain/value-objects/IATA.js';
import { Cabina } from '../../domain/value-objects/Cabina.js';
import { Segmento } from '../../domain/value-objects/Segmento.js';
import { OfertaVuelo } from '../../domain/value-objects/OfertaVuelo.js';
import { Money } from '../../domain/value-objects/Money.js';

/**
 * Anti-Corruption Layer para Amadeus API
 * Traduce entre el modelo de Amadeus y nuestro modelo de dominio
 */
export class AmadeusFlightAdapter {
  #client;
  #isTestMode;

  constructor({ clientId, clientSecret, testMode = true }) {
    if (!clientId || !clientSecret) {
      throw new Error('Las credenciales de Amadeus son requeridas');
    }

    this.#isTestMode = testMode;
    
    // Inicializar cliente de Amadeus
    this.#client = new Amadeus({
      clientId,
      clientSecret,
      hostname: testMode ? 'test' : 'production'
    });
  }

  /**
   * Buscar ofertas de vuelos
   */
  async buscarVuelos({
    origen,
    destino,
    fechaSalida,
    fechaRegreso,
    adultos = 1,
    cabina = 'ECONOMY',
    maxResultados = 50
  }) {
    try {
      // Normalizar parámetros
      const origenIATA = origen instanceof IATA ? origen.code : new IATA(origen).code;
      const destinoIATA = destino instanceof IATA ? destino.code : new IATA(destino).code;
      const cabinaAmadeus = this.#mapearCabinaAAmadeus(cabina);

      // Construir parámetros de búsqueda
      const searchParams = {
        originLocationCode: origenIATA,
        destinationLocationCode: destinoIATA,
        departureDate: this.#formatearFecha(fechaSalida),
        adults: adultos,
        travelClass: cabinaAmadeus,
        max: maxResultados,
        currencyCode: 'USD' // Moneda por defecto
      };

      // Agregar fecha de regreso si es ida y vuelta
      if (fechaRegreso) {
        searchParams.returnDate = this.#formatearFecha(fechaRegreso);
      }

      // Realizar búsqueda
      const response = await this.#client.shopping.flightOffersSearch.get(searchParams);

      // Transformar respuesta a nuestro dominio
      return this.#transformarOfertas(response.data);

    } catch (error) {
      throw this.#manejarErrorAmadeus(error);
    }
  }

  /**
   * Obtener detalles de una oferta específica
   */
  async obtenerDetalleOferta(ofertaId) {
    try {
      // En Amadeus, necesitamos hacer pricing para obtener detalles actualizados
      // Por ahora retornamos error, ya que necesitamos el objeto completo de la oferta
      throw new Error('Para obtener detalles de una oferta, use el método de pricing');
    } catch (error) {
      throw this.#manejarErrorAmadeus(error);
    }
  }

  /**
   * Confirmar precio de una oferta
   */
  async confirmarPrecioOferta(ofertaData) {
    try {
      const response = await this.#client.shopping.flightOffers.pricing.post(
        JSON.stringify({
          data: {
            type: 'flight-offers-pricing',
            flightOffers: [ofertaData]
          }
        })
      );

      return this.#transformarOfertas(response.data.flightOffers);

    } catch (error) {
      throw this.#manejarErrorAmadeus(error);
    }
  }

  /**
   * Transformar ofertas de Amadeus a nuestro modelo de dominio
   */
  #transformarOfertas(ofertasAmadeus) {
    if (!ofertasAmadeus || ofertasAmadeus.length === 0) {
      return [];
    }

    return ofertasAmadeus.map(oferta => {
      try {
        return this.#transformarOferta(oferta);
      } catch (error) {
        console.error('Error transformando oferta:', error);
        return null;
      }
    }).filter(o => o !== null);
  }

  /**
   * Transformar una oferta individual
   */
  #transformarOferta(ofertaAmadeus) {
    const { id, itineraries, price, numberOfBookableSeats, validatingAirlineCodes } = ofertaAmadeus;

    // Extraer segmentos del primer itinerario (ida)
    const segmentos = [];
    
    for (const itinerary of itineraries) {
      for (const segment of itinerary.segments) {
        segmentos.push(new Segmento({
          origen: segment.departure.iataCode,
          destino: segment.arrival.iataCode,
          fechaSalida: segment.departure.at,
          fechaLlegada: segment.arrival.at,
          aerolinea: segment.carrierCode,
          numeroVuelo: `${segment.carrierCode}${segment.number}`,
          cabina: this.#mapearCabinaDesdAmadeus(segment.cabin || 'ECONOMY'),
          duracion: this.#parsearDuracion(segment.duration)
        }));
      }
    }

    // Construir oferta
    return new OfertaVuelo({
      id,
      segmentos,
      precio: new Money(parseFloat(price.total), price.currency),
      asientosDisponibles: numberOfBookableSeats || 9,
      validez: this.#calcularValidezOferta(),
      esReembolsable: this.#esReembolsable(ofertaAmadeus),
      equipajeIncluido: this.#extraerEquipaje(ofertaAmadeus),
      metadata: {
        amadeus: {
          validatingAirlineCodes,
          source: ofertaAmadeus.source,
          instantTicketingRequired: ofertaAmadeus.instantTicketingRequired,
          lastTicketingDate: ofertaAmadeus.lastTicketingDate,
          numberOfBookableSeats,
          pricingOptions: ofertaAmadeus.pricingOptions
        }
      }
    });
  }

  /**
   * Mapear cabina de nuestro modelo a Amadeus
   */
  #mapearCabinaAAmadeus(cabina) {
    const mapa = {
      'ECONOMY': 'ECONOMY',
      'PREMIUM_ECONOMY': 'PREMIUM_ECONOMY',
      'BUSINESS': 'BUSINESS',
      'FIRST': 'FIRST'
    };

    const tipo = cabina instanceof Cabina ? cabina.tipo : cabina;
    return mapa[tipo] || 'ECONOMY';
  }

  /**
   * Mapear cabina de Amadeus a nuestro modelo
   */
  #mapearCabinaDesdAmadeus(cabinaAmadeus) {
    const mapa = {
      'ECONOMY': 'ECONOMY',
      'PREMIUM_ECONOMY': 'PREMIUM_ECONOMY',
      'BUSINESS': 'BUSINESS',
      'FIRST': 'FIRST'
    };

    return mapa[cabinaAmadeus] || 'ECONOMY';
  }

  /**
   * Formatear fecha para Amadeus (YYYY-MM-DD)
   */
  #formatearFecha(fecha) {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parsear duración ISO 8601 a minutos
   */
  #parsearDuracion(duracionISO) {
    if (!duracionISO) return 0;

    // Formato: PT2H30M
    const match = duracionISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;

    const horas = parseInt(match[1] || 0);
    const minutos = parseInt(match[2] || 0);

    return horas * 60 + minutos;
  }

  /**
   * Calcular fecha de validez de la oferta (15 minutos desde ahora)
   */
  #calcularValidezOferta() {
    const validez = new Date();
    validez.setMinutes(validez.getMinutes() + 15);
    return validez;
  }

  /**
   * Determinar si la oferta es reembolsable
   */
  #esReembolsable(ofertaAmadeus) {
    // Buscar en travelerPricings si hay información de reembolso
    const travelerPricings = ofertaAmadeus.travelerPricings || [];
    
    for (const pricing of travelerPricings) {
      const fareDetailsBySegment = pricing.fareDetailsBySegment || [];
      
      for (const fareDetail of fareDetailsBySegment) {
        const amenities = fareDetail.amenities || [];
        const hasRefund = amenities.some(a => 
          a.description === 'REFUNDABLE' && a.isChargeable === false
        );
        
        if (hasRefund) return true;
      }
    }

    return false;
  }

  /**
   * Extraer información de equipaje
   */
  #extraerEquipaje(ofertaAmadeus) {
    const equipaje = {
      mano: { cantidad: 1, peso: '8kg' },
      bodega: { cantidad: 0, peso: '0kg' }
    };

    const travelerPricings = ofertaAmadeus.travelerPricings || [];
    
    for (const pricing of travelerPricings) {
      const fareDetailsBySegment = pricing.fareDetailsBySegment || [];
      
      for (const fareDetail of fareDetailsBySegment) {
        if (fareDetail.includedCheckedBags) {
          const bags = fareDetail.includedCheckedBags;
          
          if (bags.quantity) {
            equipaje.bodega.cantidad = bags.quantity;
          }
          
          if (bags.weight) {
            equipaje.bodega.peso = `${bags.weight}${bags.weightUnit || 'KG'}`;
          }
        }
      }
    }

    return equipaje;
  }

  /**
   * Manejar errores de Amadeus y convertirlos a errores de dominio
   */
  #manejarErrorAmadeus(error) {
    // Errores de Amadeus vienen en formato específico
    if (error.response) {
      const { status, result } = error.response;
      const errors = result?.errors || [];

      if (status === 400) {
        const mensaje = errors.map(e => e.detail || e.title).join(', ');
        return new Error(`Parámetros de búsqueda inválidos: ${mensaje}`);
      }

      if (status === 401) {
        return new Error('Credenciales de Amadeus inválidas');
      }

      if (status === 404) {
        return new Error('No se encontraron vuelos para los criterios especificados');
      }

      if (status === 500) {
        return new Error('Error en el servicio de Amadeus');
      }

      return new Error(`Error de Amadeus (${status}): ${errors[0]?.title || 'Error desconocido'}`);
    }

    // Error de red o conexión
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('No se pudo conectar con el servicio de Amadeus');
    }

    return error;
  }

  /**
   * Verificar estado de conexión
   */
  async verificarConexion() {
    try {
      // Hacer una búsqueda simple para verificar credenciales
      await this.#client.shopping.flightOffersSearch.get({
        originLocationCode: 'MAD',
        destinationLocationCode: 'BCN',
        departureDate: this.#formatearFecha(new Date(Date.now() + 86400000)), // Mañana
        adults: 1,
        max: 1
      });

      return {
        conectado: true,
        modo: this.#isTestMode ? 'test' : 'production',
        mensaje: 'Conexión exitosa con Amadeus'
      };

    } catch (error) {
      return {
        conectado: false,
        modo: this.#isTestMode ? 'test' : 'production',
        error: error.message
      };
    }
  }
}
