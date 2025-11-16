// src/services/flightChatService.js
import { openai } from '../infrastructure/ai/OpenAIClient.js';
import { IntegrationService } from './integrationService.js';
import { encode, decode } from '@toon-format/toon';

/**
 * Tipos "lógicos" para entender qué vamos a manejar
 * (no son TypeScript, solo comentarios JSDoc para tu IDE)
 * 
 * @typedef {Object} FlightSearchPreferences
 * @property {string} origen - Código IATA origen, ej. LIM
 * @property {string[]} destinos - Lista de IATAs destino
 * @property {{ tipo: 'exacta'|'rango', desde: string, hasta?: string }} fechaSalida
 * @property {{ tipo: 'exacta'|'rango', desde: string, hasta?: string } | null} fechaRegreso
 * @property {number} numeroPasajeros
 * @property {'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST'} cabina
 * @property {boolean} [soloDirectos]
 * @property {number} [precioMaximo]
 */

/**
 * Servicio de capa de aplicación para chat de vuelos con LLM
 */
export class FlightChatService {
  #integrationService;

  /**
   * @param {{ integrationService: IntegrationService }} deps
   */
  constructor({ integrationService }) {
    this.#integrationService = integrationService;
  }

  /**
   * 1) Parsear mensaje del usuario → preferencias estructuradas
   * @param {string} mensajeUsuario
   * @returns {Promise<FlightSearchPreferences>}
   */
  async parseFlightPreferences(mensajeUsuario) {
    const jsonSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        origen: {
          type: 'string',
          description: 'Código IATA del aeropuerto de origen (ej. LIM)'
        },
        destinos: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de posibles aeropuertos destino (IATA)'
        },
        fechaSalida: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tipo: { type: 'string', enum: ['exacta', 'rango'] },
            desde: { type: 'string', description: 'Fecha mínima YYYY-MM-DD' },
            hasta: {
              type: 'string',
              description:
                'Fecha máxima YYYY-MM-DD, requerida si tipo = rango'
            }
          },
          // 👇 ahora required incluye *todos* los keys: tipo, desde, hasta
          required: ['tipo', 'desde', 'hasta']
        },
        fechaRegreso: {
          type: ['object', 'null'],
          additionalProperties: false,
          properties: {
            tipo: { type: 'string', enum: ['exacta', 'rango'] },
            desde: { type: 'string' },
            hasta: { type: 'string' }
          },
          // idem: todos los keys
          required: ['tipo', 'desde', 'hasta']
        },
        numeroPasajeros: {
          type: 'integer',
          minimum: 1,
          maximum: 9,
          default: 1
        },
        cabina: {
          type: 'string',
          enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
          default: 'ECONOMY'
        },
        soloDirectos: {
          type: 'boolean',
          description: 'Si el usuario quiere solo vuelos directos'
        },
        precioMaximo: {
          type: 'number',
          description: 'Presupuesto máximo aproximado en USD'
        }
      },
      // 👇 en strict: true, el root también debe listar *todos* los keys
      required: [
        'origen',
        'destinos',
        'fechaSalida',
        'fechaRegreso',
        'numeroPasajeros',
        'cabina',
        'soloDirectos',
        'precioMaximo'
      ]
    };

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en viajes. Tu tarea es convertir el mensaje del usuario en criterios de búsqueda de vuelos. Usa códigos IATA si es posible.'
        },
        {
          role: 'user',
          content: mensajeUsuario
        }
      ],
      text: {
        format: {
          name: 'FlightSearchPreferences',
          type: 'json_schema',
          strict: true,
          schema: jsonSchema
        }
      }
    });

    // ✅ forma segura con la Responses API
    let text = response.output_text;

    // fallback por si usas una versión sin output_text
    if (!text && Array.isArray(response.output)) {
      const first = response.output[0];
      const content0 = first?.content?.[0];

      if (content0?.type === 'output_text' && content0.text?.value) {
        text = content0.text.value;
      } else if (typeof content0?.text === 'string') {
        text = content0.text;
      }
    }

    if (typeof text !== 'string' || !text.trim()) {
      console.dir(response, { depth: null }); // para depurar si algo viene raro
      throw new Error('No se pudo interpretar la solicitud de vuelos');
    }

    const prefs = JSON.parse(text);


    if (!prefs.destinos || prefs.destinos.length === 0) {
      throw new Error(
        'No se pudo determinar un destino. Por favor, especifique la ciudad o país de destino.'
      );
    }

    return prefs;
  }

  /**
   * 2) Ejecutar búsqueda de vuelos usando IntegrationService y las preferencias
   *    Devuelve la BusquedaVuelos + las preferencias interpretadas.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.mensajeUsuario
   */
  async buscarVuelosConversacional({ userId, mensajeUsuario }) {
    // 1. Interpretar mensaje
    const prefs = await this.parseFlightPreferences(mensajeUsuario);

    // Para simplificar: usaremos el primer destino
    const destino = prefs.destinos[0];

    const fechaSalida =
      prefs.fechaSalida.tipo === 'rango'
        ? prefs.fechaSalida.desde
        : prefs.fechaSalida.desde;

    const fechaRegreso =
      prefs.fechaRegreso && prefs.fechaRegreso.desde
        ? prefs.fechaRegreso.desde
        : null;

    // 2. Reusar tu IntegrationService.buscarVuelos (ya usa Amadeus y BusquedaVuelos)
    const busqueda = await this.#integrationService.buscarVuelos({
      userId,
      origen: prefs.origen,
      destino,
      fechaSalida,
      fechaRegreso,
      numeroPasajeros: prefs.numeroPasajeros,
      cabina: prefs.cabina,
      forzarNuevaBusqueda: false
    });

    return {
      busqueda,
      prefs
    };
  }

  /**
   * 3) Rankear y explicar ofertas usando LLM
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.busquedaId
   * @param {string} [params.contextoUsuario] - mensaje extra tipo "prefiero evitar escalas largas"
   */
  async recomendarOfertas({ userId, busquedaId, contextoUsuario = '' }) {
    const busqueda = await this.#integrationService.obtenerBusqueda(
      busquedaId,
      userId
    );

    const ofertas = busqueda.ofertas;

    if (!ofertas || ofertas.length === 0) {
      throw new Error('No hay ofertas de vuelo en esta búsqueda');
    }

    const topOfertas = ofertas.slice(0, 15).map((o) => o.toJSON());

    // ⭐ TOON: empaquetamos las ofertas en un objeto y lo codificamos
    // En TOON se recomienda usar tab (\t) y, opcionalmente, keyFolding para ahorrar tokens.
    // const ofertasPayload = { ofertas: topOfertas };

    // const ofertasToon = encode(ofertasPayload, {
    //   delimiter: '\t',      // tabulación (suele tokenizar mejor que comas)
    //   keyFolding: 'safe',   // aplanar claves anidadas de forma segura
    //   flattenDepth: 3       // profundidad máxima para aplanar
    // });

    // Antes: const ofertasPayload = { ofertas: topOfertas };

    const ofertasCompactas = topOfertas.map((o) => {
      const segmentos = o.segmentos || [];
      const primerSegmento = segmentos[0] || {};
      const ultimoSegmento =
        segmentos.length > 0 ? segmentos[segmentos.length - 1] : {};

      const aerolineas = [
        ...new Set(segmentos.map((s) => s.aerolinea).filter(Boolean))
      ].join('|');

      // número de escalas = tramos - 1 (mínimo 0)
      const numeroEscalasCalc =
        segmentos.length > 0 ? Math.max(segmentos.length - 1, 0) : null;

      // duración total = suma de duraciones de cada segmento (si vienen en minutos)
      const duracionTotalMin =
        segmentos.length > 0
          ? segmentos.reduce(
              (acc, seg) => acc + (typeof seg.duracion === 'number' ? seg.duracion : 0),
              0
            )
          : null;

      return {
        id: String(o.id),
        // aquí sí hay "amount"
        precioTotalUsd:
          typeof o.precio?.amount === 'number' ? o.precio.amount : null,
        esDirecto:
          segmentos.length > 0 ? segmentos.length === 1 : null,
        numeroEscalas: numeroEscalasCalc,
        duracionMin: duracionTotalMin,
        salida: primerSegmento.fechaSalida ?? null,
        llegada: ultimoSegmento.fechaLlegada ?? null,
        aerolineas: aerolineas || null
      };
    });



    const ofertasPayload = { ofertas: ofertasCompactas };

    const ofertasToon = encode(ofertasPayload, {
      delimiter: '\t',     // tab suele tokenizar mejor
      keyFolding: 'safe'   // opcional, para aplanar algunas rutas
    });


    // JSON Schema puro para el ranking
    const rankingJsonSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        recomendadas: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              ofertaId: { type: 'string' },
              motivo: { type: 'string' },
              etiqueta: {
                type: 'string',
                enum: ['MAS_BARATA', 'MEJOR_EQUILIBRIO', 'MAS_RAPIDA', 'OTRA']
              }
            },
            required: ['ofertaId', 'motivo', 'etiqueta']
          }
        },
        resumenTexto: {
          type: 'string',
          description:
            'Explicación breve en español para mostrar al usuario final'
        }
      },
      required: ['recomendadas', 'resumenTexto']
    };

    const systemPrompt = `
Eres un asistente de viajes.
Recibirás un listado de ofertas de vuelo en formato TOON dentro de un bloque de código \`\`\`toon.
Cada oferta incluye segmentos, precio, duracionTotal, numeroEscalas, esVueloDirecto, etc.

Reglas importantes:
- Las ofertas vienen ya estructuradas en TOON (similar a YAML/CSV).
- NO inventes ofertas nuevas; usa sólo las que aparecen en el bloque TOON.
- Debes seleccionar las 3 mejores opciones para un viajero típico, considerando:
  - buena relación precio / duración
  - evitar escalas innecesarias
  - priorizar vuelos directos cuando sea razonable

Tu respuesta DEBE seguir exactamente el JSON Schema proporcionado (RankedFlights).
Devuelve un JSON con "recomendadas" (máx. 3) y "resumenTexto".
`;

    const userContent = `
Contexto del usuario (opcional): ${contextoUsuario || 'N/A'}

Las ofertas están en formato TOON a continuación.
Data is in TOON format (2-space indent, arrays show length and fields).
\`\`\`toon
${ofertasToon}
\`\`\`
`;

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      text: {
        format: {
          name: 'RankedFlights',
          type: 'json_schema',
          strict: true,
          schema: rankingJsonSchema
        }
      }
    });

    let text = response.output_text;

    // fallback por si tu versión del SDK no tiene output_text
    if (!text && Array.isArray(response.output)) {
      const first = response.output[0];
      const content0 = first?.content?.[0];

      if (content0?.text?.value) {
        text = content0.text.value;
      } else if (typeof content0?.text === 'string') {
        text = content0.text;
      }
    }

    if (typeof text !== 'string' || !text.trim()) {
      console.dir(response, { depth: null });
      throw new Error('No se pudo generar recomendaciones de vuelos');
    }

    const ranking = JSON.parse(text);

    const recomendadasDetalladas = ranking.recomendadas
      .map((r) => {
        const oferta = ofertas.find((o) => o.id === r.ofertaId);
        if (!oferta) return null;

        return {
          oferta: oferta.toJSON(),
          motivo: r.motivo,
          etiqueta: r.etiqueta
        };
      })
      .filter(Boolean);

    return {
      busquedaId: busqueda.id,
      recomendadas: recomendadasDetalladas,
      resumenTexto: ranking.resumenTexto
    };
  }
}
