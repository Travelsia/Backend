/**
 * Servicio de Dominio: ValidadorDeSolapes
 * Detecta y previene conflictos de horario en actividades
 */
export class ValidadorDeSolapes {
  /**
   * Verifica si una actividad se solapa con otras en el mismo día
   */
  verificarSolape(dia, nuevaActividad, excluirActividadId = null) {
    const actividadesAComparar = dia.actividades.filter(act => 
      act.id !== excluirActividadId && !act.estado.isCancelada()
    );

    for (const actividad of actividadesAComparar) {
      if (nuevaActividad.overlapsWith(actividad)) {
        return {
          haySolape: true,
          actividadConflicto: actividad
        };
      }
    }

    return {
      haySolape: false,
      actividadConflicto: null
    };
  }

  /**
   * Encuentra todos los solapes en un día específico
   */
  encontrarTodosSolapes(dia) {
    const solapes = [];
    const actividades = dia.actividades.filter(act => !act.estado.isCancelada());

    for (let i = 0; i < actividades.length; i++) {
      for (let j = i + 1; j < actividades.length; j++) {
        if (actividades[i].overlapsWith(actividades[j])) {
          solapes.push({
            actividad1: actividades[i],
            actividad2: actividades[j],
            diaNumero: dia.numero
          });
        }
      }
    }

    return solapes;
  }

  /**
   * Encuentra todos los solapes en todo el itinerario
   */
  encontrarTodosSolapesEnItinerario(itinerario) {
    const todosSolapes = [];

    for (const dia of itinerario.dias) {
      const solapesDia = this.encontrarTodosSolapes(dia);
      todosSolapes.push(...solapesDia);
    }

    return todosSolapes;
  }

  /**
   * Verifica si el itinerario tiene algún solape
   */
  tieneAlgunSolape(itinerario) {
    return this.encontrarTodosSolapesEnItinerario(itinerario).length > 0;
  }

  /**
   * Obtiene las actividades que tienen conflictos de horario
   */
  obtenerActividadesConConflictos(itinerario) {
    const solapes = this.encontrarTodosSolapesEnItinerario(itinerario);
    const actividadesConConflicto = new Set();

    for (const solape of solapes) {
      actividadesConConflicto.add(solape.actividad1.id);
      actividadesConConflicto.add(solape.actividad2.id);
    }

    return Array.from(actividadesConConflicto);
  }

  /**
   * Sugiere un horario alternativo sin solapes
   */
  sugerirHorarioAlternativo(dia, nuevaActividad, excluirActividadId = null) {
    const duracionMinutos = nuevaActividad.timeSlot.getDurationInMinutes();
    const actividades = dia.actividades
      .filter(act => act.id !== excluirActividadId && !act.estado.isCancelada())
      .sort((a, b) => a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime());

    // Buscar espacios libres entre actividades
    const espaciosLibres = [];

    // Espacio antes de la primera actividad (desde las 6 AM)
    if (actividades.length > 0) {
      const inicioDelDia = new Date(dia.fecha);
      inicioDelDia.setHours(6, 0, 0, 0);
      
      const primeraActividad = actividades[0];
      const tiempoDisponible = (primeraActividad.timeSlot.startTime - inicioDelDia) / (1000 * 60);
      
      if (tiempoDisponible >= duracionMinutos) {
        espaciosLibres.push({
          inicio: inicioDelDia,
          fin: new Date(primeraActividad.timeSlot.startTime),
          duracionMinutos: tiempoDisponible
        });
      }
    }

    // Espacios entre actividades
    for (let i = 0; i < actividades.length - 1; i++) {
      const actual = actividades[i];
      const siguiente = actividades[i + 1];
      
      const tiempoDisponible = (siguiente.timeSlot.startTime - actual.timeSlot.endTime) / (1000 * 60);
      
      if (tiempoDisponible >= duracionMinutos) {
        espaciosLibres.push({
          inicio: new Date(actual.timeSlot.endTime),
          fin: new Date(siguiente.timeSlot.startTime),
          duracionMinutos: tiempoDisponible
        });
      }
    }

    // Espacio después de la última actividad (hasta las 11 PM)
    if (actividades.length > 0) {
      const finDelDia = new Date(dia.fecha);
      finDelDia.setHours(23, 0, 0, 0);
      
      const ultimaActividad = actividades[actividades.length - 1];
      const tiempoDisponible = (finDelDia - ultimaActividad.timeSlot.endTime) / (1000 * 60);
      
      if (tiempoDisponible >= duracionMinutos) {
        espaciosLibres.push({
          inicio: new Date(ultimaActividad.timeSlot.endTime),
          fin: finDelDia,
          duracionMinutos: tiempoDisponible
        });
      }
    }

    // Si no hay actividades, todo el día está libre
    if (actividades.length === 0) {
      const inicioDelDia = new Date(dia.fecha);
      inicioDelDia.setHours(6, 0, 0, 0);
      const finDelDia = new Date(dia.fecha);
      finDelDia.setHours(23, 0, 0, 0);
      
      espaciosLibres.push({
        inicio: inicioDelDia,
        fin: finDelDia,
        duracionMinutos: 17 * 60 // 6 AM a 11 PM
      });
    }

    return espaciosLibres;
  }

  /**
   * Valida la integridad de horarios en el itinerario completo
   */
  validarIntegridadHorarios(itinerario) {
    const errores = [];

    for (const dia of itinerario.dias) {
      const solapes = this.encontrarTodosSolapes(dia);
      
      if (solapes.length > 0) {
        errores.push({
          tipo: 'SOLAPE',
          diaNumero: dia.numero,
          fecha: dia.fecha,
          cantidad: solapes.length,
          detalles: solapes.map(s => ({
            actividad1: s.actividad1.titulo,
            actividad2: s.actividad2.titulo
          }))
        });
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Genera un reporte de ocupación por día
   */
  generarReporteOcupacion(itinerario) {
    const reporte = [];

    for (const dia of itinerario.dias) {
      const actividades = dia.actividades.filter(act => !act.estado.isCancelada());
      
      if (actividades.length === 0) {
        reporte.push({
          diaNumero: dia.numero,
          fecha: dia.fecha,
          ocupado: false,
          horaInicio: null,
          horaFin: null,
          tiempoOcupadoMinutos: 0,
          cantidadActividades: 0
        });
        continue;
      }

      const horaInicio = actividades.reduce((min, act) => {
        return act.timeSlot.startTime < min ? act.timeSlot.startTime : min;
      }, actividades[0].timeSlot.startTime);

      const horaFin = actividades.reduce((max, act) => {
        return act.timeSlot.endTime > max ? act.timeSlot.endTime : max;
      }, actividades[0].timeSlot.endTime);

      const tiempoOcupado = actividades.reduce((total, act) => {
        return total + act.timeSlot.getDurationInMinutes();
      }, 0);

      reporte.push({
        diaNumero: dia.numero,
        fecha: dia.fecha,
        ocupado: true,
        horaInicio,
        horaFin,
        tiempoOcupadoMinutos: tiempoOcupado,
        cantidadActividades: actividades.length,
        tieneSolapes: this.encontrarTodosSolapes(dia).length > 0
      });
    }

    return reporte;
  }
}
