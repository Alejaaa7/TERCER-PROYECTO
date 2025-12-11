// DATALOADER.JS - Carga de Datos JSON

export class DataLoader {
  static async cargarJSON(ruta) {
    try {
      const response = await fetch(ruta);
      if (!response.ok) {
        throw new Error(`Error cargando ${ruta}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en DataLoader:', error);
      return null;
    }
  }

  static async cargarJugadores() {
    return await this.cargarJSON('assets/data/jugadores.json');
  }

  static async cargarFormaciones() {
    return await this.cargarJSON('assets/data/formaciones.json');
  }

  static async cargarPartido(nombre) {
    return await this.cargarJSON(`assets/data/partidos/${nombre}.json`);
  }

  static async cargarPuzzle(nombre) {
    return await this.cargarJSON(`assets/data/puzzles/${nombre}.json`);
  }

  static async cargarTodosLosPartidos() {
    const partidos = [
      'argentina-francia',
      'barcelona-real',
      'manchester-inter'
    ];
    
    const resultados = {};
    for (const nombre of partidos) {
      resultados[nombre] = await this.cargarPartido(nombre);
    }
    
    return resultados;
  }

  static async cargarTodosLosPuzzles() {
    const puzzles = [
      'milagro-anfield',
      'manita-clasico',
      'contraataque-chelsea'
    ];
    
    const resultados = {};
    for (const nombre of puzzles) {
      resultados[nombre] = await this.cargarPuzzle(nombre);
    }
    
    return resultados;
  }
}