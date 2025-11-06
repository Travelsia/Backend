import { Permiso } from '../value-objects/Permiso.js';
import { LinkComparticion } from '../value-objects/LinkComparticion.js';
import { EstadoComparticion } from '../value-objects/EstadoComparticion.js';

/**
 * Aggregate Root: Comparticion
 * Gestiona el proceso de compartir itinerarios con otros usuarios
 */
export class Comparticion {
  #id;
  #itinerarioId;
  #propietarioId;
  #compartidoConId; // null si es por link
  #compartidoConEmail; // email del destinatario
  #permiso;
  #link;
  #estado;
  #mensaje; // Mensaje opcional del propietario
  #fechaCreacion;
  #fechaAceptacion;
  #fechaRevocacion;

  constructor({
    id = null,
    itinerarioId,
    propietarioId,
    compartidoConId = null,
    compartidoConEmail,
    permiso,
    link,
    estado = null,
    mensaje = null,
    fechaCreacion = null,
    fechaAceptacion = null,
    fechaRevocacion = null
  }) {
    this.#validar(itinerarioId, propietarioId, compartidoConEmail, permiso, link);

    this.#id = id;
    this.#itinerarioId = itinerarioId;
    this.#propietarioId = propietarioId;
    this.#compartidoConId = compartidoConId;
    this.#compartidoConEmail = compartidoConEmail;
    this.#permiso = permiso instanceof Permiso ? permiso : new Permiso(permiso);
    this.#link = link instanceof LinkComparticion ? link : LinkComparticion.from(link.token, link.fechaExpiracion);
    this.#estado = estado ? (estado instanceof EstadoComparticion ? estado : new EstadoComparticion(estado)) : new EstadoComparticion();
    this.#mensaje = mensaje;
    this.#fechaCreacion = fechaCreacion || new Date();
    this.#fechaAceptacion = fechaAceptacion;
    this.#fechaRevocacion = fechaRevocacion;
  }

  #validar(itinerarioId, propietarioId, compartidoConEmail, permiso, link) {
    if (!itinerarioId || typeof itinerarioId !== 'number') {
      throw new Error('El ID del itinerario es requerido');
    }

    if (!propietarioId || typeof propietarioId !== 'number') {
      throw new Error('El ID del propietario es requerido');
    }

    if (!compartidoConEmail || typeof compartidoConEmail !== 'string') {
      throw new Error('El email del destinatario es requerido');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(compartidoConEmail)) {
      throw new Error('El formato del email es inválido');
    }

    if (!permiso) {
      throw new Error('El permiso es requerido');
    }

