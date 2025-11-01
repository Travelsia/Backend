/**
 * Value Object: Place
 * Unifica etiqueta, latitud y longitud para representar un lugar
 */
export class Place {
  constructor(label, latitude = null, longitude = null) {
    this.#validate(label, latitude, longitude);
    this._label = label.trim();
    this._latitude = latitude;
    this._longitude = longitude;
    Object.freeze(this);
  }

  #validate(label, latitude, longitude) {
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      throw new Error('El lugar debe tener una etiqueta válida');
    }

    if (latitude !== null) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('La latitud debe estar entre -90 y 90 grados');
      }
    }

    if (longitude !== null) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('La longitud debe estar entre -180 y 180 grados');
      }
    }

    // Si se proporciona una coordenada, ambas deben estar presentes
    if ((latitude !== null && longitude === null) || (latitude === null && longitude !== null)) {
      throw new Error('Si se proporcionan coordenadas, tanto latitud como longitud son requeridas');
    }
  }

  get label() {
    return this._label;
  }

  get latitude() {
    return this._latitude;
  }

  get longitude() {
    return this._longitude;
  }

  hasCoordinates() {
    return this._latitude !== null && this._longitude !== null;
  }

  equals(other) {
    if (!(other instanceof Place)) return false;
    return this._label === other._label &&
           this._latitude === other._latitude &&
           this._longitude === other._longitude;
  }

  toJSON() {
    const result = { label: this._label };
    if (this.hasCoordinates()) {
      result.latitude = this._latitude;
      result.longitude = this._longitude;
    }
    return result;
  }

  toString() {
    if (this.hasCoordinates()) {
      return `${this._label} (${this._latitude}, ${this._longitude})`;
    }
    return this._label;
  }
}
