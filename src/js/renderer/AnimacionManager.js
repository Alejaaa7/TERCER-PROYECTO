// ========================================
// ANIMACIONMANAGER.JS - Gestión de Animaciones
// ========================================

import { IsoUtils } from '../utils/IsoUtils.js';

export class AnimacionManager {
  constructor() {
    this.animaciones = [];
    this.running = false;
  }

  // Agregar una nueva animación
  agregar(animacion) {
    this.animaciones.push({
      ...animacion,
      startTime: Date.now(),
      completada: false
    });

    if (!this.running) {
      this.iniciar();
    }
  }

  // Iniciar loop de animaciones
  iniciar() {
    this.running = true;
    this.update();
  }

  // Detener todas las animaciones
  detener() {
    this.running = false;
    this.animaciones = [];
  }

  // Update loop
  update() {
    if (!this.running) return;

    const ahora = Date.now();

    // Procesar cada animación
    this.animaciones = this.animaciones.filter(anim => {
      if (anim.completada) return false;

      const elapsed = ahora - anim.startTime;
      const progress = Math.min(elapsed / anim.duracion, 1);

      // Ejecutar callback de update
      if (anim.onUpdate) {
        anim.onUpdate(progress);
      }

      // Verificar si terminó
      if (progress >= 1) {
        if (anim.onComplete) {
          anim.onComplete();
        }
        return false;
      }

      return true;
    });

    // Continuar loop si hay animaciones activas
    if (this.animaciones.length > 0) {
      requestAnimationFrame(() => this.update());
    } else {
      this.running = false;
    }
  }

  // Animación de partícula (para efectos visuales)
  crearParticulaPase(ctx, x1, y1, x2, y2, callback) {
    const duracion = 800;
    
    this.agregar({
      duracion,
      onUpdate: (progress) => {
        const easeProgress = this.easeInOutQuad(progress);
        const x = x1 + (x2 - x1) * easeProgress;
        const y = y1 + (y2 - y1) * easeProgress;

        // Dibujar partícula
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        
        const opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        ctx.fillStyle = `rgba(127, 255, 0, ${opacity})`;
        ctx.fill();
        
        // Estela
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#7FFF00';
        ctx.fill();
        ctx.restore();
      },
      onComplete: callback
    });
  }

  // Animación de destello en un nodo
  crearDestello(ctx, x, y, color = '#7FFF00', callback) {
    const duracion = 500;
    
    this.agregar({
      duracion,
      onUpdate: (progress) => {
        const radio = 20 + progress * 30;
        const opacity = 1 - progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radio, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      },
      onComplete: callback
    });
  }

  // Animación de ruta completa (Dijkstra visual)
  animarRuta(ctx, ruta, grafo, jugadorRenderer, callback) {
    // Animar un sprite corriendo por cada segmento de la ruta
    let index = 0;
    const duracionPorPase = 800;

    const animarSegmento = () => {
      if (index >= ruta.length - 1) {
        if (callback) callback();
        return;
      }

      const nodo1 = grafo.obtenerNodo(ruta[index]);
      const nodo2 = grafo.obtenerNodo(ruta[index + 1]);

      if (!nodo1 || !nodo2) {
        index++;
        animarSegmento();
        return;
      }

      const cfg = jugadorRenderer.campoProvider();
      const p1 = IsoUtils.campoToScreen(nodo1.posicion.x, nodo1.posicion.y, cfg);
      const p2 = IsoUtils.campoToScreen(nodo2.posicion.x, nodo2.posicion.y, cfg);

      // Determine sprite key for running animation: prefer nodo.sprite + '_running', fallback to nodo.id + '_running'
      const baseKey = nodo1.sprite || nodo1.id;
      const runningKey = `${baseKey}_running`;

      // Create animation that moves a running sprite from p1 to p2
      this.agregar({
        duracion: duracionPorPase,
        onUpdate: (progress) => {
          const ease = this.easeInOutQuad(progress);
          const x = p1.x + (p2.x - p1.x) * ease;
          const y = p1.y + (p2.y - p1.y) * ease;

          // Draw the running sprite using the jugadorRenderer helper
          const dibujado = jugadorRenderer.dibujarSpriteKey(x, y, 40, runningKey, { alpha: 1 });
          if (!dibujado) {
            // fallback to base sprite if running variant not available
            jugadorRenderer.dibujarSpriteKey(x, y, 40, baseKey, { alpha: 1 });
          }
        },
        onComplete: () => {
          // small destello at destination
          if (p2.x && p2.y) {
            this.crearDestello(ctx, p2.x, p2.y);
          }
          index++;
          // Chain next segment
          animarSegmento();
        }
      });
    };

    animarSegmento();
  }

  // Easing functions
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
}