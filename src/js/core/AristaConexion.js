// ========================================
// ARISTACONEXION.JS - Clase Arista del Grafo
// ========================================

export class AristaConexion {
  constructor(origen, destino, peso = 1.0) {
    this.origen = origen; // ID del nodo origen
    this.destino = destino; // ID del nodo destino
    this.peso = peso;
    this.numPasesReales = 0; // Para modo análisis de partidos
  }

  // Calcular peso basado en estadísticas de pase y química
  calcularPeso(paseOrigen, paseDestino, tienenQuimica) {
    // Fórmula: peso = (200 - paseOrigen - paseDestino) / factor_química
    // Menor peso = mejor conexión (para Dijkstra)
    
    const pesoBase = 200 - paseOrigen - paseDestino;
    const factorQuimica = tienenQuimica ? 0.7 : 1.0; // 30% bonus si tienen química
    
    this.peso = Math.max(pesoBase * factorQuimica, 1); // Mínimo peso de 1
  }

  // Serialización a JSON
  toJSON() {
    return {
      origen: this.origen,
      destino: this.destino,
      peso: this.peso,
      numPasesReales: this.numPasesReales
    };
  }

  // Crear desde JSON
  static fromJSON(data) {
    const arista = new AristaConexion(data.origen, data.destino, data.peso);
    if (data.numPasesReales !== undefined) {
      arista.numPasesReales = data.numPasesReales;
    }
    return arista;
  }
}