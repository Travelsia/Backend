/**
 * Value Object: TimeSlot
 * Representa un intervalo de tiempo inmutable con validación
 */
export class TimeSlot {
  constructor(startTime, endTime) {
    this.#validate(startTime, endTime);
    this._startTime = this.#parseTime(startTime);
    this._endTime = this.#parseTime(endTime);
    Object.freeze(this);
  }

  #parseTime(time) {
    if (time instanceof Date) {
      return new Date(time);
    }
    
    // Si es string en formato HH:MM, crear Date con fecha base
    if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date(2000, 0, 1, hours, minutes, 0);
      return date;
    }
    
    // Si es string ISO
    return new Date(time);
  }

  #validate(startTime, endTime) {
    const start = this.#parseTime(startTime);
    const end = this.#parseTime(endTime);

    if (isNaN(start.getTime())) {
      throw new Error('Hora de inicio inválida');
    }

    if (isNaN(end.getTime())) {
      throw new Error('Hora de fin inválida');
    }

    if (end <= start) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  get startTime() {
    return new Date(this._startTime);
  }

  get endTime() {
    return new Date(this._endTime);
  }

  getDurationInMinutes() {
    return Math.floor((this._endTime - this._startTime) / (1000 * 60));
  }

  getDurationInHours() {
    return this.getDurationInMinutes() / 60;
  }

  overlaps(other) {
    if (!(other instanceof TimeSlot)) {
      throw new Error('Solo se puede comparar con otro TimeSlot');
    }

    return (
      (this._startTime < other._endTime && this._endTime > other._startTime) ||
      (other._startTime < this._endTime && other._endTime > this._startTime)
    );
  }

  contains(time) {
    const checkTime = this.#parseTime(time);
    return checkTime >= this._startTime && checkTime <= this._endTime;
  }

  equals(other) {
    if (!(other instanceof TimeSlot)) return false;
    return this._startTime.getTime() === other._startTime.getTime() &&
           this._endTime.getTime() === other._endTime.getTime();
  }

  toJSON() {
    return {
      startTime: this._startTime.toISOString(),
      endTime: this._endTime.toISOString(),
      durationMinutes: this.getDurationInMinutes()
    };
  }

  toString() {
    const formatTime = (date) => {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    return `${formatTime(this._startTime)} - ${formatTime(this._endTime)}`;
  }
}
