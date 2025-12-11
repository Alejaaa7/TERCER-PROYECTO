// ========================================
// JUGADORRENDERER.JS - Renderizado de Jugadores
// ========================================

import { IsoUtils } from '../utils/IsoUtils.js';

export class JugadorRenderer {
  constructor(ctx, campoProvider) {
    this.ctx = ctx;
    this.spritesCache = new Map();

    // campoProvider puede ser:
    // - una instancia de CampoRenderer (tiene getConfig())
    // - una función que retorna la config
    // - un objeto config estático
    
    if (campoProvider && typeof campoProvider.getConfig === 'function') {
      this.campoProvider = () => campoProvider.getConfig();
    } else if (typeof campoProvider === 'function') {
      this.campoProvider = campoProvider;
    } else {
      const cfg = campoProvider;
      this.campoProvider = () => cfg;
    }
  }


  // Dibujar un jugador en el campo
  dibujar(nodo, opciones = {}) {
    const {
      seleccionado = false,
      destacado = false,
      color = '#00D9FF',
      mostrarNombre = true,
      animFrame = 0
    } = opciones;

    // Obtener config actual del campo y convertir posición a pantalla
    const campoConfig = this.campoProvider();
    const screenPos = IsoUtils.campoToScreen(
      nodo.posicion.x,
      nodo.posicion.y,
      campoConfig
    );

    // Dibujar sombra
    this.dibujarSombra(screenPos.x, screenPos.y);

    // Dibujar círculo del jugador (por ahora, sprites después)
    const radio = seleccionado ? 20 : 16;
    
    // (pulso moved down to apply only when drawing the fallback circle)

    // Determinar nombre de archivo candidato para el sprite
    const spriteKey = nodo.sprite || nodo.id;

    // Intentar usar sprite desde caché; si no está cargado, iniciar su carga
    const cached = this.spritesCache.get(spriteKey);
    if (cached && cached instanceof HTMLImageElement && cached.naturalWidth > 0) {
      // Dibujar sprite en vez de círculo
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false; // Pixel art nítido
      this.ctx.drawImage(cached, screenPos.x - radio, screenPos.y - radio, radio * 2, radio * 2);
      // Si está seleccionado, dibujar un anillo sutil alrededor (no llenar con un círculo)
      if (seleccionado) {
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, radio + 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#7FFF00';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }

      this.ctx.restore();

      // Nombre debajo si está activado
      if (mostrarNombre) {
        this.dibujarNombre(screenPos.x, screenPos.y + radio + 8, nodo.nombre);
      }

      // Indicador de stats si está destacado
      if (destacado) {
        this.dibujarIndicadorStats(screenPos.x, screenPos.y - radio - 10, nodo.stats);
      }

      return; // Sprite dibujado y elementos adicionales procesados
    } else if (cached === null) {
      // Ya sabemos que no existe sprite para este id (error previo), seguir con el círculo
    } else if (!cached) {
      // No está en caché: crear y comenzar a cargar usando spriteKey
      const sprite = new Image();
      sprite.src = `assets/sprites/jugadores/${spriteKey}.png`;
      // Guardar provisionalmente para evitar múltiples cargas simultáneas
      this.spritesCache.set(spriteKey, sprite);

      sprite.onload = () => {
        // Image cargada correctamente; se mantiene en la caché
        this.spritesCache.set(spriteKey, sprite);
      };

      sprite.onerror = () => {
        // Si falla y spriteKey contiene guiones bajos (p. ej. 'arg_messi'), intentar carga alternativa
        if (spriteKey.includes('_')) {
          const alt = spriteKey.split('_').pop();
          if (alt && alt !== spriteKey) {
            const altImg = new Image();
            altImg.src = `assets/sprites/jugadores/${alt}.png`;
            this.spritesCache.set(alt, altImg);

            altImg.onload = () => this.spritesCache.set(alt, altImg);
            altImg.onerror = () => this.spritesCache.set(alt, null);
          }
        }
        // Marcar el intento original como inválido para evitar nuevos intentos continuos
        this.spritesCache.set(spriteKey, null);
      };
      // Mientras carga, seguimos dibujando el fallback (círculo)
    }




    // Efecto de pulso si está seleccionado (solo en fallback de círculo)
    if (seleccionado) {
      const pulsoRadio = radio + Math.sin(Date.now() / 200) * 3;
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, pulsoRadio, 0, Math.PI * 2);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Círculo principal
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, radio, 0, Math.PI * 2);
    
    // Gradiente
    const gradient = this.ctx.createRadialGradient(
      screenPos.x - 5, screenPos.y - 5, 0,
      screenPos.x, screenPos.y, radio
    );
    gradient.addColorStop(0, this.lightenColor(color, 40));
    gradient.addColorStop(1, color);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Borde
    this.ctx.strokeStyle = destacado ? '#7FFF00' : 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = seleccionado ? 3 : 2;
    this.ctx.stroke();

    // Dibujar inicial del nombre en el círculo
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const inicial = nodo.nombre.charAt(0);
    this.ctx.fillText(inicial, screenPos.x, screenPos.y);

    // Nombre debajo si está activado
    if (mostrarNombre) {
      this.dibujarNombre(screenPos.x, screenPos.y + radio + 8, nodo.nombre);
    }

    // Indicador de stats (barra pequeña)
    if (destacado) {
      this.dibujarIndicadorStats(screenPos.x, screenPos.y - radio - 10, nodo.stats);
    }
  }

