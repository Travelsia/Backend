import express from 'express';
import { IntegrationService } from '../services/integrationService.js';
import { BusquedaVuelosRepository } from '../infrastructure/repositories/BusquedaVuelosRepository.js';
import { ItinerarioRepository } from '../infrastructure/repositories/ItinerarioRepository.js';
import { AmadeusFlightAdapter } from '../infrastructure/adapters/AmadeusFlightAdapter.js';
import { pool } from '../db.js';
import { authenticate } from '../middlewares/auth.js';
import { FlightChatService } from '../services/flightChatService.js';

const router = express.Router();

// Inicializar dependencias
const busquedaVuelosRepository = new BusquedaVuelosRepository(pool);
const itinerarioRepository = new ItinerarioRepository(pool);

const amadeusAdapter = new AmadeusFlightAdapter({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  testMode: process.env.AMADEUS_TEST_MODE === 'true'
});

const integrationService = new IntegrationService({
  busquedaVuelosRepository,
  itinerarioRepository,
  amadeusAdapter
});

const flightChatService = new FlightChatService({ integrationService });

/**
 * POST /integrations/flights/search
 * Buscar vuelos disponibles
 */
router.post('/flights/search', authenticate, async (req, res) => {
  try {
    const {
      origen,
      destino,
      fechaSalida,
      fechaRegreso,
      numeroPasajeros,
      cabina,
      forzarNuevaBusqueda
    } = req.body;

    // Validaciones
    if (!origen || !destino || !fechaSalida) {
      return res.status(400).json({
        error: 'Origen, destino y fecha de salida son requeridos'
      });
    }

    const busqueda = await integrationService.buscarVuelos({
      userId: req.user.id,
      origen,
      destino,
      fechaSalida,
      fechaRegreso,
      numeroPasajeros: numeroPasajeros || 1,
      cabina: cabina || 'ECONOMY',
      forzarNuevaBusqueda: forzarNuevaBusqueda || false
    });

    res.status(200).json(busqueda.toJSON());

  } catch (error) {
    console.error('Error en búsqueda de vuelos:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /integrations/flights/chat/search
 * Entradas:
 *  - message: string (mensaje libre del usuario, en español)
 * 
 * Salida:
 *  - busqueda: objeto BusquedaVuelos.toJSON()
 *  - prefs: preferencias interpretadas por el modelo
 */
router.post('/flights/chat/search', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'El campo "message" es requerido'
      });
    }

    const { busqueda, prefs } = await flightChatService.buscarVuelosConversacional({
      userId: req.user.id,
      mensajeUsuario: message
    });

    return res.status(200).json({
      busqueda: busqueda.toJSON(),
      prefs
    });
  } catch (error) {
    console.error('Error en flights/chat/search:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /integrations/flights/chat/recommendations
 * Entradas:
 *  - busquedaId: string
 *  - context?: string  (preferencias extra: "prefiero LATAM", "no quiero madrugar", etc.)
 * 
 * Salida:
 *  - busquedaId
 *  - recomendadas: [{ oferta, motivo, etiqueta }]
 *  - resumenTexto: string
 */
router.post('/flights/chat/recommendations', authenticate, async (req, res) => {
  try {
    const { busquedaId, context } = req.body;

    if (!busquedaId) {
      return res.status(400).json({
        error: 'El campo "busquedaId" es requerido'
      });
    }

    const resultado = await flightChatService.recomendarOfertas({
      userId: req.user.id,
      busquedaId,
      contextoUsuario: context || ''
    });

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en flights/chat/recommendations:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /integrations/flights/searches/:searchId
 * Obtener búsqueda por ID
 */
router.get('/flights/searches/:searchId', authenticate, async (req, res) => {
  try {
    const { searchId } = req.params;

    const busqueda = await integrationService.obtenerBusqueda(searchId, req.user.id);

    res.status(200).json(busqueda.toJSON());

  } catch (error) {
    console.error('Error obteniendo búsqueda:', error);
    res.status(error.message.includes('No tiene permisos') ? 403 : 404).json({
      error: error.message
    });
  }
});

/**
 * GET /integrations/flights/searches
 * Obtener historial de búsquedas del usuario
 */
router.get('/flights/searches', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const historial = await integrationService.obtenerHistorialBusquedas(
      req.user.id,
      limit
    );

    res.status(200).json({
      historial: historial.map(b => b.toJSON()),
      total: historial.length
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /integrations/flights/searches/:searchId/filters
 * Aplicar filtros a una búsqueda
 */
router.post('/flights/searches/:searchId/filters', authenticate, async (req, res) => {
  try {
    const { searchId } = req.params;
    const filtros = req.body;

    const resultado = await integrationService.aplicarFiltros(
      searchId,
      req.user.id,
      filtros
    );

    res.status(200).json({
      busquedaId: searchId,
      ofertasFiltradas: resultado.ofertasFiltradas.map(o => o.toJSON()),
      filtrosAplicados: resultado.filtrosAplicados,
      totalResultados: resultado.ofertasFiltradas.length
    });

  } catch (error) {
    console.error('Error aplicando filtros:', error);
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * GET /integrations/flights/searches/:searchId/sort/:criterio
 * Ordenar ofertas de una búsqueda
 */
router.get('/flights/searches/:searchId/sort/:criterio', authenticate, async (req, res) => {
  try {
    const { searchId, criterio } = req.params;

    const resultado = await integrationService.ordenarOfertas(
      searchId,
      req.user.id,
      criterio.toUpperCase()
    );

    res.status(200).json({
      busquedaId: searchId,
      ofertas: resultado.ofertas.map(o => o.toJSON()),
      criterioOrden: resultado.criterioOrden,
      totalResultados: resultado.ofertas.length
    });

  } catch (error) {
    console.error('Error ordenando ofertas:', error);
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * GET /integrations/flights/searches/:searchId/offers/:offerId
 * Obtener detalle de una oferta específica
 */
router.get('/flights/searches/:searchId/offers/:offerId', authenticate, async (req, res) => {
  try {
    const { searchId, offerId } = req.params;

    const oferta = await integrationService.obtenerDetalleOferta(
      searchId,
      offerId,
      req.user.id
    );

    res.status(200).json(oferta.toJSON());

  } catch (error) {
    console.error('Error obteniendo oferta:', error);
    res.status(404).json({
      error: error.message
    });
  }
});

/**
 * POST /integrations/flights/searches/:searchId/offers/:offerId/add-to-itinerary
 * Agregar vuelo a un itinerario
 */
router.post(
  '/flights/searches/:searchId/offers/:offerId/add-to-itinerary',
  authenticate,
  async (req, res) => {
    try {
      const { searchId, offerId } = req.params;
      const { itinerarioId } = req.body;

      if (!itinerarioId) {
        return res.status(400).json({
          error: 'El ID del itinerario es requerido'
        });
      }

      const resultado = await integrationService.agregarVueloAItinerario(
        searchId,
        offerId,
        itinerarioId,
        req.user.id
      );

      res.status(200).json({
        mensaje: resultado.mensaje,
        itinerario: resultado.itinerario.toJSON(),
        actividadesCreadas: resultado.actividadesCreadas.map(a => ({
          id: a.id,
          titulo: a.titulo,
          tipo: a.tipo.tipo
        }))
      });

    } catch (error) {
      console.error('Error agregando vuelo:', error);
      res.status(400).json({
        error: error.message
      });
    }
  }
);

/**
 * GET /integrations/status
 * Verificar estado de las integraciones
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const amadeus = await integrationService.verificarEstadoAmadeus();
    const cache = integrationService.getCacheStats();

    res.status(200).json({
      integraciones: {
        amadeus
      },
      cache
    });

  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

export { router as integrationRoutes };
