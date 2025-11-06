/**
 * Value Object: EstadoComparticion
 * Representa el estado del proceso de compartición
 */
export class EstadoComparticion {
  static PENDIENTE = 'PENDIENTE';
  static ACEPTADO = 'ACEPTADO';
  static RECHAZADO = 'RECHAZADO';
  static REVOCADO = 'REVOCADO';
  static EXPIRADO = 'EXPIRADO';

  static ESTADOS_VALIDOS = [
    EstadoComparticion.PENDIENTE,
    EstadoComparticion.ACEPTADO,
    EstadoComparticion.RECHAZADO,
    EstadoComparticion.REVOCADO,
    EstadoComparticion.EXPIRADO
  ];

  #estado;

  constructor(estado = EstadoComparticion.PENDIENTE) {
    if (!estado || typeof estado !== 'string') {
      throw new Error('El estado de compartición es requerido');
    }

    const normalizado = estado.toUpperCase();

    if (!EstadoComparticion.ESTADOS_VALIDOS.includes(normalizado)) {
      throw new Error(
        `Estado de compartición inválido: ${estado}. Debe ser uno de: ${EstadoComparticion.ESTADOS_VALIDOS.join(', ')}`
      );
    }

    this.#estado = normalizado;
    Object.freeze(this);
  }

  get estado() {
    return this.#estado;
  }

  // Verificaciones de estado
  isPendiente() {
    return this.#estado === EstadoComparticion.PENDIENTE;
  }

  isAceptado() {
    return this.#estado === EstadoComparticion.ACEPTADO;
  }

  isRechazado() {
    return this.#estado === EstadoComparticion.RECHAZADO;
  }

  isRevocado() {
    return this.#estado === EstadoComparticion.REVOCADO;
  }

  isExpirado() {
    return this.#estado === EstadoComparticion.EXPIRADO;
  }

  // Verificar si está activo (aceptado y no revocado/expirado)
  estaActivo() {
    return this.#estado === EstadoComparticion.ACEPTADO;
  }

  // Verificar si puede ser aceptado
  puedeSerAceptado() {
    return this.#estado === EstadoComparticion.PENDIENTE;
  }

  // Verificar si puede ser revocado
  puedeSerRevocado() {
    return this.#estado === EstadoComparticion.ACEPTADO || 
           this.#estado === EstadoComparticion.PENDIENTE;
  }

  // Transiciones de estado
  canTransitionTo(nuevoEstado) {
    const nuevo = nuevoEstado instanceof EstadoComparticion 
      ? nuevoEstado.estado 
      : nuevoEstado.toUpperCase();

    switch (this.#estado) {
      case EstadoComparticion.PENDIENTE:
        return [
          EstadoComparticion.ACEPTADO,
          EstadoComparticion.RECHAZADO,
          EstadoComparticion.REVOCADO,
          EstadoComparticion.EXPIRADO
        ].includes(nuevo);

      case EstadoComparticion.ACEPTADO:
        return [
          EstadoComparticion.REVOCADO,
          EstadoComparticion.EXPIRADO
        ].includes(nuevo);

      case EstadoComparticion.RECHAZADO:
      case EstadoComparticion.REVOCADO:
      case EstadoComparticion.EXPIRADO:
        return false; // Estados finales

      default:
        return false;
    }
  }

  // Métodos de transición
  aceptar() {
    if (!this.canTransitionTo(EstadoComparticion.ACEPTADO)) {
      throw new Error(`No se puede aceptar una compartición en estado ${this.#estado}`);
    }
    return new EstadoComparticion(EstadoComparticion.ACEPTADO);
  }

  rechazar() {
    if (!this.canTransitionTo(EstadoComparticion.RECHAZADO)) {
      throw new Error(`No se puede rechazar una compartición en estado ${this.#estado}`);
    }
    return new EstadoComparticion(EstadoComparticion.RECHAZADO);
  }

  revocar() {
    if (!this.canTransitionTo(EstadoComparticion.REVOCADO)) {
      throw new Error(`No se puede revocar una compartición en estado ${this.#estado}`);
    }
    return new EstadoComparticion(EstadoComparticion.REVOCADO);
  }

  expirar() {
    if (!this.canTransitionTo(EstadoComparticion.EXPIRADO)) {
      throw new Error(`No se puede expirar una compartición en estado ${this.#estado}`);
    }
    return new EstadoComparticion(EstadoComparticion.EXPIRADO);
  }

  equals(other) {
    if (!(other instanceof EstadoComparticion)) {
      return false;
    }
    return this.#estado === other.#estado;
  }

  toString() {
    return this.#estado;
  }

  toJSON() {
    return {
      estado: this.#estado,
      estaActivo: this.estaActivo(),
      puedeSerAceptado: this.puedeSerAceptado(),
      puedeSerRevocado: this.puedeSerRevocado()
    };
  }

  static from(value) {
    if (value instanceof EstadoComparticion) {
      return value;
    }
    return new EstadoComparticion(value);
  }

  static getEstadosValidos() {
    return [...EstadoComparticion.ESTADOS_VALIDOS];
  }

  // Descripción amigable
  get descripcion() {
    const descripciones = {
      PENDIENTE: 'Esperando aceptación del usuario',
      ACEPTADO: 'Compartición activa',
      RECHAZADO: 'Usuario rechazó la invitación',
      REVOCADO: 'Propietario revocó el acceso',
      EXPIRADO: 'Link de compartición expirado'
    };
    return descripciones[this.#estado];
  }
}