    if (!link) {
      throw new Error('El link de compartición es requerido');
    }
  }

  // Getters
  get id() { return this.#id; }
  get itinerarioId() { return this.#itinerarioId; }
  get propietarioId() { return this.#propietarioId; }
  get compartidoConId() { return this.#compartidoConId; }
  get compartidoConEmail() { return this.#compartidoConEmail; }
  get permiso() { return this.#permiso; }
  get link() { return this.#link; }
  get estado() { return this.#estado; }
  get mensaje() { return this.#mensaje; }
  get fechaCreacion() { return new Date(this.#fechaCreacion); }
  get fechaAceptacion() { return this.#fechaAceptacion ? new Date(this.#fechaAceptacion) : null; }
  get fechaRevocacion() { return this.#fechaRevocacion ? new Date(this.#fechaRevocacion) : null; }

  // Métodos de negocio

  /**
   * Aceptar la compartición (usuario destinatario)
   */
  aceptar(userId) {
    if (!this.#estado.puedeSerAceptado()) {
      throw new Error('Esta compartición no puede ser aceptada');
    }

    if (this.#link.haExpirado()) {
      this.#estado = this.#estado.expirar();
      throw new Error('El link de compartición ha expirado');
    }

    this.#estado = this.#estado.aceptar();
    this.#compartidoConId = userId;
    this.#fechaAceptacion = new Date();
  }

  /**
   * Rechazar la compartición
   */
  rechazar() {
    if (!this.#estado.isPendiente()) {
      throw new Error('Solo se pueden rechazar comparticiones pendientes');
    }

    this.#estado = this.#estado.rechazar();
  }

  /**
   * Revocar el acceso (propietario)
   */
  revocar(userId) {
    if (userId !== this.#propietarioId) {
      throw new Error('Solo el propietario puede revocar el acceso');
    }

    if (!this.#estado.puedeSerRevocado()) {
      throw new Error('Esta compartición no puede ser revocada');
    }

    this.#estado = this.#estado.revocar();
    this.#fechaRevocacion = new Date();
  }

  /**
   * Verificar si un usuario tiene acceso
   */
  tieneAcceso(userId) {
    if (userId === this.#propietarioId) {
      return true; // Propietario siempre tiene acceso
    }

    if (userId === this.#compartidoConId && this.#estado.estaActivo()) {
      return !this.#link.haExpirado();
    }

    return false;
  }

  /**
   * Verificar si el link es válido
   */
  linkEsValido() {
    return !this.#link.haExpirado() && 
           (this.#estado.isPendiente() || this.#estado.estaActivo());
  }

  /**
   * Renovar el link (generar uno nuevo)
   */
  renovarLink(userId, diasValidez = 7) {
    if (userId !== this.#propietarioId) {
      throw new Error('Solo el propietario puede renovar el link');
    }

    if (!this.#estado.estaActivo() && !this.#estado.isPendiente()) {
      throw new Error('Solo se pueden renovar links de comparticiones activas o pendientes');
    }

    this.#link = LinkComparticion.generar(diasValidez);
  }

  /**
   * Actualizar el permiso
   */
  actualizarPermiso(userId, nuevoPermiso) {
    if (userId !== this.#propietarioId) {
      throw new Error('Solo el propietario puede actualizar permisos');
    }

    if (!this.#estado.estaActivo()) {
      throw new Error('Solo se pueden actualizar permisos de comparticiones activas');
    }

    const permisoObj = nuevoPermiso instanceof Permiso ? nuevoPermiso : new Permiso(nuevoPermiso);
    
    // No se puede cambiar a PROPIETARIO
    if (permisoObj.isPropietario()) {
      throw new Error('No se puede asignar el rol de propietario a un colaborador');
    }

    this.#permiso = permisoObj;
  }

  /**
   * Verificar y marcar como expirado si el link expiró
   */
  verificarExpiracion() {
    if (this.#link.haExpirado() && 
        (this.#estado.isPendiente() || this.#estado.estaActivo())) {
      this.#estado = this.#estado.expirar();
      return true;
    }
    return false;
  }

  // Serialización

  toJSON() {
    return {
      id: this.#id,
      itinerarioId: this.#itinerarioId,
      propietarioId: this.#propietarioId,
      compartidoConId: this.#compartidoConId,
      compartidoConEmail: this.#compartidoConEmail,
      permiso: this.#permiso.toJSON(),
      link: this.#link.toJSON(),
      estado: this.#estado.toJSON(),
      mensaje: this.#mensaje,
      fechaCreacion: this.#fechaCreacion.toISOString(),
      fechaAceptacion: this.#fechaAceptacion?.toISOString() || null,
      fechaRevocacion: this.#fechaRevocacion?.toISOString() || null,
      tieneAccesoActivo: this.#estado.estaActivo() && this.linkEsValido()
    };
  }

  toPersistence() {
    return {
      id: this.#id,
      itinerary_id: this.#itinerarioId,
      owner_id: this.#propietarioId,
      shared_with_id: this.#compartidoConId,
      shared_with_email: this.#compartidoConEmail,
      role: this.#permiso.rol,
      share_token: this.#link.token,
      expires_at: this.#link.fechaExpiracion,
      estado: this.#estado.estado,
      mensaje: this.#mensaje,
      created_at: this.#fechaCreacion,
      accepted_at: this.#fechaAceptacion,
      revoked_at: this.#fechaRevocacion
    };
  }

  // Factory methods

  static crear({
    itinerarioId,
    propietarioId,
    compartidoConEmail,
    permiso,
    mensaje = null,
    diasValidez = 7
  }) {
    const link = LinkComparticion.generar(diasValidez);

    return new Comparticion({
      itinerarioId,
      propietarioId,
      compartidoConEmail,
      permiso,
      link,
      mensaje,
      estado: new EstadoComparticion(EstadoComparticion.PENDIENTE)
    });
  }

  static fromPersistence(data) {
    return new Comparticion({
      id: data.id,
      itinerarioId: data.itinerary_id,
      propietarioId: data.owner_id,
      compartidoConId: data.shared_with_id,
      compartidoConEmail: data.shared_with_email,
      permiso: new Permiso(data.role),
      link: LinkComparticion.from(data.share_token, new Date(data.expires_at)),
      estado: new EstadoComparticion(data.estado),
      mensaje: data.mensaje,
      fechaCreacion: data.created_at ? new Date(data.created_at) : null,
      fechaAceptacion: data.accepted_at ? new Date(data.accepted_at) : null,
      fechaRevocacion: data.revoked_at ? new Date(data.revoked_at) : null
    });
  }
}
