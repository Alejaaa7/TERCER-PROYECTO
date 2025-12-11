// ========================================
// COMUNIDADES.JS - Detección de Comunidades
// ========================================

export class Comunidades {
  static detectarTriangulos(grafo) {
    const resultado = {
      triangulos: [],
      cliques: [],
      numTriangulos: 0,
      mensaje: ''
    };

    const todosNodos = grafo.obtenerTodosLosNodos();
    const n = todosNodos.length;
    const triangulos_unicos = new Set();

    // Buscar todos los triángulos posibles
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          if (this.formanTriangulo(grafo, todosNodos[i], todosNodos[j], todosNodos[k])) {
            const triangulo = [todosNodos[i], todosNodos[j], todosNodos[k]].sort();
            const key = triangulo.join(',');
            
            if (!triangulos_unicos.has(key)) {
              triangulos_unicos.add(key);
              resultado.triangulos.push(triangulo);
              resultado.numTriangulos++;
            }
          }
        }
      }
    }

    resultado.mensaje = `Triángulos encontrados: ${resultado.numTriangulos}`;
    return resultado;
  }

  static formanTriangulo(grafo, a, b, c) {
    // Un triángulo existe si hay aristas: a->b, b->c, c->a (o cualquier permutación)
    return (
      (grafo.existeArista(a, b) && grafo.existeArista(b, c) && grafo.existeArista(c, a)) ||
      (grafo.existeArista(a, c) && grafo.existeArista(c, b) && grafo.existeArista(b, a)) ||
      (grafo.existeArista(b, a) && grafo.existeArista(a, c) && grafo.existeArista(c, b)) ||
      (grafo.existeArista(b, c) && grafo.existeArista(c, a) && grafo.existeArista(a, b)) ||
      (grafo.existeArista(c, a) && grafo.existeArista(a, b) && grafo.existeArista(b, c)) ||
      (grafo.existeArista(c, b) && grafo.existeArista(b, a) && grafo.existeArista(a, c))
    );
  }
}