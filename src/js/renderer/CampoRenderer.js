// ========================================
// CAMPORENDERER.JS - Renderizado del Campo
// ========================================

import { IsoUtils } from '../utils/IsoUtils.js';

export class CampoRenderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.vistaIsometrica = true;
    
    // Configuración del campo
    this.config = {
      width: 600,
      height: 400,
      offsetX: canvas.width / 2,
      offsetY: canvas.height / 2 - 100
    };
    
    // Guardar referencia para actualizar
    IsoUtils.setVistaIsometrica(true);
  }

  setVistaIsometrica(isometrica) {
    this.vistaIsometrica = isometrica;
    IsoUtils.setVistaIsometrica(isometrica);
    console.log(`📐 CampoRenderer: Vista ${isometrica ? 'Isométrica' : 'Aérea'}`);
  }

  dibujar() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fondo degradado
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0F1419');
    gradient.addColorStop(1, '#1A1F26');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.vistaIsometrica) {
      this.dibujarCampoIsometrico();
    } else {
      this.dibujarCampoAereo();
    }
  }

  dibujarCampoIsometrico() {
    // Campo isométrico (lo que ya teníamos)
    this.dibujarBaseField();
    this.dibujarLineasCampo();
    this.dibujarAreas();
    this.dibujarCirculoCentral();
  }

  dibujarCampoAereo() {
    // Vista desde arriba (2D puro, sin transformación isométrica)
    const campoWidth = 500;
    const campoHeight = 350;
    const startX = (this.canvas.width - campoWidth) / 2;
    const startY = (this.canvas.height - campoHeight) / 2;

    // Actualizar config para vista aérea
    this.config.offsetX = startX;
    this.config.offsetY = startY;
    this.config.width = campoWidth;
    this.config.height = campoHeight;

    // Rectángulo del campo
    this.ctx.fillStyle = '#2A5C2E';
    this.ctx.fillRect(startX, startY, campoWidth, campoHeight);

    // Borde
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(startX, startY, campoWidth, campoHeight);

    // Línea central
    this.ctx.beginPath();
    this.ctx.moveTo(startX + campoWidth / 2, startY);
    this.ctx.lineTo(startX + campoWidth / 2, startY + campoHeight);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Círculo central
    this.ctx.beginPath();
    this.ctx.arc(startX + campoWidth / 2, startY + campoHeight / 2, 40, 0, Math.PI * 2);
    this.ctx.stroke();

    // Áreas
    const areaWidth = campoWidth * 0.15;
    const areaHeight = campoHeight * 0.5;
    const areaY = startY + (campoHeight - areaHeight) / 2;

    // Área izquierda
    this.ctx.strokeRect(startX, areaY, areaWidth, areaHeight);

    // Área derecha
    this.ctx.strokeRect(startX + campoWidth - areaWidth, areaY, areaWidth, areaHeight);

    // Área pequeña izquierda
    const smallAreaWidth = campoWidth * 0.08;
    const smallAreaHeight = campoHeight * 0.3;
    const smallAreaY = startY + (campoHeight - smallAreaHeight) / 2;

    this.ctx.strokeRect(startX, smallAreaY, smallAreaWidth, smallAreaHeight);
    this.ctx.strokeRect(startX + campoWidth - smallAreaWidth, smallAreaY, smallAreaWidth, smallAreaHeight);
  }

  dibujarBaseField() {
    const esquinas2D = [
      { x: 0, y: 0 },
      { x: this.config.width, y: 0 },
      { x: this.config.width, y: this.config.height },
      { x: 0, y: this.config.height }
    ];

    const esquinasIso = esquinas2D.map(p => {
      const iso = IsoUtils.toIso(p.x, p.y);
      return {
        x: iso.x + this.canvas.width / 2,
        y: iso.y + this.canvas.height / 2 - 100
      };
    });

    this.ctx.beginPath();
    this.ctx.moveTo(esquinasIso[0].x, esquinasIso[0].y);
    esquinasIso.forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.closePath();

    const gradient = this.ctx.createLinearGradient(
      esquinasIso[0].x, esquinasIso[0].y,
      esquinasIso[2].x, esquinasIso[2].y
    );
    gradient.addColorStop(0, '#1a3d1a');
    gradient.addColorStop(0.5, '#2A5C2E');
    gradient.addColorStop(1, '#1a3d1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  dibujarLineasCampo() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.dibujarLineaIso(this.config.width / 2, 0, this.config.width / 2, this.config.height);
  }

  dibujarAreas() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.dibujarRectanguloIso(0, this.config.height * 0.25, this.config.width * 0.15, this.config.height * 0.5);
    this.dibujarRectanguloIso(this.config.width * 0.85, this.config.height * 0.25, this.config.width * 0.15, this.config.height * 0.5);
    this.dibujarRectanguloIso(0, this.config.height * 0.35, this.config.width * 0.08, this.config.height * 0.3);
    this.dibujarRectanguloIso(this.config.width * 0.92, this.config.height * 0.35, this.config.width * 0.08, this.config.height * 0.3);
  }

  dibujarCirculoCentral() {
    const centro = IsoUtils.campoToScreen(50, 50, this.getConfig());
    this.ctx.beginPath();
    this.ctx.ellipse(centro.x, centro.y, 50, 25, 0, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(centro.x, centro.y, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fill();
  }

  dibujarLineaIso(x1, y1, x2, y2) {
    const p1 = IsoUtils.toIso(x1, y1);
    const p2 = IsoUtils.toIso(x2, y2);
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x + this.canvas.width / 2, p1.y + this.canvas.height / 2 - 100);
    this.ctx.lineTo(p2.x + this.canvas.width / 2, p2.y + this.canvas.height / 2 - 100);
    this.ctx.stroke();
  }

  dibujarRectanguloIso(x, y, width, height) {
    const esquinas = [
      IsoUtils.toIso(x, y),
      IsoUtils.toIso(x + width, y),
      IsoUtils.toIso(x + width, y + height),
      IsoUtils.toIso(x, y + height)
    ];
    this.ctx.beginPath();
    this.ctx.moveTo(esquinas[0].x + this.canvas.width / 2, esquinas[0].y + this.canvas.height / 2 - 100);
    esquinas.forEach(p => {
      this.ctx.lineTo(p.x + this.canvas.width / 2, p.y + this.canvas.height / 2 - 100);
    });
    this.ctx.closePath();
    this.ctx.stroke();
  }

  getConfig() {
    if (this.vistaIsometrica) {
      return {
        width: this.config.width,
        height: this.config.height,
        offsetX: this.canvas.width / 2,
        offsetY: this.canvas.height / 2 - 100
      };
    } else {
      // Vista aérea usa coordenadas diferentes
      return {
        width: this.config.width,
        height: this.config.height,
        offsetX: this.config.offsetX,
        offsetY: this.config.offsetY
      };
    }
  }
}