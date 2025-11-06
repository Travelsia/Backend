import { TimeSlot } from '../value-objects/TimeSlot.js';
import { ActividadTipo } from '../value-objects/ActividadTipo.js';
import { EstadoActividad } from '../value-objects/EstadoActividad.js';
import { Money } from '../value-objects/Money.js';
import { Place } from '../value-objects/Place.js';

/**
 * Entidad: Actividad
 * Representa una actividad individual dentro de un día del itinerario
 */
export class Actividad {
  constructor({ 
    id, 
    titulo, 
    descripcion = '', 
    tipo, 
    lugar, 
    timeSlot, 
    costo, 
    estado = new EstadoActividad(EstadoActividad.PROPUESTA),
    metadataExterna = null
  }) {
    this.#validate(titulo, tipo, lugar, timeSlot, costo);
    
    this._id = id;
    this._titulo = titulo.trim();
    this._descripcion = descripcion.trim();
    this._tipo = tipo instanceof ActividadTipo ? tipo : new ActividadTipo(tipo);
    this._lugar = lugar instanceof Place ? lugar : new Place(lugar);
    this._timeSlot = timeSlot;
    this._costo = costo;
    this._estado = estado instanceof EstadoActividad ? estado : new EstadoActividad(estado);
    this._metadataExterna = metadataExterna; // Para referencias a IDs externos (ej: Amadeus)
  }

  #validate(titulo, tipo, lugar, timeSlot, costo) {
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      throw new Error('El título de la actividad es requerido');
    }

    if (!(timeSlot instanceof TimeSlot)) {
      throw new Error('El timeSlot debe ser un objeto TimeSlot válido');
    }

    if (!(costo instanceof Money)) {
      throw new Error('El costo debe ser un objeto Money válido');
    }
  }

  // Getters
  get id() { return this._id; }
  get titulo() { return this._titulo; }
  get descripcion() { return this._descripcion; }
  get tipo() { return this._tipo; }
  get lugar() { return this._lugar; }
  get timeSlot() { return this._timeSlot; }
  get costo() { return this._costo; }
  get estado() { return this._estado; }
  get metadataExterna() { return this._metadataExterna; }

  // Métodos de negocio
  confirmar() {
    this._estado = this._estado.confirmar();
  }

  cancelar() {
    this._estado = this._estado.cancelar();
  }

  actualizarTitulo(nuevoTitulo) {
    if (!nuevoTitulo || typeof nuevoTitulo !== 'string' || nuevoTitulo.trim().length === 0) {
      throw new Error('El título no puede estar vacío');
    }
    this._titulo = nuevoTitulo.trim();
  }

  actualizarDescripcion(nuevaDescripcion) {
    this._descripcion = (nuevaDescripcion || '').trim();
  }

  actualizarTimeSlot(nuevoTimeSlot) {
    if (!(nuevoTimeSlot instanceof TimeSlot)) {
      throw new Error('El timeSlot debe ser un objeto TimeSlot válido');
    }
    this._timeSlot = nuevoTimeSlot;
  }

  actualizarCosto(nuevoCosto) {
    if (!(nuevoCosto instanceof Money)) {
      throw new Error('El costo debe ser un objeto Money válido');
    }
    this._costo = nuevoCosto;
  }

  overlapsWith(otraActividad) {
    if (!(otraActividad instanceof Actividad)) {
      throw new Error('Solo se puede comparar con otra Actividad');
    }
    return this._timeSlot.overlaps(otraActividad._timeSlot);
  }

  toJSON() {
    return {
      id: this._id,
      titulo: this._titulo,
      descripcion: this._descripcion,
      tipo: this._tipo.toJSON(),
      lugar: this._lugar.toJSON(),
      timeSlot: this._timeSlot.toJSON(),
      costo: this._costo.toJSON(),
      estado: this._estado.toJSON(),
      metadataExterna: this._metadataExterna
    };
  }

  toPersistence() {
    return {
      id: this._id,
      titulo: this._titulo,
      descripcion: this._descripcion,
      tipo: this._tipo.tipo,
      lugar_label: this._lugar.label,
      lugar_latitude: this._lugar.latitude,
      lugar_longitude: this._lugar.longitude,
      start_time: this._timeSlot.startTime,
      end_time: this._timeSlot.endTime,
      costo_amount: this._costo.amount,
      costo_currency: this._costo.currency,
      estado: this._estado.estado,
      metadata_externa: this._metadataExterna ? JSON.stringify(this._metadataExterna) : null
    };
  }

  static fromPersistence(data) {
    return new Actividad({
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipo: new ActividadTipo(data.tipo),
      lugar: new Place(data.lugar_label, data.lugar_latitude, data.lugar_longitude),
      timeSlot: new TimeSlot(data.start_time, data.end_time),
      costo: new Money(data.costo_amount, data.costo_currency),
      estado: new EstadoActividad(data.estado),
      metadataExterna: data.metadata_externa ? JSON.parse(data.metadata_externa) : null
    });
  }
}
