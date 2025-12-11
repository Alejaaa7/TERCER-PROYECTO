const { contextBridge, ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

// Exponer API segura al frontend
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Función para ejecutar el motor de grafos en C++
  ejecutarMotorGrafos: async (input) => {
    return new Promise((resolve, reject) => {
      const enginePath = path.join(__dirname, 'graph-engine', 'build', 
        process.platform === 'win32' ? 'graph_engine.exe' : 'graph_engine');
      
      const engine = spawn(enginePath);
      let output = '';
      let errorOutput = '';

      // Enviar datos de entrada al motor C++
      engine.stdin.write(JSON.stringify(input));
      engine.stdin.end();

      // Capturar salida
      engine.stdout.on('data', (data) => {
        output += data.toString();
      });

      engine.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      engine.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error('Error parseando respuesta del motor C++: ' + e.message));
          }
        } else {
          reject(new Error('Motor C++ falló: ' + errorOutput));
        }
      });

      engine.on('error', (err) => {
        reject(new Error('No se pudo ejecutar el motor C++: ' + err.message));
      });
    });
  }
});