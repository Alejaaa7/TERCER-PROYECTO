// ========================================
// NODOJUGADOR.JS - Clase Nodo del Grafo
// ========================================

export class NodoJugador {
  constructor(id, nombre) {
    this.id = id;
    this.nombre = nombre;
    this.posicion = { x: 0, y: 0 };
    this.stats = {
      pase: 50,
      remate: 50,
      defensa: 50,
      velocidad: 50
    };
    this.quimicaCon = []; // Array de IDs de jugadores
    this.sprite = null; // Referencia al sprite (lo usaremos después)
  }

  setPosicion(x, y) {
    this.posicion.x = x;
    this.posicion.y = y;
  }

  setStats(pase, remate, defensa, velocidad) {
    this.stats.pase = pase;
    this.stats.remate = remate;
    this.stats.defensa = defensa;
    this.stats.velocidad = velocidad;
  }

  agregarQuimica(jugadorId) {
    if (!this.tieneQuimicaCon(jugadorId)) {
      this.quimicaCon.push(jugadorId);
    }
  }

  tieneQuimicaCon(jugadorId) {
    return this.quimicaCon.includes(jugadorId);
  }

  // Serialización a JSON
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      posicion: { ...this.posicion },
      stats: { ...this.stats },
      quimicaCon: [...this.quimicaCon]
    };
  }

  // Crear desde JSON
  static fromJSON(data) {
    const nodo = new NodoJugador(data.id, data.nombre);
    nodo.setPosicion(data.posicion.x, data.posicion.y);
    nodo.setStats(
      data.stats.pase,
      data.stats.remate,
      data.stats.defensa,
      data.stats.velocidad
    );
    if (data.quimicaCon) {
      nodo.quimicaCon = [...data.quimicaCon];
    }
    return nodo;
  }
}