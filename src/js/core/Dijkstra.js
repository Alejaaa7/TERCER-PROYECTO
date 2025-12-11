// ========================================
// DIJKSTRA.JS - Algoritmo de Dijkstra
// ========================================

export class Dijkstra {
  static encontrarCaminoOptimo(grafo, inicio, objetivo) {
    const resultado = {
      ruta: [],
      costoTotal: 0,
      exito: false,
      mensaje: ''
    };

    // Validaciones
    if (!grafo.existeNodo(inicio)) {
      resultado.mensaje = 'Nodo de inicio no existe';
      return resultado;
    }
    if (!grafo.existeNodo(objetivo)) {
      resultado.mensaje = 'Nodo objetivo no existe';
      return resultado;
    }
    if (inicio === objetivo) {
      resultado.ruta = [inicio];
      resultado.exito = true;
      resultado.mensaje = 'Inicio y objetivo son el mismo nodo';
      return resultado;
    }

    // Inicialización
    const distancias = new Map();
    const padres = new Map();
    const visitados = new Set();
    const todosNodos = grafo.obtenerTodosLosNodos();

    for (const nodo of todosNodos) {
      distancias.set(nodo, Infinity);
    }
    distancias.set(inicio, 0);

    // Priority Queue (simulada con array y sort)
    const cola = [{ nodo: inicio, distancia: 0 }];

    while (cola.length > 0) {
      // Ordenar por distancia (menor primero)
      cola.sort((a, b) => a.distancia - b.distancia);
      
      const { nodo: nodoActual, distancia: distActual } = cola.shift();

      if (visitados.has(nodoActual)) continue;
      visitados.add(nodoActual);

      // Si llegamos al objetivo, terminamos
      if (nodoActual === objetivo) break;

      // Explorar vecinos
      const vecinos = grafo.obtenerVecinos(nodoActual);
      for (const arista of vecinos) {
        const vecino = arista.destino;
        const nuevaDistancia = distancias.get(nodoActual) + arista.peso;

        if (nuevaDistancia < distancias.get(vecino)) {
          distancias.set(vecino, nuevaDistancia);
          padres.set(vecino, nodoActual);
          cola.push({ nodo: vecino, distancia: nuevaDistancia });
        }
      }
    }

    // Verificar si se encontró un camino
    if (distancias.get(objetivo) === Infinity) {
      resultado.mensaje = 'No existe camino entre los nodos';
      return resultado;
    }

    // Reconstruir camino
    resultado.ruta = this.reconstruirCamino(padres, inicio, objetivo);
    resultado.costoTotal = distancias.get(objetivo);
    resultado.exito = true;
    resultado.mensaje = 'Camino óptimo encontrado';

    return resultado;
  }

  static reconstruirCamino(padres, inicio, objetivo) {
    const camino = [];
    let actual = objetivo;

    while (actual !== inicio) {
      camino.push(actual);
      actual = padres.get(actual);
      if (!actual) break; // Seguridad
    }
    camino.push(inicio);

    return camino.reverse();
  }
}