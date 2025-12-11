// ========================================
// ISOUTILS.JS - Conversión 2D ↔ Isométrico (CORREGIDO)
// ========================================

export class IsoUtils {
  static vistaIsometrica = true;

  static setVistaIsometrica(isometrica) {
    this.vistaIsometrica = isometrica;
    console.log(`🔄 IsoUtils: Vista cambiada a ${isometrica ? 'Isométrica' : 'Aérea'}`);
  }

  static toIso(x, y) {
    if (!this.vistaIsometrica) {
      return { x, y };
    }
    const isoX = (x - y) * Math.cos(Math.PI / 6);
    const isoY = (x + y) * Math.sin(Math.PI / 6);
    return { x: isoX, y: isoY };
  }

  static to2D(isoX, isoY) {
    if (!this.vistaIsometrica) {
      return { x: isoX, y: isoY };
    }
    const x = (isoX / Math.cos(Math.PI / 6) + isoY / Math.sin(Math.PI / 6)) / 2;
    const y = (isoY / Math.sin(Math.PI / 6) - isoX / Math.cos(Math.PI / 6)) / 2;
    return { x, y };
  }

  // FUNCIÓN CLAVE CORREGIDA
  static campoToScreen(campoX, campoY, campoConfig) {
    // campoX, campoY van de 0-100 (porcentaje del campo)
    
    if (!this.vistaIsometrica) {
      // Vista aérea: mapeo directo proporcional
      return {
        x: campoConfig.offsetX + (campoX / 100) * campoConfig.width,
        y: campoConfig.offsetY + (campoY / 100) * campoConfig.height
      };
    }

    // Vista isométrica: primero escalar, luego transformar
    const worldX = (campoX / 100) * campoConfig.width;
    const worldY = (campoY / 100) * campoConfig.height;
    const iso = this.toIso(worldX, worldY);
    
    return {
      x: iso.x + campoConfig.offsetX,
      y: iso.y + campoConfig.offsetY
    };
  }

  // FUNCIÓN INVERSA CORREGIDA
  static screenToCampo(screenX, screenY, campoConfig) {
    if (!this.vistaIsometrica) {
      // Vista aérea: conversión directa
      const campoX = ((screenX - campoConfig.offsetX) / campoConfig.width) * 100;
      const campoY = ((screenY - campoConfig.offsetY) / campoConfig.height) * 100;
      
      return {
        x: Math.max(0, Math.min(100, campoX)),
        y: Math.max(0, Math.min(100, campoY))
      };
    }

    // Vista isométrica
    const isoX = screenX - campoConfig.offsetX;
    const isoY = screenY - campoConfig.offsetY;
    const world = this.to2D(isoX, isoY);
    
    const campoX = (world.x / campoConfig.width) * 100;
    const campoY = (world.y / campoConfig.height) * 100;
    
    return {
      x: Math.max(0, Math.min(100, campoX)),
      y: Math.max(0, Math.min(100, campoY))
    };
  }

  static ordenarPorProfundidad(elementos) {
    if (!this.vistaIsometrica) {
      // En vista aérea, ordenar por Y para simular profundidad
      return elementos.sort((a, b) => a.posicion.y - b.posicion.y);
    }
    
    // En vista isométrica, ordenar por suma de coordenadas
    return elementos.sort((a, b) => {
      const depthA = a.posicion.x + a.posicion.y;
      const depthB = b.posicion.x + b.posicion.y;
      return depthA - depthB;
    });
  }
}