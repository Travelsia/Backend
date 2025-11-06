import { Dia } from '../entities/Dia.js';
import { Actividad } from '../entities/Actividad.js';
import { DateRange } from '../value-objects/DateRange.js';
import { Money } from '../value-objects/Money.js';

/**
 * Agregado Raíz: Itinerario
 * Representa el plan completo de viaje con sus días y actividades
 */
export class Itinerario {
  static ESTADOS = {
    BORRADOR: 'borrador',
    PUBLICADO: 'publicado',
    ARCHIVADO: 'archivado'
  };

  constructor({ 
    id, 
    planRequestId, 
    userId, 
    titulo, 
    descripcion = '', 
    dateRange, 
    dias = [],
    estado = Itinerario.ESTADOS.BORRADOR,
    monedaBase = 'USD',
    createdAt,
    updatedAt
  }) {
    this.#validateInvariants(planRequestId, userId, titulo, dateRange);
    
    this._id = id;
    this._planRequestId = planRequestId;
    this._userId = userId;
    this._titulo = titulo.trim();
    this._descripcion = descripcion.trim();
    this._dateRange = dateRange;
    this._dias = dias.map(dia => dia instanceof Dia ? dia : Dia.fromPersistence(dia));
    this._estado = estado;
    this._monedaBase = monedaBase;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  #validateInvariants(planRequestId, userId, titulo, dateRange) {
    if (!planRequestId || typeof planRequestId !== 'number') {
      throw new Error('El ID de la solicitud de plan es requerido');
    }

    if (!userId || typeof userId !== 'number') {
      throw new Error('El ID de usuario es requerido');
    }

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      throw new Error('El título del itinerario es requerido');
    }

