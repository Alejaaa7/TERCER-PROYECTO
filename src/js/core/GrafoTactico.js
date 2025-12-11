// ========================================
// GRAFOTACTICO.JS - Clase Principal del Grafo
// ========================================

import { NodoJugador } from './NodoJugador.js';
import { AristaConexion } from './AristaConexion.js';

export class GrafoTactico {
  constructor() {
    this.nodos = new Map(); // id -> NodoJugador
    this.listaAdyacencia = new Map(); // id -> Array de AristaConexion
  }

  // ========================================
  // GESTIÓN DE NODOS
  // ========================================
  
  agregarNodo(nodo) {
    this.nodos.set(nodo.id, nodo);
    if (!this.listaAdyacencia.has(nodo.id)) {
      this.listaAdyacencia.set(nodo.id, []);
    }
  }

  eliminarNodo(id) {
    this.nodos.delete(id);
    this.listaAdyacencia.delete(id);
    
    // Eliminar aristas que apuntan a este nodo
    for (const [nodoId, aristas] of this.listaAdyacencia) {
      this.listaAdyacencia.set(
        nodoId,
        aristas.filter(a => a.destino !== id)
      );
    }
  }

  obtenerNodo(id) {
    return this.nodos.get(id);
  }

  obtenerTodosLosNodos() {
    return Array.from(this.nodos.keys());
  }

  existeNodo(id) {
    return this.nodos.has(id);
  }

  // ========================================
  // GESTIÓN DE ARISTAS
  // ========================================
  
  agregarArista(arista) {
    if (this.existeNodo(arista.origen) && this.existeNodo(arista.destino)) {
      this.listaAdyacencia.get(arista.origen).push(arista);
    }
  }

  eliminarArista(origen, destino) {
    if (this.listaAdyacencia.has(origen)) {
      const aristas = this.listaAdyacencia.get(origen);
      this.listaAdyacencia.set(
        origen,
        aristas.filter(a => a.destino !== destino)
      );
    }
  }

  obtenerVecinos(id) {
    return this.listaAdyacencia.get(id) || [];
  }

  existeArista(origen, destino) {
    const vecinos = this.obtenerVecinos(origen);
    return vecinos.some(a => a.destino === destino);
  }

  // ========================================
  // CONSTRUCCIÓN AUTOMÁTICA DEL GRAFO
  // ========================================
  
  construirGrafoCompleto() {
    // Conectar todos los nodos entre sí con pesos calculados
    const ids = this.obtenerTodosLosNodos();
    
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i !== j) {
          const nodoOrigen = this.obtenerNodo(ids[i]);
          const nodoDestino = this.obtenerNodo(ids[j]);
          
          const arista = new AristaConexion(ids[i], ids[j]);
          arista.calcularPeso(
            nodoOrigen.stats.pase,
            nodoDestino.stats.pase,
            nodoOrigen.tieneQuimicaCon(ids[j])
          );
          
          this.agregarArista(arista);
        }
      }
    }
  }

  construirGrafoPorProximidad(maxDist = 30, incluirQuimica = true) {
    // Construye aristas sólo entre nodos que estén a una distancia menor a maxDist
    // o que tengan química explícita entre ellos. Limpia las aristas previas.
    const ids = this.obtenerTodosLosNodos();

    // Inicializar lista de adyacencia vacía para cada nodo
    for (const id of ids) {
      this.listaAdyacencia.set(id, []);
    }

    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue;

        const idA = ids[i];
        const idB = ids[j];
        const nodoA = this.obtenerNodo(idA);
        const nodoB = this.obtenerNodo(idB);

        // Si alguno no tiene posición, no crear la arista
        if (!nodoA || !nodoB || !nodoA.posicion || !nodoB.posicion) continue;

        const dx = nodoA.posicion.x - nodoB.posicion.x;
        const dy = nodoA.posicion.y - nodoB.posicion.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        const tieneQuimica = nodoA.tieneQuimicaCon(idB) || nodoB.tieneQuimicaCon(idA);

        if (distancia <= maxDist || (incluirQuimica && tieneQuimica)) {
          const arista = new AristaConexion(idA, idB);
          arista.calcularPeso(
            nodoA.stats.pase,
            nodoB.stats.pase,
            tieneQuimica
          );
          this.agregarArista(arista);
        }
      }
    }
  }

  construirGrafoFormacion(formacion) {
    // Por ahora construimos un grafo completo
    // Construir grafo basándose en proximidad por defecto (más realista)
    this.construirGrafoPorProximidad(30, true);
  }

  // ========================================
  // INFORMACIÓN DEL GRAFO
  // ========================================
  
  numNodos() {
    return this.nodos.size;
  }

  numAristas() {
    let count = 0;
    for (const aristas of this.listaAdyacencia.values()) {
      count += aristas.length;
    }
    return count;
  }

  // ========================================
  // SERIALIZACIÓN
  // ========================================
  
  toJSON() {
    const nodosArray = [];
    for (const nodo of this.nodos.values()) {
      nodosArray.push(nodo.toJSON());
    }

    const aristasArray = [];
    for (const aristas of this.listaAdyacencia.values()) {
      for (const arista of aristas) {
        aristasArray.push(arista.toJSON());
      }
    }

    return {
      nodos: nodosArray,
      aristas: aristasArray
    };
  }

  static fromJSON(data) {
    const grafo = new GrafoTactico();
    
    // Deserializar nodos
    if (data.nodos) {
      for (const nodoData of data.nodos) {
        grafo.agregarNodo(NodoJugador.fromJSON(nodoData));
      }
    }
    
    // Deserializar aristas
    if (data.aristas) {
      for (const aristaData of data.aristas) {
        grafo.agregarArista(AristaConexion.fromJSON(aristaData));
      }
    }
    
    return grafo;
  }
}