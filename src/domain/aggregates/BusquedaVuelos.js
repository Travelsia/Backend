import { IATA } from '../value-objects/IATA.js';
import { Cabina } from '../value-objects/Cabina.js';
import { OfertaVuelo } from '../value-objects/OfertaVuelo.js';

/**
 * Agregado: BusquedaVuelos
 * Encapsula los criterios de búsqueda, resultados y estado del cache
 */
export class BusquedaVuelos {
  #id;
  #userId;
  #origen;
  #destino;
  #fechaSalida;
  #fechaRegreso; // null si es solo ida
  #numeroPasajeros;
  #cabina;
  #ofertas;
  #creadoEn;
  #expiraEn;
  #filtrosAplicados;

  constructor({
    id,
    userId,
    origen,
    destino,
    fechaSalida,
    fechaRegreso = null,
    numeroPasajeros = 1,
    cabina = 'ECONOMY',
    ofertas = [],
    creadoEn = new Date(),
    expiraEn = null,
    filtrosAplicados = {}
  }) {
    // Validaciones básicas
    if (!userId) {
      throw new Error('El ID de usuario es requerido');
    }

    if (numeroPasajeros < 1 || numeroPasajeros > 9) {
      throw new Error('El número de pasajeros debe estar entre 1 y 9');
    }

    // Normalizar
    this.#id = id || this.#generateId();
    this.#userId = userId;
    this.#origen = origen instanceof IATA ? origen : new IATA(origen);
    this.#destino = destino instanceof IATA ? destino : new IATA(destino);
    this.#fechaSalida = new Date(fechaSalida);
    this.#fechaRegreso = fechaRegreso ? new Date(fechaRegreso) : null;
    this.#numeroPasajeros = numeroPasajeros;
    this.#cabina = cabina instanceof Cabina ? cabina : new Cabina(cabina);
    this.#ofertas = ofertas.map(o => o instanceof OfertaVuelo ? o : new OfertaVuelo(o));
    this.#creadoEn = new Date(creadoEn);
    this.#expiraEn = expiraEn ? new Date(expiraEn) : this.#calcularExpiracion(creadoEn);
    this.#filtrosAplicados = { ...filtrosAplicados };

    // Validar lógica de negocio
    this.#validarInvariantes();
  }

