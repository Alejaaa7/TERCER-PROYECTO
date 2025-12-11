// APP.JS - Punto de Entrada Principal

// Estado global de la aplicación
const AppState = {
  currentMode: 'menu',
  canvas: null,
  ctx: null,
  modeInstances: {}
};

// INICIALIZACIÓN

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 TacticBoard Pro iniciando...');
  
  initCanvas();
  initMenuButtons();
  initBackButtons();
  
  console.log('✅ Aplicación lista');
});

// CONFIGURACIÓN DEL CANVAS

function initCanvas() {
  AppState.canvas = document.getElementById('main-canvas');
  AppState.ctx = AppState.canvas.getContext('2d');
  
  // Ajustar tamaño al viewport
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Configurar para pixel art
  AppState.ctx.imageSmoothingEnabled = false;
}

function resizeCanvas() {
  AppState.canvas.width = window.innerWidth;
  AppState.canvas.height = window.innerHeight;
}

// NAVEGACIÓN ENTRE MODOS

function initMenuButtons() {
  const buttons = document.querySelectorAll('.menu-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      switchMode(mode);
    });
  });
}

function initBackButtons() {
  const backButtons = document.querySelectorAll('.back-btn');
  
  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode('menu');
    });
  });
}

function switchMode(modeName) {
  console.log(`🎮 Cambiando a modo: ${modeName}`);
  
  // Ocultar todas las pantallas
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  if (modeName === 'menu') {
    // Volver al menú principal
    document.getElementById('main-menu').classList.add('active');
    AppState.currentMode = 'menu';
    
    // Limpiar canvas
    clearCanvas();
  } else {
    // Mostrar pantalla del modo seleccionado
    const screen = document.getElementById(`${modeName}-screen`);
    if (screen) {
      screen.classList.add('active');
      AppState.currentMode = modeName;
      
      // Cargar modo si no existe
      if (!AppState.modeInstances[modeName]) {
        loadMode(modeName);
      } else {
        // Reactivar modo existente
        AppState.modeInstances[modeName].activate();
      }
    }
  }
}

async function loadMode(modeName) {
  console.log(`📦 Cargando modo: ${modeName}`);
  
  // TODO: Aquí cargaremos dinámicamente cada modo cuando estén listos
  // Por ahora solo mostramos un placeholder
  const screen = document.getElementById(`${modeName}-screen`);
  const content = screen.querySelector('.mode-content');
  
  content.innerHTML = `
    <div style="text-align: center; padding: 100px;">
      <h3 style="font-size: 2rem; color: var(--accent-cyan); margin-bottom: 20px;">
        MODO ${modeName.toUpperCase()}
      </h3>
      <p style="font-size: 1.2rem; color: var(--text-secondary);">
        En desarrollo... Próximamente tendrás acceso completo.
      </p>
    </div>
  `;
}

// UTILIDADES DEL CANVAS

function clearCanvas() {
  AppState.ctx.clearRect(0, 0, AppState.canvas.width, AppState.canvas.height);
}

// EXPORTAR PARA USO EN OTROS MÓDULOS

window.AppState = AppState;
window.switchMode = switchMode;
window.clearCanvas = clearCanvas;