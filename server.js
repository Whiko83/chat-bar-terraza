const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const palabrasProhibidas = ['tonto', 'feo', 'idiota', 'árbitro comprado'];

const registroTiempos = {};
const TIEMPO_ESPERA = 5000; 

app.get('/', (req, res) => { 
  res.sendFile(__dirname + '/index.html'); 
});

io.on('connection', (socket) => {
  console.log('Un nuevo usuario se ha conectado: ' + socket.id);

  socket.on('unirse_sala', (nombreBar) => {
    socket.join(nombreBar);
    socket.miSala = nombreBar; 
    console.log(`Usuario conectado a la sala: ${nombreBar}`);
  });

  socket.on('enviar_comentario', (datos) => {
    const tiempoActual = Date.now();

    if (registroTiempos[socket.id]) {
      const tiempoPasado = tiempoActual - registroTiempos[socket.id];
      if (tiempoPasado < TIEMPO_ESPERA) {
        console.log(`Spam bloqueado del usuario ${socket.id}`);
        socket.emit('aviso_spam', 'Por favor, espera 5 segundos entre mensajes.');
        return; 
      }
    }
    registroTiempos[socket.id] = tiempoActual;

    let textoLimpio = datos.texto;
    palabrasProhibidas.forEach(palabra => {
      const regex = new RegExp(palabra, 'gi');
      textoLimpio = textoLimpio.replace(regex, '***');
    });
    
    if (socket.miSala) {
        socket.to(socket.miSala).emit('nuevo_comentario', { texto: textoLimpio });
    }
  });

  socket.on('disconnect', () => {
    delete registroTiempos[socket.id]; 
    console.log('Usuario desconectado');
  });
});

const PUERTO = process.env.PORT || 3000;
server.listen(PUERTO, () => {
  console.log(`Servidor de chat funcionando en el puerto ${PUERTO}`);
});