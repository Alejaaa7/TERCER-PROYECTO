// ========================================
// CENTRALIDAD.JS - Análisis de Centralidad
// ========================================

export class Centralidad {
  static calcularCentralidad(grafo) {
    const resultado = {
      centralidadGrado: {},
      centralidadIntermediacion: {},
      jugadorMasInfluyente: '',
      mensaje: ''
    };

    resultado.centralidadGrado = this.calcularCentralidadGrado(grafo);
    resultado.centralidadIntermediacion = this.calcularCentralidadIntermediacion(grafo);

    // Encontrar jugador más influyente (mayor centralidad de grado)
    let maxGrado = 0;
    for (const [nodo, grado] of Object.entries(resultado.centralidadGrado)) {
      if (grado > maxGrado) {
        maxGrado = grado;
        resultado.jugadorMasInfluyente = nodo;
      }
    }

    resultado.mensaje = 'Análisis de centralidad completado';
    return resultado;
  }

  static calcularCentralidadGrado(grafo) {
    const grados = {};
    
    const todosNodos = grafo.obtenerTodosLosNodos();
    for (const nodo of todosNodos) {
      grados[nodo] = grafo.obtenerVecinos(nodo).length;
    }

    return grados;
  }

  static calcularCentralidadIntermediacion(grafo) {
    // Simplificación: retornar objeto vacío por ahora
    // La implementación completa de Betweenness Centrality es compleja
    const intermediacion = {};

    const todosNodos = grafo.obtenerTodosLosNodos();
    for (const nodo of todosNodos) {
      intermediacion[nodo] = 0;
    }

    return intermediacion;
  }
}