  #generateId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  #calcularExpiracion(desde) {
    const expira = new Date(desde);
    expira.setMinutes(expira.getMinutes() + 15); // Cache de 15 minutos
    return expira;
  }

  #validarInvariantes() {
    if (this.#origen.equals(this.#destino)) {
      throw new Error('El origen y destino no pueden ser iguales');
    }

    const ahora = new Date();
    if (this.#fechaSalida < ahora) {
      throw new Error('La fecha de salida no puede ser en el pasado');
    }

    if (this.#fechaRegreso && this.#fechaRegreso < this.#fechaSalida) {
      throw new Error('La fecha de regreso debe ser posterior a la fecha de salida');
    }
  }

  // Getters
  get id() {
    return this.#id;
  }

  get userId() {
    return this.#userId;
  }

  get origen() {
    return this.#origen;
  }

  get destino() {
    return this.#destino;
  }

  get fechaSalida() {
    return new Date(this.#fechaSalida);
  }

  get fechaRegreso() {
    return this.#fechaRegreso ? new Date(this.#fechaRegreso) : null;
  }

  get numeroPasajeros() {
    return this.#numeroPasajeros;
  }

  get cabina() {
    return this.#cabina;
  }

  get ofertas() {
    return [...this.#ofertas];
  }

  get creadoEn() {
    return new Date(this.#creadoEn);
  }

  get expiraEn() {
    return new Date(this.#expiraEn);
  }

  get filtrosAplicados() {
    return { ...this.#filtrosAplicados };
  }

  // Propiedades derivadas
  get esIdaYVuelta() {
    return this.#fechaRegreso !== null;
  }

  get estaCacheValido() {
    return new Date() < this.#expiraEn;
  }

  get tieneResultados() {
    return this.#ofertas.length > 0;
  }

  get numeroResultados() {
    return this.#ofertas.length;
  }

  // Métodos de negocio

  /**
   * Actualizar las ofertas con nuevos resultados
   */
  actualizarOfertas(ofertas) {
    this.#ofertas = ofertas.map(o => o instanceof OfertaVuelo ? o : new OfertaVuelo(o));
    
    // Filtrar ofertas inválidas o sin disponibilidad
    this.#ofertas = this.#ofertas.filter(oferta => 
      oferta.isValid() && oferta.tieneDisponibilidadPara(this.#numeroPasajeros)
    );
    
    return this;
  }

  /**
   * Aplicar filtros a las ofertas existentes
   */
  aplicarFiltros({
    precioMaximo,
    precioMinimo,
    soloDirectos,
    aerolineas,
    duracionMaxima,
    escalasMaximas
  }) {
    let ofertasFiltradas = [...this.#ofertas];

    if (precioMaximo !== undefined) {
      ofertasFiltradas = ofertasFiltradas.filter(o => 
        o.precio.amount <= precioMaximo
      );
    }

    if (precioMinimo !== undefined) {
      ofertasFiltradas = ofertasFiltradas.filter(o => 
        o.precio.amount >= precioMinimo
      );
    }

    if (soloDirectos) {
      ofertasFiltradas = ofertasFiltradas.filter(o => o.esVueloDirecto);
    }

    if (aerolineas && aerolineas.length > 0) {
      ofertasFiltradas = ofertasFiltradas.filter(o => {
        const aerolineasOferta = o.getAerolineas();
        return aerolineasOferta.some(a => aerolineas.includes(a));
      });
    }

    if (duracionMaxima !== undefined) {
      ofertasFiltradas = ofertasFiltradas.filter(o => 
        o.duracionTotal <= duracionMaxima
      );
    }

    if (escalasMaximas !== undefined) {
      ofertasFiltradas = ofertasFiltradas.filter(o => 
        o.numeroEscalas <= escalasMaximas
      );
    }

    this.#filtrosAplicados = {
      precioMaximo,
      precioMinimo,
      soloDirectos,
      aerolineas,
      duracionMaxima,
      escalasMaximas,
      aplicadoEn: new Date()
    };

    return ofertasFiltradas;
  }

  /**
   * Ordenar ofertas por diferentes criterios
   */
  ordenarOfertas(criterio = 'PRECIO_ASC') {
    const criterios = {
      PRECIO_ASC: (a, b) => a.precio.amount - b.precio.amount,
      PRECIO_DESC: (a, b) => b.precio.amount - a.precio.amount,
      DURACION_ASC: (a, b) => a.duracionTotal - b.duracionTotal,
      DURACION_DESC: (a, b) => b.duracionTotal - a.duracionTotal,
      SALIDA_ASC: (a, b) => a.fechaSalida - b.fechaSalida,
      SALIDA_DESC: (a, b) => b.fechaSalida - a.fechaSalida,
      MEJOR_VALORACION: (a, b) => {
        // Puntuación compuesta: -20% precio, -30% duración, -50% directos
        const scoreA = (a.precio.amount * 0.2) + (a.duracionTotal * 0.3) - (a.esVueloDirecto ? 50 : 0);
        const scoreB = (b.precio.amount * 0.2) + (b.duracionTotal * 0.3) - (b.esVueloDirecto ? 50 : 0);
        return scoreA - scoreB;
      }
    };

    const funcionOrden = criterios[criterio] || criterios.PRECIO_ASC;
    return [...this.#ofertas].sort(funcionOrden);
  }

  /**
   * Obtener oferta específica por ID
   */
  obtenerOferta(ofertaId) {
    return this.#ofertas.find(o => o.id === ofertaId);
  }

  /**
   * Obtener estadísticas de las ofertas
   */
  obtenerEstadisticas() {
    if (this.#ofertas.length === 0) {
      return null;
    }

    const precios = this.#ofertas.map(o => o.precio.amount);
    const duraciones = this.#ofertas.map(o => o.duracionTotal);

    return {
      totalOfertas: this.#ofertas.length,
      precioMinimo: Math.min(...precios),
      precioMaximo: Math.max(...precios),
      precioPromedio: precios.reduce((a, b) => a + b, 0) / precios.length,
      duracionMinima: Math.min(...duraciones),
      duracionMaxima: Math.max(...duraciones),
      duracionPromedio: duraciones.reduce((a, b) => a + b, 0) / duraciones.length,
      ofertasDirectas: this.#ofertas.filter(o => o.esVueloDirecto).length,
      ofertasConEscalas: this.#ofertas.filter(o => !o.esVueloDirecto).length,
      moneda: this.#ofertas[0]?.precio.currency
    };
  }

  /**
   * Refrescar expiración del cache
   */
  refrescarCache() {
    this.#expiraEn = this.#calcularExpiracion(new Date());
    return this;
  }

  /**
   * Factory method: Crear búsqueda
   */
  static crear({
    userId,
    origen,
    destino,
    fechaSalida,
    fechaRegreso,
    numeroPasajeros,
    cabina
  }) {
    return new BusquedaVuelos({
      userId,
      origen,
      destino,
      fechaSalida,
      fechaRegreso,
      numeroPasajeros,
      cabina
    });
  }

  // Persistencia
  toPersistence() {
    return {
      id: this.#id,
      user_id: this.#userId,
      origen: this.#origen.code,
      destino: this.#destino.code,
      fecha_salida: this.#fechaSalida.toISOString(),
      fecha_regreso: this.#fechaRegreso?.toISOString(),
      numero_pasajeros: this.#numeroPasajeros,
      cabina: this.#cabina.tipo,
      ofertas: JSON.stringify(this.#ofertas.map(o => o.toJSON())),
      creado_en: this.#creadoEn.toISOString(),
      expira_en: this.#expiraEn.toISOString(),
      filtros_aplicados: JSON.stringify(this.#filtrosAplicados)
    };
  }

  static fromPersistence(data) {
    return new BusquedaVuelos({
      id: data.id,
      userId: data.user_id,
      origen: data.origen,
      destino: data.destino,
      fechaSalida: data.fecha_salida,
      fechaRegreso: data.fecha_regreso,
      numeroPasajeros: data.numero_pasajeros,
      cabina: data.cabina,
      ofertas: JSON.parse(data.ofertas || '[]'),
      creadoEn: data.creado_en,
      expiraEn: data.expira_en,
      filtrosAplicados: JSON.parse(data.filtros_aplicados || '{}')
    });
  }

  toJSON() {
    return {
      id: this.#id,
      userId: this.#userId,
      origen: this.#origen.toJSON(),
      destino: this.#destino.toJSON(),
      fechaSalida: this.#fechaSalida.toISOString(),
      fechaRegreso: this.#fechaRegreso?.toISOString(),
      numeroPasajeros: this.#numeroPasajeros,
      cabina: this.#cabina.toJSON(),
      esIdaYVuelta: this.esIdaYVuelta,
      ofertas: this.#ofertas.map(o => o.toJSON()),
      creadoEn: this.#creadoEn.toISOString(),
      expiraEn: this.#expiraEn.toISOString(),
      estaCacheValido: this.estaCacheValido,
      numeroResultados: this.numeroResultados,
      filtrosAplicados: this.#filtrosAplicados,
      estadisticas: this.obtenerEstadisticas()
    };
  }
}