  dibujarSombra(x, y) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 22, 18, 6, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fill();
  }

  dibujarNombre(x, y, nombre) {
    // Fondo del nombre
    this.ctx.font = 'bold 11px Arial';
    const medida = this.ctx.measureText(nombre);
    const padding = 6;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(
      x - medida.width / 2 - padding,
      y - 8,
      medida.width + padding * 2,
      16
    );

    // Texto del nombre
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(nombre, x, y);
  }

  dibujarIndicadorStats(x, y, stats) {
    const promedio = (stats.pase + stats.remate + stats.defensa + stats.velocidad) / 4;
    const width = 40;
    const height = 4;

    // Fondo de la barra
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x - width / 2, y, width, height);

    // Barra de progreso
    const fillWidth = (promedio / 100) * width;
    const gradient = this.ctx.createLinearGradient(x - width / 2, y, x + width / 2, y);
    gradient.addColorStop(0, '#FF4655');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#7FFF00');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - width / 2, y, fillWidth, height);

    // Borde
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y, width, height);
  }

  // Dibujar conexión entre dos jugadores
  dibujarConexion(nodo1, nodo2, opciones = {}) {
    const {
      color = 'rgba(0, 217, 255, 0.4)',
      grosor = 2,
      animado = false,
      dashPattern = null
    } = opciones;

    const campoConfig = this.campoProvider();
    const pos1 = IsoUtils.campoToScreen(nodo1.posicion.x, nodo1.posicion.y, campoConfig);
    const pos2 = IsoUtils.campoToScreen(nodo2.posicion.x, nodo2.posicion.y, campoConfig);

    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x, pos1.y);
    this.ctx.lineTo(pos2.x, pos2.y);
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = grosor;
    
    if (dashPattern) {
      this.ctx.setLineDash(dashPattern);
    } else {
      this.ctx.setLineDash([]);
    }
    
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  // Dibujar ruta de pases (para Dijkstra)
  dibujarRuta(ruta, grafo, opciones = {}) {
    const {
      color = '#7FFF00',
      grosor = 4,
      conFlechas = true
    } = opciones;

    for (let i = 0; i < ruta.length - 1; i++) {
      const nodo1 = grafo.obtenerNodo(ruta[i]);
      const nodo2 = grafo.obtenerNodo(ruta[i + 1]);

      if (nodo1 && nodo2) {
        this.dibujarConexion(nodo1, nodo2, { color, grosor });
        
        if (conFlechas) {
          this.dibujarFlecha(nodo1, nodo2, color);
        }
      }
    }
  }

  // Dibujar un sprite dado su key (nombre de archivo sin extensión) en una posición dada
  dibujarSpriteKey(x, y, size, spriteKey, opciones = {}) {
    const { alpha = 1, rotacion = 0 } = opciones;

    if (!spriteKey) return false;

    // Intentar obtener imagen de la caché
    const cached = this.spritesCache.get(spriteKey);
    if (cached && cached instanceof HTMLImageElement && cached.naturalWidth > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      if (rotacion) {
        this.ctx.translate(x, y);
        this.ctx.rotate(rotacion);
        this.ctx.drawImage(cached, -size / 2, -size / 2, size, size);
      } else {
        this.ctx.drawImage(cached, x - size / 2, y - size / 2, size, size);
      }
      this.ctx.restore();
      return true;
    }

    // Si no está en caché todavía, intentar iniciar su carga (no bloquear)
    if (cached !== null) {
      const img = new Image();
      img.src = `assets/sprites/jugadores/${spriteKey}.png`;
      this.spritesCache.set(spriteKey, img);
      img.onload = () => this.spritesCache.set(spriteKey, img);
      img.onerror = () => this.spritesCache.set(spriteKey, null);
    }

    return false;
  }

  dibujarFlecha(nodoOrigen, nodoDestino, color) {

    const campoConfig = this.campoProvider();
    const pos1 = IsoUtils.campoToScreen(nodoOrigen.posicion.x, nodoOrigen.posicion.y, campoConfig);
    const pos2 = IsoUtils.campoToScreen(nodoDestino.posicion.x, nodoDestino.posicion.y, campoConfig);

    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const angle = Math.atan2(dy, dx);

    // Posición de la flecha (70% del camino)
    const arrowX = pos1.x + dx * 0.7;
    const arrowY = pos1.y + dy * 0.7;

    const arrowSize = 12;

    this.ctx.save();
    this.ctx.translate(arrowX, arrowY);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-arrowSize, -arrowSize / 2);
    this.ctx.lineTo(-arrowSize, arrowSize / 2);
    this.ctx.closePath();

    this.ctx.fillStyle = color;
    this.ctx.fill();

    this.ctx.restore();
  }

  // Utilidad: aclarar color
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 + 
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }
}