/**
 * Value Object: IATA
 * Representa un código IATA de aeropuerto (3 letras mayúsculas)
 */
export class IATA {
  #code;

  constructor(code) {
    if (!code || typeof code !== 'string') {
      throw new Error('El código IATA es requerido');
    }

    const normalized = code.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new Error('El código IATA debe tener exactamente 3 letras mayúsculas');
    }

    this.#code = normalized;
  }

  get code() {
    return this.#code;
  }

  equals(other) {
    if (!(other instanceof IATA)) {
      return false;
    }
    return this.#code === other.#code;
  }

  toString() {
    return this.#code;
  }

  toJSON() {
    return this.#code;
  }

  // Método para comparar si es un código específico
  is(code) {
    return this.#code === code.toUpperCase();
  }

  // Factory method para crear desde diferentes formatos
  static from(value) {
    if (value instanceof IATA) {
      return value;
    }
    return new IATA(value);
  }
}
