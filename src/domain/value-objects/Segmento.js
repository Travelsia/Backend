import { IATA } from './IATA.js';
import { Cabina } from './Cabina.js';

/**
 * Value Object: Segmento
 * Representa un tramo individual de un vuelo (punto A -> punto B)
 */
export class Segmento {
  #origen;
  #destino;
  #fechaSalida;
  #fechaLlegada;
  #aerolinea;
  #numeroVuelo;
  #cabina;
  #duracion; // en minutos

  constructor({
    origen,
    destino,
    fechaSalida,
    fechaLlegada,
    aerolinea,
    numeroVuelo,
    cabina,
    duracion
  }) {
    // Validaciones
    if (!origen || !destino) {
      throw new Error('Origen y destino son requeridos');
    }

    if (!fechaSalida || !fechaLlegada) {
      throw new Error('Fechas de salida y llegada son requeridas');
    }

    if (!aerolinea || !numeroVuelo) {
      throw new Error('Aerolínea y número de vuelo son requeridos');
    }

    // Normalizar valores
    this.#origen = origen instanceof IATA ? origen : new IATA(origen);
    this.#destino = destino instanceof IATA ? destino : new IATA(destino);
    this.#fechaSalida = new Date(fechaSalida);
    this.#fechaLlegada = new Date(fechaLlegada);
    this.#cabina = cabina instanceof Cabina ? cabina : new Cabina(cabina);
    this.#aerolinea = aerolinea.trim();
    this.#numeroVuelo = numeroVuelo.trim();
    this.#duracion = duracion || this.#calcularDuracion();

    // Validar lógica
    if (this.#origen.equals(this.#destino)) {
      throw new Error('Origen y destino no pueden ser iguales');
    }

    if (this.#fechaLlegada <= this.#fechaSalida) {
      throw new Error('La fecha de llegada debe ser posterior a la de salida');
    }
  }

  #calcularDuracion() {
    const diff = this.#fechaLlegada.getTime() - this.#fechaSalida.getTime();
    return Math.round(diff / (1000 * 60)); // Convertir a minutos
  }

  get origen() {
    return this.#origen;
  }

  get destino() {
    return this.#destino;
  }

  get fechaSalida() {
    return new Date(this.#fechaSalida);
  }

  get fechaLlegada() {
    return new Date(this.#fechaLlegada);
  }

  get aerolinea() {
    return this.#aerolinea;
  }

  get numeroVuelo() {
    return this.#numeroVuelo;
  }

  get cabina() {
    return this.#cabina;
  }

  get duracion() {
    return this.#duracion;
  }

  get duracionHoras() {
    const horas = Math.floor(this.#duracion / 60);
    const minutos = this.#duracion % 60;
    return `${horas}h ${minutos}m`;
  }

  // Verificar si es un vuelo directo al destino final
  conectaCon(otroSegmento) {
    return this.#destino.equals(otroSegmento.origen);
  }

  // Calcular tiempo de escala entre este segmento y el siguiente
  tiempoEscalaHasta(siguienteSegmento) {
    if (!this.conectaCon(siguienteSegmento)) {
      throw new Error('Los segmentos no conectan');
    }

    const diff = siguienteSegmento.fechaSalida.getTime() - this.#fechaLlegada.getTime();
    return Math.round(diff / (1000 * 60)); // minutos
  }

  toJSON() {
    return {
      origen: this.#origen.toJSON(),
      destino: this.#destino.toJSON(),
      fechaSalida: this.#fechaSalida.toISOString(),
      fechaLlegada: this.#fechaLlegada.toISOString(),
      aerolinea: this.#aerolinea,
      numeroVuelo: this.#numeroVuelo,
      cabina: this.#cabina.toJSON(),
      duracion: this.#duracion,
      duracionHoras: this.duracionHoras
    };
  }

  toString() {
    return `${this.#aerolinea} ${this.#numeroVuelo}: ${this.#origen} -> ${this.#destino} (${this.duracionHoras})`;
  }
}
