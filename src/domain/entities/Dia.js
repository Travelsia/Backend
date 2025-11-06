import { Actividad } from './Actividad.js';

/**
 * Entidad: Dia
 * Representa un día dentro de un itinerario con sus actividades
 */
export class Dia {
  constructor({ id, fecha, numero, actividades = [] }) {
    this.#validate(fecha, numero);
    
    this._id = id;
    this._fecha = new Date(fecha);
    this._numero = numero;
    this._actividades = actividades.map(act => 
      act instanceof Actividad ? act : Actividad.fromPersistence(act)
    );
  }

  #validate(fecha, numero) {
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      throw new Error('La fecha del día es inválida');
    }

    if (typeof numero !== 'number' || numero < 1) {
      throw new Error('El número del día debe ser un entero positivo');
    }
  }

  // Getters
  get id() { return this._id; }
  get fecha() { return new Date(this._fecha); }
  get numero() { return this._numero; }
  get actividades() { return [...this._actividades]; }

  // Métodos de negocio
  agregarActividad(actividad) {
    if (!(actividad instanceof Actividad)) {
      throw new Error('Solo se pueden agregar objetos Actividad');
    }

    // Verificar solapes
    const haySolape = this._actividades.some(act => act.overlapsWith(actividad));
    if (haySolape) {
      throw new Error('La actividad se solapa con otra actividad existente en este día');
    }

    this._actividades.push(actividad);
    // Ordenar por hora de inicio
    this._actividades.sort((a, b) => 
      a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime()
    );
  }

  eliminarActividad(actividadId) {
    const index = this._actividades.findIndex(act => act.id === actividadId);
    if (index === -1) {
      throw new Error('Actividad no encontrada en este día');
    }
    this._actividades.splice(index, 1);
  }

  obtenerActividad(actividadId) {
    return this._actividades.find(act => act.id === actividadId);
  }

  actualizarActividad(actividadId, actualizaciones) {
    const actividad = this.obtenerActividad(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada en este día');
    }

    // Si se actualiza el timeSlot, verificar solapes con otras actividades
    if (actualizaciones.timeSlot) {
      const otrasSolapen = this._actividades
        .filter(act => act.id !== actividadId)
        .some(act => {
          const tempActividad = new Actividad({
            ...actividad,
            timeSlot: actualizaciones.timeSlot
          });
          return act.overlapsWith(tempActividad);
        });

      if (otrasSolapen) {
        throw new Error('El nuevo horario se solapa con otra actividad');
      }
    }

    // Aplicar actualizaciones
    if (actualizaciones.titulo) actividad.actualizarTitulo(actualizaciones.titulo);
    if (actualizaciones.descripcion !== undefined) actividad.actualizarDescripcion(actualizaciones.descripcion);
    if (actualizaciones.timeSlot) actividad.actualizarTimeSlot(actualizaciones.timeSlot);
    if (actualizaciones.costo) actividad.actualizarCosto(actualizaciones.costo);

    // Reordenar si cambió el timeSlot
    if (actualizaciones.timeSlot) {
      this._actividades.sort((a, b) => 
        a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime()
      );
    }
  }

  calcularCostoTotal() {
    if (this._actividades.length === 0) {
      return null;
    }

    // Asumir que todas las actividades están en la misma moneda del itinerario
    const primerCosto = this._actividades[0].costo;
    return this._actividades.reduce(
      (total, act) => total.add(act.costo),
      new (primerCosto.constructor)(0, primerCosto.currency)
    );
  }

  tieneActividades() {
    return this._actividades.length > 0;
  }

  cantidadActividades() {
    return this._actividades.length;
  }

  obtenerActividadesConfirmadas() {
    return this._actividades.filter(act => act.estado.isConfirmada());
  }

  obtenerActividadesPropuestas() {
    return this._actividades.filter(act => act.estado.isPropuesta());
  }

  toJSON() {
    return {
      id: this._id,
      fecha: this._fecha.toISOString().split('T')[0],
      numero: this._numero,
      actividades: this._actividades.map(act => act.toJSON()),
      costoTotal: this.calcularCostoTotal()?.toJSON() || null,
      cantidadActividades: this.cantidadActividades()
    };
  }

  toPersistence() {
    return {
      id: this._id,
      fecha: this._fecha,
      numero: this._numero
    };
  }

  static fromPersistence(data, actividades = []) {
    return new Dia({
      id: data.id,
      fecha: data.fecha,
      numero: data.numero,
      actividades
    });
  }
}