    if (!(dateRange instanceof DateRange)) {
      throw new Error('El rango de fechas debe ser un objeto DateRange válido');
    }
  }

  // Getters
  get id() { return this._id; }
  get planRequestId() { return this._planRequestId; }
  get userId() { return this._userId; }
  get titulo() { return this._titulo; }
  get descripcion() { return this._descripcion; }
  get dateRange() { return this._dateRange; }
  get dias() { return [...this._dias]; }
  get estado() { return this._estado; }
  get monedaBase() { return this._monedaBase; }
  get createdAt() { return new Date(this._createdAt); }
  get updatedAt() { return new Date(this._updatedAt); }

  // Métodos de gestión de días
  obtenerDia(diaNumero) {
    return this._dias.find(dia => dia.numero === diaNumero);
  }

  obtenerDiaPorFecha(fecha) {
    const fechaBuscar = new Date(fecha).toISOString().split('T')[0];
    return this._dias.find(dia => 
      dia.fecha.toISOString().split('T')[0] === fechaBuscar
    );
  }

  // Métodos de gestión de actividades
  agregarActividad(diaNumero, actividad) {
    if (!this.puedeModificarse()) {
      throw new Error('El itinerario no puede ser modificado en su estado actual');
    }

    const dia = this.obtenerDia(diaNumero);
    if (!dia) {
      throw new Error(`Día ${diaNumero} no encontrado en el itinerario`);
    }

    // Verificar que el costo esté en la moneda base
    if (actividad.costo.currency !== this._monedaBase) {
      throw new Error(`El costo debe estar en ${this._monedaBase}, la moneda base del itinerario`);
    }

    dia.agregarActividad(actividad);
    this._updatedAt = new Date();
  }

  eliminarActividad(diaNumero, actividadId) {
    if (!this.puedeModificarse()) {
      throw new Error('El itinerario no puede ser modificado en su estado actual');
    }

    const dia = this.obtenerDia(diaNumero);
    if (!dia) {
      throw new Error(`Día ${diaNumero} no encontrado en el itinerario`);
    }

    dia.eliminarActividad(actividadId);
    this._updatedAt = new Date();
  }

  actualizarActividad(diaNumero, actividadId, actualizaciones) {
    if (!this.puedeModificarse()) {
      throw new Error('El itinerario no puede ser modificado en su estado actual');
    }

    const dia = this.obtenerDia(diaNumero);
    if (!dia) {
      throw new Error(`Día ${diaNumero} no encontrado en el itinerario`);
    }

    // Verificar moneda si se actualiza el costo
    if (actualizaciones.costo && actualizaciones.costo.currency !== this._monedaBase) {
      throw new Error(`El costo debe estar en ${this._monedaBase}, la moneda base del itinerario`);
    }

    dia.actualizarActividad(actividadId, actualizaciones);
    this._updatedAt = new Date();
  }

  confirmarActividad(diaNumero, actividadId) {
    const dia = this.obtenerDia(diaNumero);
    if (!dia) {
      throw new Error(`Día ${diaNumero} no encontrado`);
    }

    const actividad = dia.obtenerActividad(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }

    actividad.confirmar();
    this._updatedAt = new Date();
  }

  cancelarActividad(diaNumero, actividadId) {
    const dia = this.obtenerDia(diaNumero);
    if (!dia) {
      throw new Error(`Día ${diaNumero} no encontrado`);
    }

    const actividad = dia.obtenerActividad(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }

    actividad.cancelar();
    this._updatedAt = new Date();
  }

  // Métodos de cálculo
  calcularCostoTotal() {
    const diasConActividades = this._dias.filter(dia => dia.tieneActividades());
    
    if (diasConActividades.length === 0) {
      return new Money(0, this._monedaBase);
    }

    return diasConActividades.reduce((total, dia) => {
      const costoDia = dia.calcularCostoTotal();
      return costoDia ? total.add(costoDia) : total;
    }, new Money(0, this._monedaBase));
  }

  calcularCostoPorDia() {
    const total = this.calcularCostoTotal();
    const dias = this._dateRange.getDurationInDays();
    return total.multiply(1 / dias);
  }

  obtenerResumenActividades() {
    const todasActividades = this._dias.flatMap(dia => dia.actividades);
    return {
      total: todasActividades.length,
      confirmadas: todasActividades.filter(act => act.estado.isConfirmada()).length,
      propuestas: todasActividades.filter(act => act.estado.isPropuesta()).length,
      canceladas: todasActividades.filter(act => act.estado.isCancelada()).length
    };
  }

  obtenerActividadesPorTipo() {
    const todasActividades = this._dias.flatMap(dia => dia.actividades);
    const porTipo = {};
    
    todasActividades.forEach(act => {
      const tipo = act.tipo.tipo;
      if (!porTipo[tipo]) {
        porTipo[tipo] = [];
      }
      porTipo[tipo].push(act);
    });

    return porTipo;
  }

  // Métodos de estado
  puedeModificarse() {
    return this._estado === Itinerario.ESTADOS.BORRADOR || 
           this._estado === Itinerario.ESTADOS.PUBLICADO;
  }

  publicar() {
    if (this._estado === Itinerario.ESTADOS.PUBLICADO) {
      throw new Error('El itinerario ya está publicado');
    }
    if (this._estado === Itinerario.ESTADOS.ARCHIVADO) {
      throw new Error('No se puede publicar un itinerario archivado');
    }
    this._estado = Itinerario.ESTADOS.PUBLICADO;
    this._updatedAt = new Date();
  }

  archivar() {
    this._estado = Itinerario.ESTADOS.ARCHIVADO;
    this._updatedAt = new Date();
  }

  actualizarTitulo(nuevoTitulo) {
    if (!nuevoTitulo || typeof nuevoTitulo !== 'string' || nuevoTitulo.trim().length === 0) {
      throw new Error('El título no puede estar vacío');
    }
    this._titulo = nuevoTitulo.trim();
    this._updatedAt = new Date();
  }

  actualizarDescripcion(nuevaDescripcion) {
    this._descripcion = (nuevaDescripcion || '').trim();
    this._updatedAt = new Date();
  }

  // Método factory para crear itinerario desde SolicitudPlan
  static crearDesdeSolicitudPlan(solicitudPlan, titulo = null) {
    const tituloItinerario = titulo || `Viaje a ${solicitudPlan.destination.label}`;
    const dateRange = solicitudPlan.dateRange;
    
    // Crear días vacíos para cada día del rango
    const dias = [];
    const duracion = dateRange.getDurationInDays();
    let fechaActual = new Date(dateRange.startDate);
    
    for (let i = 0; i < duracion; i++) {
      dias.push(new Dia({
        fecha: new Date(fechaActual),
        numero: i + 1,
        actividades: []
      }));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return new Itinerario({
      planRequestId: solicitudPlan.id,
      userId: solicitudPlan.userId,
      titulo: tituloItinerario,
      descripcion: `Itinerario generado para viaje a ${solicitudPlan.destination.label}`,
      dateRange: dateRange,
      dias: dias,
      monedaBase: solicitudPlan.budget.currency,
      estado: Itinerario.ESTADOS.BORRADOR
    });
  }

  // Serialización
  toJSON() {
    return {
      id: this._id,
      planRequestId: this._planRequestId,
      userId: this._userId,
      titulo: this._titulo,
      descripcion: this._descripcion,
      dateRange: this._dateRange.toJSON(),
      dias: this._dias.map(dia => dia.toJSON()),
      estado: this._estado,
      monedaBase: this._monedaBase,
      costoTotal: this.calcularCostoTotal().toJSON(),
      costoPorDia: this.calcularCostoPorDia().toJSON(),
      resumenActividades: this.obtenerResumenActividades(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }

  toPersistence() {
    return {
      id: this._id,
      plan_request_id: this._planRequestId,
      user_id: this._userId,
      titulo: this._titulo,
      descripcion: this._descripcion,
      start_date: this._dateRange.startDate,
      end_date: this._dateRange.endDate,
      estado: this._estado,
      moneda_base: this._monedaBase,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  static fromPersistence(data, dias = []) {
    return new Itinerario({
      id: data.id,
      planRequestId: data.plan_request_id,
      userId: data.user_id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      dateRange: new DateRange(data.start_date, data.end_date),
      dias: dias,
      estado: data.estado,
      monedaBase: data.moneda_base,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }
}
