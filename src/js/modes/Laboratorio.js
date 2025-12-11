// ========================================
// LABORATORIO.JS - Modo Laboratorio Táctico
// ========================================

import { GrafoTactico } from '../core/GrafoTactico.js';
import { NodoJugador } from '../core/NodoJugador.js';
import { Dijkstra } from '../core/Dijkstra.js';
import { CampoRenderer } from '../renderer/CampoRenderer.js';
import { JugadorRenderer } from '../renderer/JugadorRenderer.js';
import { AnimacionManager } from '../renderer/AnimacionManager.js';
import { DataLoader } from '../utils/DataLoader.js';
import { IsoUtils } from '../utils/IsoUtils.js';

export class Laboratorio {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Renderizadores
    this.campoRenderer = new CampoRenderer(canvas, ctx);
    this.jugadorRenderer = new JugadorRenderer(ctx, this.campoRenderer);
    this.animacionManager = new AnimacionManager();
    
    // Estado
    this.grafo = new GrafoTactico();
    this.jugadoresDisponibles = [];
    this.jugadorSeleccionado = null;
    this.jugadorArrastrando = null;
    this.formacionActual = '4-3-3';
    this.simulacionActiva = false;
    this.vistaIsometrica = true;
    this.mostrarConexiones = false;
    this.mostrarNombres = true;
    
