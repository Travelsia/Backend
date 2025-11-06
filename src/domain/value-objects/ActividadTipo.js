/**
 * Value Object: ActividadTipo
 * Enumera los tipos de actividades permitidas en el sistema
 */
export class ActividadTipo {
  static VUELO = 'VUELO';
  static HOSPEDAJE = 'HOSPEDAJE';
  static VISITA = 'VISITA';
  static TRANSPORTE = 'TRANSPORTE';
  static COMIDA = 'COMIDA';
  static ACTIVIDAD = 'ACTIVIDAD';
  static OTROS = 'OTROS';

  static TIPOS_VALIDOS = [
    ActividadTipo.VUELO,
    ActividadTipo.HOSPEDAJE,
    ActividadTipo.VISITA,
    ActividadTipo.TRANSPORTE,
    ActividadTipo.COMIDA,
    ActividadTipo.ACTIVIDAD,
    ActividadTipo.OTROS
  ];

  constructor(tipo) {
    this.#validate(tipo);
    this._tipo = tipo.toUpperCase();
    Object.freeze(this);
  }

  #validate(tipo) {
    if (!tipo || typeof tipo !== 'string') {
      throw new Error('El tipo de actividad es requerido y debe ser una cadena');
    }

    const tipoUpper = tipo.toUpperCase();
    if (!ActividadTipo.TIPOS_VALIDOS.includes(tipoUpper)) {
      throw new Error(
        `Tipo de actividad inválido: ${tipo}. Tipos válidos: ${ActividadTipo.TIPOS_VALIDOS.join(', ')}`
      );
    }
  }

  get tipo() {
    return this._tipo;
  }

  isVuelo() {
    return this._tipo === ActividadTipo.VUELO;
  }

  isHospedaje() {
    return this._tipo === ActividadTipo.HOSPEDAJE;
  }

  isVisita() {
    return this._tipo === ActividadTipo.VISITA;
  }

  isTransporte() {
    return this._tipo === ActividadTipo.TRANSPORTE;
  }

  equals(other) {
    if (!(other instanceof ActividadTipo)) return false;
    return this._tipo === other._tipo;
  }

  toJSON() {
    return this._tipo;
  }

  toString() {
    return this._tipo;
  }

  static fromString(tipo) {
    return new ActividadTipo(tipo);
  }

  static getTiposValidos() {
    return [...ActividadTipo.TIPOS_VALIDOS];
  }
}
