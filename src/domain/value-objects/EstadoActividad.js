/**
 * Value Object: EstadoActividad
 * Representa el estado de una actividad en el itinerario
 */
export class EstadoActividad {
  static PROPUESTA = 'PROPUESTA';
  static CONFIRMADA = 'CONFIRMADA';
  static CANCELADA = 'CANCELADA';

  static ESTADOS_VALIDOS = [
    EstadoActividad.PROPUESTA,
    EstadoActividad.CONFIRMADA,
    EstadoActividad.CANCELADA
  ];

  constructor(estado = EstadoActividad.PROPUESTA) {
    this.#validate(estado);
    this._estado = estado.toUpperCase();
    Object.freeze(this);
  }

  #validate(estado) {
    if (!estado || typeof estado !== 'string') {
      throw new Error('El estado de actividad es requerido y debe ser una cadena');
    }

    const estadoUpper = estado.toUpperCase();
    if (!EstadoActividad.ESTADOS_VALIDOS.includes(estadoUpper)) {
      throw new Error(
        `Estado de actividad inválido: ${estado}. Estados válidos: ${EstadoActividad.ESTADOS_VALIDOS.join(', ')}`
      );
    }
  }

  get estado() {
    return this._estado;
  }

  isPropuesta() {
    return this._estado === EstadoActividad.PROPUESTA;
  }

  isConfirmada() {
    return this._estado === EstadoActividad.CONFIRMADA;
  }

  isCancelada() {
    return this._estado === EstadoActividad.CANCELADA;
  }

  canTransitionTo(nuevoEstado) {
    const nuevo = nuevoEstado instanceof EstadoActividad ? nuevoEstado._estado : nuevoEstado.toUpperCase();

    // Propuesta puede ir a Confirmada o Cancelada
    if (this._estado === EstadoActividad.PROPUESTA) {
      return nuevo === EstadoActividad.CONFIRMADA || nuevo === EstadoActividad.CANCELADA;
    }

    // Confirmada puede ir a Cancelada
    if (this._estado === EstadoActividad.CONFIRMADA) {
      return nuevo === EstadoActividad.CANCELADA;
    }

    // Cancelada no puede cambiar
    return false;
  }

  confirmar() {
    if (!this.canTransitionTo(EstadoActividad.CONFIRMADA)) {
      throw new Error(`No se puede confirmar una actividad en estado ${this._estado}`);
    }
    return new EstadoActividad(EstadoActividad.CONFIRMADA);
  }

  cancelar() {
    if (!this.canTransitionTo(EstadoActividad.CANCELADA)) {
      throw new Error(`No se puede cancelar una actividad en estado ${this._estado}`);
    }
    return new EstadoActividad(EstadoActividad.CANCELADA);
  }

  equals(other) {
    if (!(other instanceof EstadoActividad)) return false;
    return this._estado === other._estado;
  }

  toJSON() {
    return this._estado;
  }

  toString() {
    return this._estado;
  }

  static fromString(estado) {
    return new EstadoActividad(estado);
  }

  static getEstadosValidos() {
    return [...EstadoActividad.ESTADOS_VALIDOS];
  }
}
