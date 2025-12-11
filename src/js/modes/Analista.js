// ========================================
// ANALISTA.JS - Modo Análisis de Partidos
// ========================================

import { GrafoTactico } from '../core/GrafoTactico.js';
import { NodoJugador } from '../core/NodoJugador.js';
import { AristaConexion } from '../core/AristaConexion.js';
import { Centralidad } from '../core/Centralidad.js';
import { Comunidades } from '../core/Comunidades.js';
import { BFS } from '../core/BFS.js';
import { CampoRenderer } from '../renderer/CampoRenderer.js';
import { JugadorRenderer } from '../renderer/JugadorRenderer.js';
import { DataLoader } from '../utils/DataLoader.js';
import { IsoUtils } from '../utils/IsoUtils.js';

export class Analista {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    this.campoRenderer = new CampoRenderer(canvas, ctx);
    this.jugadorRenderer = new JugadorRenderer(ctx, this.campoRenderer);
    
    this.grafo = new GrafoTactico();
    this.partidoActual = null;
    this.analisisActual = null;
    this.mostrarConexiones = true;
    this.modoVisualizacion = 'pases';
    this.vistaIsometrica = true;
    this.renderizando = false;
    
    this.inicializar();
  }

  async inicializar() {
    console.log('📊 Inicializando Modo Analista...');
    
    await this.cargarPartido('argentina-francia');

    // Añadir listeners de interacción (click en jugadores)
    this.setupEventListeners();

    // Esperar un frame antes de empezar a renderizar
    requestAnimationFrame(() => {
      if (!this.renderizando) {
        this.renderizando = true;
        this.render();
      }
    });
    
    console.log('✅ Modo Analista listo');
  }

  async cargarPartido(nombrePartido) {
    console.log(`📂 Cargando partido: ${nombrePartido}`);
    
    const partido = await DataLoader.cargarPartido(nombrePartido);
    if (!partido) {
      console.error('Error cargando partido');
      alert('Error: No se pudo cargar el partido');
      return;
    }
    
    this.partidoActual = partido;

    // Pre-cargar sprites de los jugadores para evitar parpadeos
    await this._preloadSpritesForPartido(partido);

    this.construirGrafoDesdePartido(partido);
    this.analizarPartido();
  }

  async _preloadSpritesForPartido(partido) {
    if (!partido || !this.jugadorRenderer) return;

    const keys = new Set();
    const equipos = Object.values(partido.equipos || {});
    equipos.forEach(e => {
      (e.jugadores || []).forEach(p => {
        const key = (p && p.id) ? (p.id.includes('_') ? p.id.split('_').pop() : p.id) : null;
        if (key) keys.add(key);
      });
    });

    // Iniciar carga de cada sprite (no bloqueante). Usamos coordenadas fuera de pantalla.
    const promises = [];
    keys.forEach(k => {
      try {
        // dibujarSpriteKey iniciará la carga si no existe en caché
        this.jugadorRenderer.dibujarSpriteKey(-500, -500, 32, k);
      } catch (e) {
        // No crítico
      }
    });

    // Breve espera para dar tiempo a que comiencen las cargas (no esperamos completitud absoluta)
    await new Promise(res => setTimeout(res, 120));
  }

  construirGrafoDesdePartido(partido) {
    // Construir grafo con formación fija (dos rombos de 4 jugadores)
    this.grafo = new GrafoTactico();

    const teamKeys = Object.keys(partido.equipos || {});
    const leftKey = teamKeys[0] || 'teamA';
    const rightKey = teamKeys[1] || 'teamB';

    const leftPlayersAll = (partido.equipos[leftKey] && partido.equipos[leftKey].jugadores) || [];
    const rightPlayersAll = (partido.equipos[rightKey] && partido.equipos[rightKey].jugadores) || [];

    // Si el JSON incluye una lista 'alineacion' (ids en el orden de slots), preferirla.
    const leftAlineacionIds = (partido.equipos[leftKey] && partido.equipos[leftKey].alineacion) || leftPlayersAll.slice(0,4).map(p => p.id);
    const rightAlineacionIds = (partido.equipos[rightKey] && partido.equipos[rightKey].alineacion) || rightPlayersAll.slice(0,4).map(p => p.id);

    // Formación: rombo de 4 alrededor de un centro en cada lado
    const leftCenter = { x: 25, y: 50 };
    const rightCenter = { x: 75, y: 50 };
    const offsets = [ {x:0,y:-10}, {x:10,y:0}, {x:0,y:10}, {x:-10,y:0} ];

    // Helper para crear nodo (usa player data si existe, si no, crea genérico)
    const makeNode = (id, name, posX, posY, stats) => {
      const nodo = new NodoJugador(id, name);
      nodo.setPosicion(posX, posY);
      nodo.setStats(stats.pase, stats.remate, stats.defensa, stats.velocidad);
      nodo.sprite = id.includes('_') ? id.split('_').pop() : id;
      this.grafo.agregarNodo(nodo);
    };

    // Left side: usar los IDs en leftAlineacionIds (si no aparecen en jugadores, crear genérico)
    for (let i = 0; i < 4; i++) {
      const selectedId = leftAlineacionIds[i];
      const p = leftPlayersAll.find(pp => pp.id === selectedId) || null;
      const pos = { x: leftCenter.x + offsets[i].x, y: leftCenter.y + offsets[i].y };
      if (p) {
        makeNode(p.id, p.nombre, pos.x, pos.y, p.stats || {pase:50,remate:50,defensa:50,velocidad:50});
      } else if (selectedId) {
        makeNode(selectedId, selectedId, pos.x, pos.y, {pase:50,remate:50,defensa:50,velocidad:50});
      } else {
        const id = `${leftKey}_J${i+1}`;
        makeNode(id, `J${i+1}`, pos.x, pos.y, {pase:50,remate:50,defensa:50,velocidad:50});
      }
    }

    // Right side: usar los IDs en rightAlineacionIds
    for (let i = 0; i < 4; i++) {
      const selectedId = rightAlineacionIds[i];
      const p = rightPlayersAll.find(pp => pp.id === selectedId) || null;
      const pos = { x: rightCenter.x + offsets[i].x, y: rightCenter.y + offsets[i].y };
      if (p) {
        makeNode(p.id, p.nombre, pos.x, pos.y, p.stats || {pase:50,remate:50,defensa:50,velocidad:50});
      } else if (selectedId) {
        makeNode(selectedId, selectedId, pos.x, pos.y, {pase:50,remate:50,defensa:50,velocidad:50});
      } else {
        const id = `${rightKey}_J${i+1}`;
        makeNode(id, `J${i+5}`, pos.x, pos.y, {pase:50,remate:50,defensa:50,velocidad:50});
      }
    }

    // Añadir aristas si hay datos de pases en el archivo (usarlos), además construir grafo por proximidad para completar
    if (partido.equipos[leftKey] && partido.equipos[leftKey].pases) {
      partido.equipos[leftKey].pases.forEach(paseData => {
        const arista = new AristaConexion(paseData.origen, paseData.destino);
        arista.numPasesReales = paseData.cantidad;
        arista.peso = Math.max(1, 100 - paseData.cantidad);
        this.grafo.agregarArista(arista);
      });
    }
    if (partido.equipos[rightKey] && partido.equipos[rightKey].pases) {
      partido.equipos[rightKey].pases.forEach(paseData => {
        const arista = new AristaConexion(paseData.origen, paseData.destino);
        arista.numPasesReales = paseData.cantidad;
        arista.peso = Math.max(1, 100 - paseData.cantidad);
        this.grafo.agregarArista(arista);
      });
    }

    // Completar con proximidad para hacer el grafo más realista
    this.grafo.construirGrafoPorProximidad(30, true);

    // Actualizar banderas en UI
    this._updateFlags(leftKey, rightKey);
    
    console.log(`✅ Grafo construido: ${this.grafo.numNodos()} nodos, ${this.grafo.numAristas()} aristas`);
  }

  analizarPartido() {
    console.log('🔍 Analizando partido...');
    
    this.analisisActual = {
      centralidad: Centralidad.calcularCentralidad(this.grafo),
      triangulos: Comunidades.detectarTriangulos(this.grafo),
      componentes: BFS.encontrarComponentesConexas(this.grafo)
    };
    
    console.log('✅ Análisis completado:', this.analisisActual);
    this.mostrarResultadosAnalisis();
  }

  mostrarResultadosAnalisis() {
    const panel = document.getElementById('panel-resultados');
    if (!panel) {
      console.error('Panel de resultados no encontrado');
      return;
    }
    
    const { centralidad, triangulos, componentes } = this.analisisActual;
    
    const rankingHTML = Object.entries(centralidad.centralidadGrado)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, grado], i) => {
        const nodo = this.grafo.obtenerNodo(id);
        return `<div class="ranking-item">
          <span class="pos">${i + 1}</span>
          <span class="nombre">${nodo ? nodo.nombre : id}</span>
          <span class="valor">${grado}</span>
        </div>`;
      }).join('');
    
    panel.innerHTML = `
      <div class="analisis-section">
        <h3>👑 Jugador Más Influyente</h3>
        <div class="destacado">
          ${this.grafo.obtenerNodo(centralidad.jugadorMasInfluyente)?.nombre || 'N/A'}
        </div>
        <p>Con ${centralidad.centralidadGrado[centralidad.jugadorMasInfluyente]} conexiones directas</p>
      </div>
      
      <div class="analisis-section">
        <h3>🔺 Triángulos de Posesión</h3>
        <div class="destacado">${triangulos.numTriangulos}</div>
        <p>Grupos de 3 jugadores con conexión circular</p>
      </div>
      
      <div class="analisis-section">
        <h3>🔗 Cohesión del Equipo</h3>
        <div class="destacado">${componentes.numComponentes === 1 ? 'Óptima' : 'Fragmentada'}</div>
        <p>${componentes.numComponentes} componente(s) conexa(s)</p>
      </div>
      
      <div class="analisis-section">
        <h3>📊 Ranking de Centralidad</h3>
        <div class="ranking">
          ${rankingHTML}
        </div>
      </div>
    `;
  }

  cambiarVisualizacion(modo) {
    this.modoVisualizacion = modo;
    console.log(`👁️ Modo visualización: ${modo}`);
  }

  cambiarVista() {
    this.vistaIsometrica = !this.vistaIsometrica;
    this.campoRenderer.setVistaIsometrica(this.vistaIsometrica);
    console.log(`📐 Vista: ${this.vistaIsometrica ? 'Isométrica' : 'Aérea'}`);
  }

  setupEventListeners() {
    if (!this.canvas) return;
    this.canvas.addEventListener('click', (e) => this._onClickCanvas(e));

    // Selector de partidos: carga automáticamente al cambiar
    const selector = document.getElementById('selector-partido');
    if (selector) {
      selector.addEventListener('change', (e) => {
        const partido = e.target.value;
        if (partido) this.cargarPartido(partido);
      });
    }
  }

  _onClickCanvas(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const radio = 20;
    for (const nodo of this.grafo.nodos.values()) {
      const pos = IsoUtils.campoToScreen(nodo.posicion.x, nodo.posicion.y, this.campoRenderer.getConfig());
      const distancia = Math.hypot(pos.x - mouseX, pos.y - mouseY);
      if (distancia <= radio) {
        this._mostrarPanelJugador(nodo);
        return;
      }
    }
    this._cerrarPanel();
  }

  _mostrarPanelJugador(nodo) {
    // Preferir mostrar en el panel izquierdo si existe
    const panelLeft = document.getElementById('panel-jugador-izq');
    const panelRight = document.getElementById('panel-jugador');

    // Sanitizar valores para que queden entre 0 y 100 y evitar valores nulos/undefined
    const _safe = (v) => {
      const n = Number(v ?? 0);
      if (Number.isNaN(n)) return 0;
      return Math.max(0, Math.min(100, Math.round(n)));
    };

    const pase = _safe(nodo.stats?.pase);
    const remate = _safe(nodo.stats?.remate);
    const defensa = _safe(nodo.stats?.defensa);
    const velocidad = _safe(nodo.stats?.velocidad);

    const html = `
      <div class="panel-header">
        <h3>${nodo.nombre}</h3>
        <button class="close-btn" aria-label="Cerrar panel">✕</button>
      </div>
      <div class="panel-stats">
        <div class="stat-bar">
          <span>Pase</span>
          <div class="bar" role="progressbar" aria-valuenow="${pase}" aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width: ${pase}%"></div>
          </div>
          <span class="value-label">${pase}</span>
        </div>

        <div class="stat-bar">
          <span>Remate</span>
          <div class="bar" role="progressbar" aria-valuenow="${remate}" aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width: ${remate}%"></div>
          </div>
          <span class="value-label">${remate}</span>
        </div>

        <div class="stat-bar">
          <span>Defensa</span>
          <div class="bar" role="progressbar" aria-valuenow="${defensa}" aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width: ${defensa}%"></div>
          </div>
          <span class="value-label">${defensa}</span>
        </div>

        <div class="stat-bar">
          <span>Velocidad</span>
          <div class="bar" role="progressbar" aria-valuenow="${velocidad}" aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width: ${velocidad}%"></div>
          </div>
          <span class="value-label">${velocidad}</span>
        </div>
      </div>
    `;

    if (panelLeft) {
      panelLeft.innerHTML = html;
      panelLeft.classList.add('has-player');
      const btn = panelLeft.querySelector('.close-btn');
      if (btn) btn.addEventListener('click', () => this.cerrarPanel());
      return;
    }

    if (panelRight) {
      panelRight.innerHTML = html;
      panelRight.classList.add('visible');
      const btn = panelRight.querySelector('.close-btn');
      if (btn) btn.addEventListener('click', () => this.cerrarPanel());
    }
  }

  _cerrarPanel() {
    const panelLeft = document.getElementById('panel-jugador-izq');
    const panelRight = document.getElementById('panel-jugador');
    if (panelLeft) {
      panelLeft.innerHTML = '';
      panelLeft.classList.remove('has-player');
    }
    if (panelRight) {
      panelRight.innerHTML = `<div class="panel-header"><h3>Selecciona un Jugador</h3></div><div class="panel-content"><p>Haz click en un jugador del campo para ver sus estadísticas</p></div>`;
      panelRight.classList.remove('visible');
    }
  }

  // Public method for HTML close buttons
  cerrarPanel() {
    this._cerrarPanel();
  }

  _updateFlags(leftKey, rightKey) {
    const leftImg = document.getElementById('flag-left');
    const rightImg = document.getElementById('flag-right');
    if (leftImg) {
      leftImg.src = `assets/flags/${leftKey}.png`;
      leftImg.style.display = 'block';
      leftImg.onerror = () => { leftImg.style.display = 'none'; };
    }
    if (rightImg) {
      rightImg.src = `assets/flags/${rightKey}.png`;
      rightImg.style.display = 'block';
      rightImg.onerror = () => { rightImg.style.display = 'none'; };
    }
  }

  render() {
    if (!this.renderizando) return;
    
    this.campoRenderer.dibujar();
    
    if (this.mostrarConexiones && this.grafo.numNodos() > 0) {
      this.dibujarConexionesSegunModo();
    }
    
    const nodosOrdenados = IsoUtils.ordenarPorProfundidad(
      Array.from(this.grafo.nodos.values())
    );
    
    for (const nodo of nodosOrdenados) {
      let color = '#00D9FF';
      let destacado = false;
      
      if (this.modoVisualizacion === 'centralidad' && this.analisisActual) {
        const grado = this.analisisActual.centralidad.centralidadGrado[nodo.id] || 0;
        const maxGrado = Math.max(...Object.values(this.analisisActual.centralidad.centralidadGrado));
        const ratio = maxGrado > 0 ? grado / maxGrado : 0;
        
        color = ratio > 0.7 ? '#7FFF00' : ratio > 0.4 ? '#FFD700' : '#FF4655';
        destacado = ratio > 0.7;
      }
      
      this.jugadorRenderer.dibujar(nodo, {
        color,
        destacado,
        mostrarNombre: true
      });
    }
    
    requestAnimationFrame(() => this.render());
  }

  dibujarConexionesSegunModo() {
    if (this.modoVisualizacion === 'pases') {
      for (const [nodoId, aristas] of this.grafo.listaAdyacencia) {
        const nodo1 = this.grafo.obtenerNodo(nodoId);
        
        for (const arista of aristas) {
          const nodo2 = this.grafo.obtenerNodo(arista.destino);
          
          if (nodo1 && nodo2 && arista.numPasesReales > 0) {
            const grosor = Math.max(2, Math.min(8, arista.numPasesReales / 3));
            const opacidad = Math.min(0.8, arista.numPasesReales / 20);
            
            this.jugadorRenderer.dibujarConexion(nodo1, nodo2, {
              color: `rgba(0, 217, 255, ${opacidad})`,
              grosor
            });
          }
        }
      }
    } else if (this.modoVisualizacion === 'triangulos' && this.analisisActual) {
      const triangulos = this.analisisActual.triangulos.triangulos;
      
      triangulos.forEach((triangulo, i) => {
        const color = `hsl(${(i * 60) % 360}, 80%, 60%)`;
        
        for (let j = 0; j < triangulo.length; j++) {
          const nodo1 = this.grafo.obtenerNodo(triangulo[j]);
          const nodo2 = this.grafo.obtenerNodo(triangulo[(j + 1) % triangulo.length]);
          
          if (nodo1 && nodo2) {
            this.jugadorRenderer.dibujarConexion(nodo1, nodo2, {
              color: color,
              grosor: 4
            });
          }
        }
      });
    }
  }

  activate() {
    console.log('📊 Modo Analista activado');
    if (!this.renderizando) {
      this.renderizando = true;
      this.render();
    }
  }

  deactivate() {
    console.log('📊 Modo Analista desactivado');
    this.renderizando = false;
  }
}