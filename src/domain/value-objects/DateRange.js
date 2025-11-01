/**
 * Value Object: DateRange
 * Representa un rango de fechas inmutable con validación
 */
export class DateRange {
  constructor(startDate, endDate) {
    this.#validate(startDate, endDate);
    this._startDate = new Date(startDate);
    this._endDate = new Date(endDate);
    Object.freeze(this);
  }

  #validate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new Error('Fecha de inicio inválida');
    }

    if (isNaN(end.getTime())) {
      throw new Error('Fecha de fin inválida');
    }

    if (end < start) {
      throw new Error('La fecha de fin debe ser posterior o igual a la fecha de inicio');
    }
  }

  get startDate() {
    return new Date(this._startDate);
  }

  get endDate() {
    return new Date(this._endDate);
  }

  getDurationInDays() {
    const diffTime = Math.abs(this._endDate - this._startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
  }

  includes(date) {
    const checkDate = new Date(date);
    return checkDate >= this._startDate && checkDate <= this._endDate;
  }

  equals(other) {
    if (!(other instanceof DateRange)) return false;
    return this._startDate.getTime() === other._startDate.getTime() &&
           this._endDate.getTime() === other._endDate.getTime();
  }

  toJSON() {
    return {
      startDate: this._startDate.toISOString().split('T')[0],
      endDate: this._endDate.toISOString().split('T')[0],
      durationDays: this.getDurationInDays()
    };
  }
}
