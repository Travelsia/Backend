/**
 * Value Object: Cabina
 * Representa la clase de cabina en un vuelo
 */
export class Cabina {
  static ECONOMY = 'ECONOMY';
  static PREMIUM_ECONOMY = 'PREMIUM_ECONOMY';
  static BUSINESS = 'BUSINESS';
  static FIRST = 'FIRST';

  static CABINAS_VALIDAS = [
    Cabina.ECONOMY,
    Cabina.PREMIUM_ECONOMY,
    Cabina.BUSINESS,
    Cabina.FIRST
  ];

  static NOMBRES_AMIGABLES = {
    ECONOMY: 'Económica',
    PREMIUM_ECONOMY: 'Económica Premium',
    BUSINESS: 'Ejecutiva',
    FIRST: 'Primera Clase'
  };

  #tipo;

  constructor(tipo) {
    if (!tipo) {
      throw new Error('El tipo de cabina es requerido');
    }

    const normalizado = tipo.toUpperCase();

    if (!Cabina.CABINAS_VALIDAS.includes(normalizado)) {
      throw new Error(
        `Tipo de cabina inválido. Debe ser uno de: ${Cabina.CABINAS_VALIDAS.join(', ')}`
      );
    }

    this.#tipo = normalizado;
  }

  get tipo() {
    return this.#tipo;
  }

  get nombreAmigable() {
    return Cabina.NOMBRES_AMIGABLES[this.#tipo];
  }

  isEconomy() {
    return this.#tipo === Cabina.ECONOMY;
  }

  isPremiumEconomy() {
    return this.#tipo === Cabina.PREMIUM_ECONOMY;
  }

  isBusiness() {
    return this.#tipo === Cabina.BUSINESS;
  }

  isFirst() {
    return this.#tipo === Cabina.FIRST;
  }

  // Comparar nivel de servicio
  isHigherOrEqualThan(other) {
    const order = [Cabina.ECONOMY, Cabina.PREMIUM_ECONOMY, Cabina.BUSINESS, Cabina.FIRST];
    return order.indexOf(this.#tipo) >= order.indexOf(other.tipo);
  }

  equals(other) {
    if (!(other instanceof Cabina)) {
      return false;
    }
    return this.#tipo === other.#tipo;
  }

  toString() {
    return this.#tipo;
  }

  toJSON() {
    return {
      tipo: this.#tipo,
      nombre: this.nombreAmigable
    };
  }

  static from(value) {
    if (value instanceof Cabina) {
      return value;
    }
    return new Cabina(value);
  }
}
