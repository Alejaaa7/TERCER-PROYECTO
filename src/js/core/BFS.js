// ========================================
// BFS.JS - Breadth-First Search
// ========================================

export class BFS {
  static encontrarComponentesConexas(grafo) {
    const resultado = {
      componentes: [],
      numComponentes: 0,
      mensaje: ''
    };

    const todosNodos = grafo.obtenerTodosLosNodos();
    const visitados = new Map();

    for (const nodo of todosNodos) {
      visitados.set(nodo, false);
    }

    for (const nodo of todosNodos) {
      if (!visitados.get(nodo)) {
        const componente = [];
        this.bfsRecursivo(grafo, nodo, visitados, componente);
        resultado.componentes.push(componente);
        resultado.numComponentes++;
      }
    }

    resultado.mensaje = `Componentes conexas encontradas: ${resultado.numComponentes}`;
    return resultado;
  }

  static explorarDesde(grafo, inicio) {
    const orden = [];

    if (!grafo.existeNodo(inicio)) {
      return orden;
    }

    const visitados = new Map();
    const todosNodos = grafo.obtenerTodosLosNodos();
    for (const nodo of todosNodos) {
      visitados.set(nodo, false);
    }

    const cola = [inicio];
    visitados.set(inicio, true);

    while (cola.length > 0) {
      const actual = cola.shift();
      orden.push(actual);

      const vecinos = grafo.obtenerVecinos(actual);
      for (const arista of vecinos) {
        if (!visitados.get(arista.destino)) {
          visitados.set(arista.destino, true);
          cola.push(arista.destino);
        }
      }
    }

    return orden;
  }

  static bfsRecursivo(grafo, nodo, visitados, componente) {
    const cola = [nodo];
    visitados.set(nodo, true);

    while (cola.length > 0) {
      const actual = cola.shift();
      componente.push(actual);

      const vecinos = grafo.obtenerVecinos(actual);
      for (const arista of vecinos) {
        if (!visitados.get(arista.destino)) {
          visitados.set(arista.destino, true);
          cola.push(arista.destino);
        }
      }
    }
  }
}