/**
 * Value Object: Money
 * Encapsula monto y moneda con validaciones
 */
export class Money {
  constructor(amount, currency = 'USD') {
    this.#validate(amount, currency);
    this._amount = parseFloat(amount);
    this._currency = currency.toUpperCase();
    Object.freeze(this);
  }

  #validate(amount, currency) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      throw new Error('El monto debe ser un número válido');
    }

    if (numAmount < 0) {
      throw new Error('El monto no puede ser negativo');
    }

    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
      throw new Error('La moneda debe ser un código ISO 4217 de 3 letras');
    }
  }

  get amount() {
    return this._amount;
  }

  get currency() {
    return this._currency;
  }

  add(other) {
    if (!(other instanceof Money)) {
      throw new Error('Solo se puede sumar con otro objeto Money');
    }
    if (this._currency !== other._currency) {
      throw new Error(`No se pueden sumar monedas diferentes: ${this._currency} y ${other._currency}`);
    }
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error('Solo se puede restar con otro objeto Money');
    }
    if (this._currency !== other._currency) {
      throw new Error(`No se pueden restar monedas diferentes: ${this._currency} y ${other._currency}`);
    }
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new Error('El resultado de la resta no puede ser negativo');
    }
    return new Money(result, this._currency);
  }

  multiply(factor) {
    if (typeof factor !== 'number' || factor < 0) {
      throw new Error('El factor debe ser un número no negativo');
    }
    return new Money(this._amount * factor, this._currency);
  }

  isGreaterThan(other) {
    if (this._currency !== other._currency) {
      throw new Error('No se pueden comparar monedas diferentes');
    }
    return this._amount > other._amount;
  }

  isLessThan(other) {
    if (this._currency !== other._currency) {
      throw new Error('No se pueden comparar monedas diferentes');
    }
    return this._amount < other._amount;
  }

  equals(other) {
    if (!(other instanceof Money)) return false;
    return this._amount === other._amount && this._currency === other._currency;
  }

  toJSON() {
    return {
      amount: this._amount,
      currency: this._currency
    };
  }

  toString() {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }
}
