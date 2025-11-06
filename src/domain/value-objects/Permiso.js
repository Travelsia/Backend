/**
 * Value Object: Permiso
 * Define los niveles de acceso para colaboradores en un itinerario
 */
export class Permiso {
  static PROPIETARIO = 'PROPIETARIO';
  static EDITOR = 'EDITOR';
  static LECTOR = 'LECTOR';

  static PERMISOS_VALIDOS = [
    Permiso.PROPIETARIO,
    Permiso.EDITOR,
    Permiso.LECTOR
  ];

  static JERARQUIA = {
    PROPIETARIO: 3,
    EDITOR: 2,
    LECTOR: 1
  };

  #rol;

  constructor(rol) {
    if (!rol || typeof rol !== 'string') {
      throw new Error('El rol del permiso es requerido');
    }

    const normalizado = rol.toUpperCase();

    if (!Permiso.PERMISOS_VALIDOS.includes(normalizado)) {
      throw new Error(
        `Permiso inválido: ${rol}. Debe ser uno de: ${Permiso.PERMISOS_VALIDOS.join(', ')}`
      );
    }

    this.#rol = normalizado;
    Object.freeze(this);
  }

  get rol() {
    return this.#rol;
  }

  // Verificaciones de tipo
  isPropietario() {
    return this.#rol === Permiso.PROPIETARIO;
  }

  isEditor() {
    return this.#rol === Permiso.EDITOR;
  }

  isLector() {
    return this.#rol === Permiso.LECTOR;
  }

  // Capacidades
  puedeEditar() {
    return this.#rol === Permiso.PROPIETARIO || this.#rol === Permiso.EDITOR;
  }

  puedeEliminar() {
    return this.#rol === Permiso.PROPIETARIO;
  }

  puedeCompartir() {
    return this.#rol === Permiso.PROPIETARIO;
  }

  puedeLeer() {
    return true; // Todos los roles pueden leer
  }

  puedeRevocarAcceso() {
    return this.#rol === Permiso.PROPIETARIO;
  }

  // Comparación jerárquica
  esMayorOIgualQue(otroPermiso) {
    if (!(otroPermiso instanceof Permiso)) {
      throw new Error('Solo se puede comparar con otro Permiso');
    }

    return Permiso.JERARQUIA[this.#rol] >= Permiso.JERARQUIA[otroPermiso.rol];
  }

  esMenorQue(otroPermiso) {
    if (!(otroPermiso instanceof Permiso)) {
      throw new Error('Solo se puede comparar con otro Permiso');
    }

    return Permiso.JERARQUIA[this.#rol] < Permiso.JERARQUIA[otroPermiso.rol];
  }

  equals(other) {
    if (!(other instanceof Permiso)) {
      return false;
    }
    return this.#rol === other.#rol;
  }

  toString() {
    return this.#rol;
  }

  toJSON() {
    return {
      rol: this.#rol,
      puedeEditar: this.puedeEditar(),
      puedeEliminar: this.puedeEliminar(),
      puedeCompartir: this.puedeCompartir(),
      puedeLeer: this.puedeLeer()
    };
  }

  static from(value) {
    if (value instanceof Permiso) {
      return value;
    }
    return new Permiso(value);
  }

  static getPermisosValidos() {
    return [...Permiso.PERMISOS_VALIDOS];
  }

  // Descripción amigable
  get descripcion() {
    const descripciones = {
      PROPIETARIO: 'Control total del itinerario',
      EDITOR: 'Puede ver y editar actividades',
      LECTOR: 'Solo puede ver el itinerario'
    };
    return descripciones[this.#rol];
  }
}
