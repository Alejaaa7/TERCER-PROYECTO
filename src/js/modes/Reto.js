// RETO.JS - Modo Reto (Puzzles Tácticos)

import { GrafoTactico } from '../core/GrafoTactico.js';
import { NodoJugador } from '../core/NodoJugador.js';
import { Dijkstra } from '../core/Dijkstra.js';
import { CampoRenderer } from '../renderer/CampoRenderer.js';
import { JugadorRenderer } from '../renderer/JugadorRenderer.js';
import { DataLoader } from '../utils/DataLoader.js';
import { IsoUtils } from '../utils/IsoUtils.js';

export class Reto {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    this.campoRenderer = new CampoRenderer(canvas, ctx);
    this.jugadorRenderer = new JugadorRenderer(ctx, this.campoRenderer);
    
    this.grafo = new GrafoTactico();
    this.puzzleActual = null;
    this.secuenciaUsuario = [];
    this.modoSeleccion = false;
    this.puntuacion = 0;
    this.estrellas = 0;
    this.vistaIsometrica = true;
    
    this.inicializar();
  }

  async inicializar() {
    console.log('⚡ Inicializando Modo Reto...');
    
    await this.cargarPuzzle('milagro-anfield');
    this.setupEventListeners();
    this.render();
    
    console.log('✅ Modo Reto listo');
  }

  async cargarPuzzle(nombrePuzzle) {
    console.log(`🎯 Cargando puzzle: ${nombrePuzzle}`);
    
    const puzzle = await DataLoader.cargarPuzzle(nombrePuzzle);
    if (!puzzle) {
      console.error('Error cargando puzzle');
      return;
    }
    
    this.puzzleActual = puzzle;
    this.construirGrafoDesdePuzzle(puzzle);
    this.secuenciaUsuario = [];
    this.modoSeleccion = true;
    
    this.mostrarInstrucciones();
  }

  construirGrafoDesdePuzzle(puzzle) {
    this.grafo = new GrafoTactico();
    
    puzzle.jugadores.forEach(jugadorData => {
      const nodo = new NodoJugador(jugadorData.id, jugadorData.nombre);
      nodo.setPosicion(jugadorData.posicion.x, jugadorData.posicion.y);
      nodo.setStats(
        jugadorData.stats.pase,
        jugadorData.stats.remate,
        jugadorData.stats.defensa,
        jugadorData.stats.velocidad
      );
      this.grafo.agregarNodo(nodo);
    });

    // Si los jugadores están muy agrupados en X, redistribuir sus X entre 25...75
    const xs = Array.from(this.grafo.nodos.values()).map(n => n.posicion.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    if (maxX - minX < 25) {
      const nodos = Array.from(this.grafo.nodos.values());
      nodos.sort((a, b) => a.posicion.x - b.posicion.x);
      for (let i = 0; i < nodos.length; i++) {
        const spreadX = 25 + (50 * i) / Math.max(1, nodos.length - 1);
        nodos[i].setPosicion(spreadX, nodos[i].posicion.y);
      }
    }    
    
    this.grafo.construirGrafoCompleto();
    
    console.log(`✅ Puzzle construido: ${this.grafo.numNodos()} jugadores`);
  }

  mostrarInstrucciones() {
    const panel = document.getElementById('panel-instrucciones');
    if (!panel) return;
    
    panel.innerHTML = `
      <h2>${this.puzzleActual.nombre}</h2>
      <div class="puzzle-info">
        <span>🎯 ${this.puzzleActual.dificultad}</span>
        <span>📅 ${this.puzzleActual.fecha}</span>
      </div>
      <p class="objetivo">${this.puzzleActual.objetivo}</p>
      <div class="contexto">
        <h4>Contexto Histórico:</h4>
        <p>${this.puzzleActual.contexto_historico}</p>
      </div>
      <button id="btn-iniciar-puzzle" class="btn-success">▶ INICIAR PUZZLE</button>
    `;
    
    panel.classList.add('visible');
    
    document.getElementById('btn-iniciar-puzzle')?.addEventListener('click', () => {
      panel.classList.remove('visible');
      this.iniciarSeleccion();
    });
  }

  iniciarSeleccion() {
    console.log('🎯 Iniciando selección de puzzle');
    this.modoSeleccion = true;
    this.secuenciaUsuario = [];
    
    const panel = document.getElementById('panel-secuencia');
    if (panel) {
      panel.innerHTML = `
        <h3>Tu Secuencia de Pases:</h3>
        <div id="secuencia-lista">
          <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 20px;">
            Haz click en los jugadores del campo para crear tu secuencia de pases.
          </p>
        </div>
        <div class="botones-accion">
          <button id="btn-deshacer" class="btn-secondary">↶ Deshacer</button>
          <button id="btn-verificar" class="btn-success">✓ Verificar</button>
          <button id="btn-reiniciar" class="btn-danger">⟲ Reiniciar</button>
        </div>
      `;
      panel.classList.add('visible');
      console.log('✅ Panel de secuencia mostrado');
    } else {
      console.error('❌ Panel de secuencia no encontrado');
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.onClickJugador(e));
  }

  onClickJugador(e) {
    if (!this.modoSeleccion) {
      console.log('⚠️ Modo selección desactivado');
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    console.log(`🖱️ Click en (${mouseX}, ${mouseY})`);
    
    const jugador = this.encontrarJugadorEnPosicion(mouseX, mouseY);
    
    if (jugador) {
      console.log(`✅ Jugador encontrado: ${jugador.nombre}`);
      this.secuenciaUsuario.push(jugador.id);
      this.actualizarListaSecuencia();
      console.log('Secuencia actual:', this.secuenciaUsuario);
    } else {
      console.log('❌ No se encontró jugador en esa posición');
    }
  }

  encontrarJugadorEnPosicion(screenX, screenY) {
    const radio = 20;
    
    for (const nodo of this.grafo.nodos.values()) {
      const pos = IsoUtils.campoToScreen(
        nodo.posicion.x,
        nodo.posicion.y,
        this.campoRenderer.getConfig()
      );
      
      const distancia = Math.sqrt(
        Math.pow(pos.x - screenX, 2) + 
        Math.pow(pos.y - screenY, 2)
      );
      
      if (distancia <= radio) {
        return nodo;
      }
    }
    
    return null;
  }

  actualizarListaSecuencia() {
    const lista = document.getElementById('secuencia-lista');
    if (!lista) return;
    
    if (this.secuenciaUsuario.length === 0) {
      lista.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 20px;">
        Haz click en los jugadores del campo para crear tu secuencia.
      </p>`;
      return;
    }
    
    lista.innerHTML = this.secuenciaUsuario
      .map((id, i) => {
        const nodo = this.grafo.obtenerNodo(id);
        return `<div class="secuencia-item">
          ${i + 1}. ${nodo.nombre}${i < this.secuenciaUsuario.length - 1 ? ' →' : ''}
        </div>`;
      })
      .join('');
  }

  deshacerUltimoClick() {
    if (this.secuenciaUsuario.length > 0) {
      this.secuenciaUsuario.pop();
      this.actualizarListaSecuencia();
    }
  }

  reiniciarPuzzle() {
    this.secuenciaUsuario = [];
    this.actualizarListaSecuencia();

    // Volver a permitir selección y ocultar panel de resultado
    this.modoSeleccion = true;
    this.estrellas = 0;
    this.puntuacion = 0;
    const panelResultado = document.getElementById('panel-resultado');
    if (panelResultado) {
      panelResultado.classList.remove('visible');
    }
    const panelSeq = document.getElementById('panel-secuencia');
    if (panelSeq) {
      panelSeq.style.display = 'block';
      panelSeq.classList.add('visible');
    }
    console.log('🔁 Puzzle reiniciado')
  }

  cambiarVista() {
    this.vistaIsometrica = !this.vistaIsometrica;
    this.campoRenderer.setVistaIsometrica(this.vistaIsometrica);
    console.log(`📐 Vista: ${this.vistaIsometrica ? 'Isométrica' : 'Aérea'}`);
  }

  verificarSolucion() {
    if (this.secuenciaUsuario.length < 2) {
      alert('Necesitas seleccionar al menos 2 jugadores');
      return;
    }
    
    console.log('🔍 Verificando solución...');
    console.log('Tu secuencia:', this.secuenciaUsuario);
    
    // Calcular ruta del usuario
    const inicio = this.secuenciaUsuario[0];
    const fin = this.secuenciaUsuario[this.secuenciaUsuario.length - 1];
    
    // Calcular ruta óptima con Dijkstra
    const resultadoOptimo = Dijkstra.encontrarCaminoOptimo(this.grafo, inicio, fin);
    console.log('Ruta óptima Dijkstra:', resultadoOptimo);
    
    // Calcular costo de la ruta del usuario
    let costoUsuario = 0;
    let rutaValida = true;
    
    for (let i = 0; i < this.secuenciaUsuario.length - 1; i++) {
      const aristas = this.grafo.obtenerVecinos(this.secuenciaUsuario[i]);
      const arista = aristas.find(a => a.destino === this.secuenciaUsuario[i + 1]);
      
      if (arista) {
        costoUsuario += arista.peso;
      } else {
        rutaValida = false;
        break;
      }
    }
    
    if (!rutaValida) {
      alert('⚠️ Secuencia inválida: no existe conexión entre algunos jugadores');
      return;
    }
    
    console.log('Costo usuario:', costoUsuario);
    console.log('Costo óptimo:', resultadoOptimo.costoTotal);
    
    // Comparar con solución óptima del puzzle
    const solucionOptima = this.puzzleActual.solucion_optima;
    
    // Calcular estrellas
    let estrellas = 1;
    const mismaRuta = JSON.stringify(this.secuenciaUsuario) === JSON.stringify(solucionOptima.ruta);
    
    if (mismaRuta) {
      estrellas = 3;
    } else if (this.secuenciaUsuario.length <= 3) {
      estrellas = 2;
    }
    
    // Calcular similitud (0-100)
    const diferenciaCosto = Math.abs(costoUsuario - resultadoOptimo.costoTotal);
    const similitud = Math.max(0, Math.min(100, 100 - (diferenciaCosto * 5)));
    
    this.estrellas = estrellas;
    this.puntuacion = Math.floor(similitud);
    
    console.log('Estrellas:', estrellas, 'Puntuación:', this.puntuacion);
    
    this.modoSeleccion = false;
    this.mostrarResultado(resultadoOptimo, costoUsuario, similitud);
  }

  mostrarResultado(resultadoOptimo, costoUsuario, similitud) {
    const panel = document.getElementById('panel-resultado');
    if (!panel) return;
    
    const estrellasHTML = '⭐'.repeat(this.estrellas) + '☆'.repeat(3 - this.estrellas);
    
    panel.innerHTML = `
      <h2>¡Puzzle Completado!</h2>
      <div class="estrellas">${estrellasHTML}</div>
      <div class="puntuacion">${this.puntuacion} / 100</div>
      
      <div class="comparativa">
        <div class="columna">
          <h4>Tu Solución:</h4>
          <div class="ruta">${this.secuenciaUsuario.map(id => 
            this.grafo.obtenerNodo(id).nombre
          ).join(' → ')}</div>
          <div class="stat">Costo: ${costoUsuario.toFixed(2)}</div>
          <div class="stat">Toques: ${this.secuenciaUsuario.length}</div>
        </div>
        
        <div class="columna">
          <h4>Solución Óptima:</h4>
          <div class="ruta">${resultadoOptimo.ruta.map(id => 
            this.grafo.obtenerNodo(id).nombre
          ).join(' → ')}</div>
          <div class="stat">Costo: ${resultadoOptimo.costoTotal.toFixed(2)}</div>
          <div class="stat">Toques: ${resultadoOptimo.ruta.length}</div>
        </div>
      </div>
      
      <button id="btn-siguiente-puzzle" class="btn-success">➤ Siguiente Puzzle</button>
      <button id="btn-reintentar" class="btn-primary">⟲ Reintentar</button>
    `;
    
    panel.classList.add('visible');
    
    document.getElementById('btn-reintentar')?.addEventListener('click', () => {
      panel.classList.remove('visible');
      this.reiniciarPuzzle();
    });
  }

  render() {
    this.campoRenderer.dibujar();
    
    // Dibujar líneas de la secuencia del usuario
    for (let i = 0; i < this.secuenciaUsuario.length - 1; i++) {
      const nodo1 = this.grafo.obtenerNodo(this.secuenciaUsuario[i]);
      const nodo2 = this.grafo.obtenerNodo(this.secuenciaUsuario[i + 1]);
      
      if (nodo1 && nodo2) {
        this.jugadorRenderer.dibujarConexion(nodo1, nodo2, {
          color: '#7FFF00',
          grosor: 4
        });
      }
    }
    
    // Dibujar jugadores
    const nodosOrdenados = IsoUtils.ordenarPorProfundidad(
      Array.from(this.grafo.nodos.values())
    );
    
    for (const nodo of nodosOrdenados) {
      const estaEnSecuencia = this.secuenciaUsuario.includes(nodo.id);
      const indice = this.secuenciaUsuario.indexOf(nodo.id);
      
      this.jugadorRenderer.dibujar(nodo, {
        seleccionado: estaEnSecuencia,
        color: estaEnSecuencia ? '#7FFF00' : '#00D9FF',
        mostrarNombre: true
      });
      
      // Mostrar número de orden si está en secuencia
      if (estaEnSecuencia) {
        const pos = IsoUtils.campoToScreen(nodo.posicion.x, nodo.posicion.y, this.campoRenderer.getConfig());
        this.ctx.fillStyle = '#7FFF00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${indice + 1}`, pos.x, pos.y - 30);
      }
    }
    
    requestAnimationFrame(() => this.render());
  }

  activate() {
    console.log('⚡ Modo Reto activado');
    this.render();
  }

  deactivate() {
    console.log('⚡ Modo Reto desactivado');
  }
}