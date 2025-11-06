import crypto from 'crypto';

/**
 * Value Object: LinkComparticion
 * Representa un link único temporal para compartir itinerarios
 */
export class LinkComparticion {
  #token;
  #fechaExpiracion;

  constructor(token, fechaExpiracion) {
    if (!token || typeof token !== 'string') {
      throw new Error('El token es requerido');
    }

    if (!fechaExpiracion || !(fechaExpiracion instanceof Date)) {
      throw new Error('La fecha de expiración es requerida');
    }

    this.#token = token;
    this.#fechaExpiracion = new Date(fechaExpiracion);

    Object.freeze(this);
  }

  get token() {
    return this.#token;
  }

  get fechaExpiracion() {
    return new Date(this.#fechaExpiracion);
  }

  // Verificar si el link está activo
  estaActivo(fechaActual = new Date()) {
    return fechaActual < this.#fechaExpiracion;
  }

  // Verificar si ha expirado
  haExpirado(fechaActual = new Date()) {
    return fechaActual >= this.#fechaExpiracion;
  }

  // Tiempo restante en milisegundos
  tiempoRestante(fechaActual = new Date()) {
    const diff = this.#fechaExpiracion.getTime() - fechaActual.getTime();
    return Math.max(0, diff);
  }

  // Tiempo restante en formato legible
  tiempoRestanteLegible(fechaActual = new Date()) {
    const ms = this.tiempoRestante(fechaActual);
    
    if (ms === 0) {
      return 'Expirado';
    }

    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) {
      return `${dias} día(s) ${horas} hora(s)`;
    } else if (horas > 0) {
      return `${horas} hora(s) ${minutos} minuto(s)`;
    } else {
      return `${minutos} minuto(s)`;
    }
  }

  equals(other) {
    if (!(other instanceof LinkComparticion)) {
      return false;
    }
    return this.#token === other.#token;
  }

  toString() {
    return this.#token;
  }

  toJSON() {
    return {
      token: this.#token,
      fechaExpiracion: this.#fechaExpiracion.toISOString(),
      estaActivo: this.estaActivo(),
      tiempoRestante: this.tiempoRestanteLegible()
    };
  }

  // Factory methods
  static generar(diasValidez = 7) {
    const token = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasValidez);

    return new LinkComparticion(token, fechaExpiracion);
  }

  static generarConHoras(horas = 24) {
    const token = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + horas);

    return new LinkComparticion(token, fechaExpiracion);
  }

  static from(token, fechaExpiracion) {
    return new LinkComparticion(token, fechaExpiracion);
  }

  // Renovar el link (genera uno nuevo con nueva fecha)
  renovar(diasValidez = 7) {
    return LinkComparticion.generar(diasValidez);
  }
}
