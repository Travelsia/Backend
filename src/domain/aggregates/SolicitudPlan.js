import { DateRange } from '../value-objects/DateRange.js';
import { Money } from '../value-objects/Money.js';
import { Place } from '../value-objects/Place.js';

/**
 * Agregado: SolicitudPlan
 * Representa una solicitud de planificación de viaje con sus invariantes
 */
export class SolicitudPlan {
  static STATUS = {
    PENDING: 'pending',
    DRAFT_GENERATED: 'draft_generated',
    COMPLETED: 'completed'
  };

  constructor({ id, userId, destination, dateRange, budget, interests = [], status = SolicitudPlan.STATUS.PENDING, createdAt, updatedAt }) {
    this.#validateInvariants(userId, destination, dateRange, budget);
    
    this._id = id;
    this._userId = userId;
    this._destination = destination instanceof Place ? destination : new Place(destination);
    this._dateRange = dateRange;
    this._budget = budget;
    this._interests = Array.isArray(interests) ? [...interests] : [];
    this._status = status;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  #validateInvariants(userId, destination, dateRange, budget) {
    if (!userId || typeof userId !== 'number') {
      throw new Error('El ID de usuario es requerido y debe ser un número');
    }

    if (!destination) {
      throw new Error('El destino es requerido');
    }

    if (!(dateRange instanceof DateRange)) {
      throw new Error('El rango de fechas debe ser un objeto DateRange válido');
    }

    if (!(budget instanceof Money)) {
      throw new Error('El presupuesto debe ser un objeto Money válido');
    }

    if (budget.amount <= 0) {
      throw new Error('El presupuesto debe ser mayor a cero');
    }
  }

  // Getters
  get id() {
    return this._id;
  }

  get userId() {
    return this._userId;
  }

  get destination() {
    return this._destination;
  }

  get dateRange() {
    return this._dateRange;
  }

  get budget() {
    return this._budget;
  }

  get interests() {
    return [...this._interests];
  }

  get status() {
    return this._status;
  }

  get createdAt() {
    return new Date(this._createdAt);
  }

  get updatedAt() {
    return new Date(this._updatedAt);
  }

  // Métodos de negocio
  markAsDraftGenerated() {
    if (this._status !== SolicitudPlan.STATUS.PENDING) {
      throw new Error('Solo se puede marcar como borrador generado desde el estado pendiente');
    }
    this._status = SolicitudPlan.STATUS.DRAFT_GENERATED;
    this._updatedAt = new Date();
  }

  markAsCompleted() {
    if (this._status === SolicitudPlan.STATUS.COMPLETED) {
      throw new Error('La solicitud ya está completada');
    }
    this._status = SolicitudPlan.STATUS.COMPLETED;
    this._updatedAt = new Date();
  }

  addInterest(interest) {
    if (!interest || typeof interest !== 'string') {
      throw new Error('El interés debe ser una cadena de texto válida');
    }
    const trimmedInterest = interest.trim();
    if (trimmedInterest.length === 0) {
      throw new Error('El interés no puede estar vacío');
    }
    if (!this._interests.includes(trimmedInterest)) {
      this._interests.push(trimmedInterest);
      this._updatedAt = new Date();
    }
  }

  removeInterest(interest) {
    const index = this._interests.indexOf(interest);
    if (index > -1) {
      this._interests.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  canBeModified() {
    return this._status === SolicitudPlan.STATUS.PENDING;
  }

  getDurationInDays() {
    return this._dateRange.getDurationInDays();
  }

  getBudgetPerDay() {
    const days = this.getDurationInDays();
    return this._budget.multiply(1 / days);
  }

  // Método estático para crear nuevas solicitudes
  static create({ userId, destination, startDate, endDate, budgetAmount, budgetCurrency = 'USD', interests = [] }) {
    const dateRange = new DateRange(startDate, endDate);
    const budget = new Money(budgetAmount, budgetCurrency);
    const place = typeof destination === 'string' ? new Place(destination) : destination;

    return new SolicitudPlan({
      userId,
      destination: place,
      dateRange,
      budget,
      interests,
      status: SolicitudPlan.STATUS.PENDING
    });
  }

  // Serialización para persistencia
  toPersistence() {
    return {
      id: this._id,
      user_id: this._userId,
      destination: this._destination.label,
      start_date: this._dateRange.startDate,
      end_date: this._dateRange.endDate,
      budget_amount: this._budget.amount,
      budget_currency: this._budget.currency,
      interests: this._interests,
      status: this._status,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  // Reconstrucción desde persistencia
  static fromPersistence(data) {
    return new SolicitudPlan({
      id: data.id,
      userId: data.user_id,
      destination: new Place(data.destination),
      dateRange: new DateRange(data.start_date, data.end_date),
      budget: new Money(data.budget_amount, data.budget_currency),
      interests: data.interests || [],
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }

  // Serialización para API
  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      destination: this._destination.toJSON(),
      dateRange: this._dateRange.toJSON(),
      budget: this._budget.toJSON(),
      budgetPerDay: this.getBudgetPerDay().toJSON(),
      interests: this.interests,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}
