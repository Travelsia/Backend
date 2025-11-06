import { Money } from './Money.js';
import { Segmento } from './Segmento.js';

/**
 * Value Object: OfertaVuelo
 * Representa una oferta completa de vuelo con precio y disponibilidad
 */
export class OfertaVuelo {
  #id;
  #segmentos;
  #precio;
  #asientosDisponibles;
  #validez; // Fecha hasta la cual es válida la oferta
  #esReembolsable;
  #equipajeIncluido;
  #metadata; // Datos extra de la API externa

  constructor({
    id,
    segmentos,
    precio,
    asientosDisponibles,
    validez,
    esReembolsable = false,
    equipajeIncluido = {},
    metadata = {}
  }) {
    // Validaciones
    if (!id) {
      throw new Error('El ID de la oferta es requerido');
    }

    if (!segmentos || !Array.isArray(segmentos) || segmentos.length === 0) {
      throw new Error('Debe haber al menos un segmento en la oferta');
    }

    if (!precio) {
      throw new Error('El precio es requerido');
    }

    if (asientosDisponibles < 0) {
      throw new Error('El número de asientos disponibles no puede ser negativo');
    }

    // Normalizar
    this.#id = id;
    this.#segmentos = segmentos.map(s => 
      s instanceof Segmento ? s : new Segmento(s)
    );
    this.#precio = precio instanceof Money ? precio : new Money(precio.amount, precio.currency);
    this.#asientosDisponibles = asientosDisponibles;
    this.#validez = validez ? new Date(validez) : null;
    this.#esReembolsable = Boolean(esReembolsable);
    this.#equipajeIncluido = equipajeIncluido;
    this.#metadata = metadata;

    // Validar continuidad de segmentos
    this.#validarContinuidadSegmentos();
  }

  #validarContinuidadSegmentos() {
    for (let i = 0; i < this.#segmentos.length - 1; i++) {
      const actual = this.#segmentos[i];
      const siguiente = this.#segmentos[i + 1];

      if (!actual.conectaCon(siguiente)) {
        throw new Error(
          `Segmentos discontinuos: ${actual.destino} no conecta con ${siguiente.origen}`
        );
      }

      // Validar tiempo mínimo de conexión (30 minutos)
      const tiempoEscala = actual.tiempoEscalaHasta(siguiente);
      if (tiempoEscala < 30) {
        throw new Error(
          `Tiempo de conexión insuficiente: ${tiempoEscala} minutos (mínimo 30 minutos)`
        );
      }
    }
  }

  get id() {
    return this.#id;
  }

  get segmentos() {
    return [...this.#segmentos]; // Retornar copia
  }

  get precio() {
    return this.#precio;
  }

  get asientosDisponibles() {
    return this.#asientosDisponibles;
  }

  get validez() {
    return this.#validez ? new Date(this.#validez) : null;
  }

  get esReembolsable() {
    return this.#esReembolsable;
  }

  get equipajeIncluido() {
    return { ...this.#equipajeIncluido };
  }

  get metadata() {
    return { ...this.#metadata };
  }

  // Propiedades derivadas
  get origen() {
    return this.#segmentos[0].origen;
  }

  get destino() {
    return this.#segmentos[this.#segmentos.length - 1].destino;
  }

  get fechaSalida() {
    return this.#segmentos[0].fechaSalida;
  }

  get fechaLlegada() {
    return this.#segmentos[this.#segmentos.length - 1].fechaLlegada;
  }

  get esVueloDirecto() {
    return this.#segmentos.length === 1;
  }

  get numeroEscalas() {
    return this.#segmentos.length - 1;
  }

  get duracionTotal() {
    return this.#segmentos.reduce((total, s) => total + s.duracion, 0);
  }

  get duracionTotalHoras() {
    const horas = Math.floor(this.duracionTotal / 60);
    const minutos = this.duracionTotal % 60;
    return `${horas}h ${minutos}m`;
  }

  // Verificar si la oferta sigue siendo válida
  isValid(fecha = new Date()) {
    if (!this.#validez) {
      return true; // Sin fecha de validez = siempre válida
    }
    return fecha <= this.#validez;
  }

  // Verificar disponibilidad para N pasajeros
  tieneDisponibilidadPara(numeroPasajeros) {
    return this.#asientosDisponibles >= numeroPasajeros;
  }

  // Obtener todas las aerolíneas involucradas
  getAerolineas() {
    return [...new Set(this.#segmentos.map(s => s.aerolinea))];
  }

  // Obtener resumen de escalas
  getEscalas() {
    const escalas = [];
    for (let i = 0; i < this.#segmentos.length - 1; i++) {
      const actual = this.#segmentos[i];
      const siguiente = this.#segmentos[i + 1];
      escalas.push({
        aeropuerto: actual.destino.code,
        duracion: actual.tiempoEscalaHasta(siguiente)
      });
    }
    return escalas;
  }

  toJSON() {
    return {
      id: this.#id,
      origen: this.origen.toJSON(),
      destino: this.destino.toJSON(),
      fechaSalida: this.fechaSalida.toISOString(),
      fechaLlegada: this.fechaLlegada.toISOString(),
      segmentos: this.#segmentos.map(s => s.toJSON()),
      precio: this.#precio.toJSON(),
      asientosDisponibles: this.#asientosDisponibles,
      validez: this.#validez?.toISOString(),
      esReembolsable: this.#esReembolsable,
      equipajeIncluido: this.#equipajeIncluido,
      esVueloDirecto: this.esVueloDirecto,
      numeroEscalas: this.numeroEscalas,
      escalas: this.getEscalas(),
      duracionTotal: this.duracionTotal,
      duracionTotalHoras: this.duracionTotalHoras,
      aerolineas: this.getAerolineas()
    };
  }

  toString() {
    const tipo = this.esVueloDirecto ? 'Directo' : `${this.numeroEscalas} escala(s)`;
    return `${this.origen} -> ${this.destino} | ${tipo} | ${this.precio.toString()} | ${this.duracionTotalHoras}`;
  }
}
