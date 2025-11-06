import { Money } from '../value-objects/Money.js';

/**
 * Servicio de Dominio: CalculadoraDeCostos
 * Mantiene la consistencia del costo total del itinerario
 */
export class CalculadoraDeCostos {
  /**
   * Calcula el costo total de un itinerario
   */
  calcularCostoTotal(itinerario) {
    const monedaBase = itinerario.monedaBase;
    let total = new Money(0, monedaBase);

    for (const dia of itinerario.dias) {
      if (dia.tieneActividades()) {
        for (const actividad of dia.actividades) {
          // Solo sumar actividades no canceladas
          if (!actividad.estado.isCancelada()) {
            if (actividad.costo.currency !== monedaBase) {
              throw new Error(
                `Inconsistencia de moneda: actividad en ${actividad.costo.currency} pero itinerario en ${monedaBase}`
              );
            }
            total = total.add(actividad.costo);
          }
        }
      }
    }

    return total;
  }

  /**
   * Calcula el costo por día
   */
  calcularCostoPorDia(itinerario) {
    const total = this.calcularCostoTotal(itinerario);
    const dias = itinerario.dateRange.getDurationInDays();
    
    if (dias === 0) {
      throw new Error('El itinerario debe tener al menos un día');
    }

    return total.multiply(1 / dias);
  }

  /**
   * Calcula el costo por tipo de actividad
   */
  calcularCostoPorTipo(itinerario) {
    const costoPorTipo = {};
    const monedaBase = itinerario.monedaBase;

    for (const dia of itinerario.dias) {
      for (const actividad of dia.actividades) {
        if (!actividad.estado.isCancelada()) {
          const tipo = actividad.tipo.tipo;
          
          if (!costoPorTipo[tipo]) {
            costoPorTipo[tipo] = new Money(0, monedaBase);
          }
          
          costoPorTipo[tipo] = costoPorTipo[tipo].add(actividad.costo);
        }
      }
    }

    return costoPorTipo;
  }

  /**
   * Verifica si el itinerario excede un presupuesto dado
   */
  excedeBudget(itinerario, budgetMax) {
    const total = this.calcularCostoTotal(itinerario);
    
    if (total.currency !== budgetMax.currency) {
      throw new Error('El presupuesto debe estar en la misma moneda que el itinerario');
    }

    return total.isGreaterThan(budgetMax);
  }

  /**
   * Calcula el presupuesto restante
   */
  calcularPresupuestoRestante(itinerario, budgetMax) {
    const total = this.calcularCostoTotal(itinerario);
    
    if (total.currency !== budgetMax.currency) {
      throw new Error('El presupuesto debe estar en la misma moneda que el itinerario');
    }

    if (total.isGreaterThan(budgetMax)) {
      return new Money(0, budgetMax.currency);
    }

    return budgetMax.subtract(total);
  }

  /**
   * Calcula el porcentaje del presupuesto utilizado
   */
  calcularPorcentajePresupuesto(itinerario, budgetMax) {
    const total = this.calcularCostoTotal(itinerario);
    
    if (total.currency !== budgetMax.currency) {
      throw new Error('El presupuesto debe estar en la misma moneda que el itinerario');
    }

    if (budgetMax.amount === 0) {
      return 0;
    }

    return (total.amount / budgetMax.amount) * 100;
  }

  /**
   * Obtiene un resumen financiero completo
   */
  obtenerResumenFinanciero(itinerario, budgetMax = null) {
    const total = this.calcularCostoTotal(itinerario);
    const costoPorDia = this.calcularCostoPorDia(itinerario);
    const costoPorTipo = this.calcularCostoPorTipo(itinerario);

    const resumen = {
      total: total.toJSON(),
      costoPorDia: costoPorDia.toJSON(),
      costoPorTipo: Object.entries(costoPorTipo).reduce((acc, [tipo, costo]) => {
        acc[tipo] = costo.toJSON();
        return acc;
      }, {})
    };

    if (budgetMax) {
      resumen.presupuesto = {
        maximo: budgetMax.toJSON(),
        restante: this.calcularPresupuestoRestante(itinerario, budgetMax).toJSON(),
        porcentajeUtilizado: this.calcularPorcentajePresupuesto(itinerario, budgetMax),
        excedido: this.excedeBudget(itinerario, budgetMax)
      };
    }

    return resumen;
  }
}
