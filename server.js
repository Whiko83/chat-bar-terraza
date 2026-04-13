const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const palabrasProhibidas = ['tonto', 'feo', 'idiota', 'árbitro comprado'];

// Registro para el filtro anti-spam
const registroTiempos = {};
const TIEMPO_ESPERA = 5000; // 5 segundos

// Servimos la página web del mando/pantalla móvil
app.get('/', (req, res) => { 
  res.sendFile(__dirname + '/index.html'); 
});

io.on('connection', (socket) => {
  console.log('Un nuevo usuario se ha conectado: ' + socket.id);

  // 1. ASIGNACIÓN DE SALA (Para múltiples bares)
  socket.on('unirse_sala', (nombreBar) => {
    socket.join(nombreBar);
    socket.miSala = nombreBar; 
    console.log(`Usuario conectado a la sala: ${nombreBar}`);
  });

  // 2. RECEPCIÓN DE MENSAJES
  socket.on('enviar_comentario', (datos) => {
    const tiempoActual = Date.now();

    // Filtro Anti-Spam
    if (registroTiempos[socket.id]) {
      const tiempoPasado = tiempoActual - registroTiempos[socket.id];
      if (tiempoPasado < TIEMPO_ESPERA) {
        console.log(`Spam bloqueado del usuario ${socket.id}`);
        socket.emit('aviso_spam', 'Por favor, espera 5 segundos entre mensajes.');
        return; 
      }
    }
    registroTiempos[socket.id] = tiempoActual;

    // Filtro de Palabras
    let textoLimpio = datos.texto;
    palabrasProhibidas.forEach(palabra => {
      const regex = new RegExp(palabra, 'gi');
      textoLimpio = textoLimpio.replace(regex, '***');
    });
    
    // 3. EMISIÓN DEL MENSAJE (Solo a los usuarios del mismo bar)
    if (socket.miSala) {
        // socket.to() asegura que solo lo lean los de esa sala específica
        socket.to(socket.miSala).emit('nuevo_comentario', { texto: textoLimpio });
    }
  });

  // 4. DESCONEXIÓN
  socket.on('disconnect', () => {
    delete registroTiempos[socket.id]; // Limpiamos la memoria
    console.log('Usuario desconectado');
  });
});

// 5. ARRANQUE DEL SERVIDOR (Preparado para Render)
const PUERTO = process.env.PORT || 300
});