    // Inicializar
    this.inicializar();
  }

  async inicializar() {
    console.log('🔬 Inicializando Modo Laboratorio...');
    
    // Cargar datos
    const jugadoresData = await DataLoader.cargarJugadores();
    const formacionesData = await DataLoader.cargarFormaciones();
    
    if (jugadoresData) {
      // Reemplazar jugadores reales por jugadores genéricos J1, J2, ...
      this.jugadoresDisponibles = jugadoresData.jugadores.map((p, i) => ({
        id: `j${i + 1}`,
        nombre: `J${i + 1}`,
        // conservar stats para balance
        stats: p.stats || { pase: 50, remate: 50, defensa: 50, velocidad: 50 },
        equipo: p.equipo || 'Generic',
        nacionalidad: p.nacionalidad || 'N/A'
      }));
    }
    
    if (formacionesData) {
      this.formaciones = formacionesData.formaciones;
    }
    
    // Crear formación inicial
    this.cargarFormacion(this.formacionActual);
    
    // Event listeners
    this.setupEventListeners();
    
    // Iniciar render loop
    this.render();
    
    console.log('✅ Modo Laboratorio listo');
  }

  cargarFormacion(nombreFormacion) {
    console.log(`📋 Cargando formación: ${nombreFormacion}`);
    
    const formacion = this.formaciones[nombreFormacion];
    if (!formacion) {
      console.error('Formación no encontrada');
      return;
    }
    
    // Limpiar grafo
    this.grafo = new GrafoTactico();
    
    // Crear nodos según la formación
    formacion.posiciones.forEach((pos, index) => {
      // Asignar jugador aleatorio de la lista
      const jugadorData = this.jugadoresDisponibles[index % this.jugadoresDisponibles.length];

      const nodo = new NodoJugador(pos.id, jugadorData.nombre);
      // Asociar sprite (nombre de archivo) al nodo para que el renderer lo encuentre
      nodo.sprite = jugadorData.id;
      nodo.setPosicion(pos.x, pos.y);
      nodo.setStats(
        jugadorData.stats.pase,
        jugadorData.stats.remate,
        jugadorData.stats.defensa,
        jugadorData.stats.velocidad
      );
      
      this.grafo.agregarNodo(nodo);
    });
    
    // AGREGAR QUÍMICA ENTRE JUGADORES CERCANOS
    const nodos = Array.from(this.grafo.nodos.values());
    for (let i = 0; i < nodos.length; i++) {
      for (let j = i + 1; j < nodos.length; j++) {
        const distancia = Math.sqrt(
          Math.pow(nodos[i].posicion.x - nodos[j].posicion.x, 2) +
          Math.pow(nodos[i].posicion.y - nodos[j].posicion.y, 2)
        );
        
        // Si están cerca (distancia < 30), tienen química
        if (distancia < 30) {
          nodos[i].agregarQuimica(nodos[j].id);
          nodos[j].agregarQuimica(nodos[i].id);
        }
      }
    }
    
    // Construir conexiones del grafo de forma realista: sólo entre posiciones cercanas o con química
    this.grafo.construirGrafoPorProximidad(30, true);
    
    console.log(`✅ Formación cargada: ${this.grafo.numNodos()} jugadores, ${this.grafo.numAristas()} conexiones`);
  }

  setupEventListeners() {
    // Mouse down - iniciar arrastre
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    
    // Mouse move - arrastrar
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    // Mouse up - soltar
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    
    // Click - seleccionar
    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Buscar jugador bajo el cursor
    const jugador = this.encontrarJugadorEnPosicion(mouseX, mouseY);
    
    if (jugador) {
      this.jugadorArrastrando = jugador;
    }
  }

  onMouseMove(e) {
    if (!this.jugadorArrastrando) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convertir coordenadas de pantalla a campo
    const campoPos = IsoUtils.screenToCampo(
      mouseX, 
      mouseY, 
      this.campoRenderer.getConfig()
    );
    
    // Limitar a los bordes del campo
    campoPos.x = Math.max(5, Math.min(95, campoPos.x));
    campoPos.y = Math.max(5, Math.min(95, campoPos.y));
    
    // Actualizar posición
    this.jugadorArrastrando.setPosicion(campoPos.x, campoPos.y);
  }

  onMouseUp(e) {
    if (this.jugadorArrastrando) {
      // Reconstruir grafo con nuevas posiciones
      this.grafo.construirGrafoPorProximidad(30, true);
      this.jugadorArrastrando = null;
    }
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const jugador = this.encontrarJugadorEnPosicion(mouseX, mouseY);
    
    if (jugador) {
      this.jugadorSeleccionado = jugador;
      this.mostrarPanelJugador(jugador);
    } else {
      this.jugadorSeleccionado = null;
    }
  }

  encontrarJugadorEnPosicion(screenX, screenY) {
    const radio = 20; // Radio de detección
    
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

  mostrarPanelJugador(nodo) {
    const panel = document.getElementById('panel-jugador');
    if (!panel) return;
    
    panel.innerHTML = `
      <div class="panel-header">
        <h3>${nodo.nombre}</h3>
        <button class="close-btn" onclick="window.laboratorio.cerrarPanel()">✕</button>
      </div>
      <div class="panel-stats">
        <div class="stat-bar">
          <span>Pase</span>
          <div class="bar"><div class="fill" style="width: ${nodo.stats.pase}%"></div></div>
          <span>${nodo.stats.pase}</span>
        </div>
        <div class="stat-bar">
          <span>Remate</span>
          <div class="bar"><div class="fill" style="width: ${nodo.stats.remate}%"></div></div>
          <span>${nodo.stats.remate}</span>
        </div>
        <div class="stat-bar">
          <span>Defensa</span>
          <div class="bar"><div class="fill" style="width: ${nodo.stats.defensa}%"></div></div>
          <span>${nodo.stats.defensa}</span>
        </div>
        <div class="stat-bar">
          <span>Velocidad</span>
          <div class="bar"><div class="fill" style="width: ${nodo.stats.velocidad}%"></div></div>
          <span>${nodo.stats.velocidad}</span>
        </div>
      </div>
    `;
    
    panel.classList.add('visible');
  }

  cerrarPanel() {
    const panel = document.getElementById('panel-jugador');
    if (panel) {
      panel.classList.remove('visible');
    }
  }

  cambiarVista() {
    this.vistaIsometrica = !this.vistaIsometrica;
    this.campoRenderer.setVistaIsometrica(this.vistaIsometrica);
    console.log(`📐 Vista: ${this.vistaIsometrica ? 'Isométrica' : 'Aérea'}`);
  }

  // Simular jugada con Dijkstra
  simularJugada(inicio, objetivo) {
    if (this.simulacionActiva) return;
    
    console.log(`⚽ Simulando jugada: ${inicio} → ${objetivo}`);
    this.simulacionActiva = true;
    
    // Ejecutar Dijkstra
    const resultado = Dijkstra.encontrarCaminoOptimo(this.grafo, inicio, objetivo);
    
    if (resultado.exito) {
      console.log(`✅ Ruta encontrada: ${resultado.ruta.join(' → ')}`);
      console.log(`💰 Costo: ${resultado.costoTotal.toFixed(2)}`);
      
      // Animar ruta
      this.animarRuta(resultado.ruta);
      
      // Mostrar resultado
      this.mostrarResultadoSimulacion(resultado);
    } else {
      console.log(`❌ ${resultado.mensaje}`);
      alert(resultado.mensaje);
      this.simulacionActiva = false;
    }
  }

  animarRuta(ruta) {
    let index = 0;
    const duracionPorPase = 800;
    
    const animarSiguiente = () => {
      if (index >= ruta.length - 1) {
        this.simulacionActiva = false;
        return;
      }
      
      const nodo1 = this.grafo.obtenerNodo(ruta[index]);
      const nodo2 = this.grafo.obtenerNodo(ruta[index + 1]);
      
      if (nodo1 && nodo2) {
        const pos1 = IsoUtils.campoToScreen(nodo1.posicion.x, nodo1.posicion.y, this.campoRenderer.getConfig());
        const pos2 = IsoUtils.campoToScreen(nodo2.posicion.x, nodo2.posicion.y, this.campoRenderer.getConfig());
        
        // Crear partícula de pase
        this.animacionManager.crearParticulaPase(
          this.ctx,
          pos1.x, pos1.y,
          pos2.x, pos2.y,
          () => {
            // Destello en destino
            this.animacionManager.crearDestello(this.ctx, pos2.x, pos2.y);
          }
        );
      }
      
      index++;
      setTimeout(animarSiguiente, duracionPorPase);
    };
    
    animarSiguiente();
  }

  mostrarResultadoSimulacion(resultado) {
    const panel = document.getElementById('resultado-simulacion');
    if (!panel) return;
    
    const porcentajeExito = Math.max(0, Math.min(100, 100 - (resultado.costoTotal / 10)));
    
    // Mostrar detalles paso a paso
    let detallesPasos = '';
    for (let i = 0; i < resultado.ruta.length - 1; i++) {
      const nodo1 = this.grafo.obtenerNodo(resultado.ruta[i]);
      const nodo2 = this.grafo.obtenerNodo(resultado.ruta[i + 1]);
      const aristas = this.grafo.obtenerVecinos(resultado.ruta[i]);
      const arista = aristas.find(a => a.destino === resultado.ruta[i + 1]);
      
      detallesPasos += `<div class="paso-detalle">
        ${i + 1}. ${nodo1.nombre} → ${nodo2.nombre} 
        <span class="costo-paso">(costo: ${arista.peso.toFixed(1)})</span>
      </div>`;
    }
    
    panel.innerHTML = `
      <h3>✅ Resultado de la Simulación</h3>
      <div class="resultado-ruta">
        <strong>Ruta Óptima (Dijkstra):</strong><br>
        ${resultado.ruta.map(id => this.grafo.obtenerNodo(id).nombre).join(' → ')}
      </div>
      <div class="resultado-detalles">
        <h4>Paso a Paso:</h4>
        ${detallesPasos}
      </div>
      <div class="resultado-stats">
        <div>Costo Total: <strong>${resultado.costoTotal.toFixed(2)}</strong></div>
        <div>Probabilidad de Éxito: <strong>${porcentajeExito.toFixed(0)}%</strong></div>
        <div>Número de Pases: <strong>${resultado.ruta.length - 1}</strong></div>
      </div>
      <div class="resultado-explicacion">
        💡 <strong>¿Por qué esta ruta?</strong><br>
        Dijkstra calculó que este camino tiene el <strong>menor costo acumulado</strong> 
        considerando las habilidades de pase y la química entre jugadores.
      </div>
    `;
    
    panel.classList.add('visible');
    
    setTimeout(() => {
      panel.classList.remove('visible');
    }, 10000); // 10 segundos para leer
  }

  // Render loop
  render() {
    // Limpiar canvas
    this.campoRenderer.dibujar();
    
    // Dibujar conexiones si el usuario lo solicita
    if (this.mostrarConexiones) {
      this.dibujarConexiones();
    }
    
    // Dibujar jugadores
    const nodosOrdenados = IsoUtils.ordenarPorProfundidad(
      Array.from(this.grafo.nodos.values())
    );
    
    for (const nodo of nodosOrdenados) {
      const esSeleccionado = this.jugadorSeleccionado === nodo;
      const esArrastrando = this.jugadorArrastrando === nodo;
      
      this.jugadorRenderer.dibujar(nodo, {
        seleccionado: esSeleccionado || esArrastrando,
        destacado: esSeleccionado,
        color: esArrastrando ? '#7FFF00' : '#00D9FF',
        mostrarNombre: this.mostrarNombres
      });
    }
    
    // Continuar render loop
    requestAnimationFrame(() => this.render());
  }

  dibujarConexiones() {
    // Dibujar todas las aristas (puede ser visualmente saturado)
    for (const [nodoId, aristas] of this.grafo.listaAdyacencia) {
      const nodo1 = this.grafo.obtenerNodo(nodoId);
      
      for (const arista of aristas) {
        const nodo2 = this.grafo.obtenerNodo(arista.destino);
        
        if (nodo1 && nodo2) {
          this.jugadorRenderer.dibujarConexion(nodo1, nodo2, {
            color: 'rgba(0, 217, 255, 0.1)',
            grosor: 1
          });
        }
      }
    }
  }

  activate() {
    console.log('🔬 Modo Laboratorio activado');
    this.render();
  }

  deactivate() {
    console.log('🔬 Modo Laboratorio desactivado');
    this.animacionManager.detener();
  }
}