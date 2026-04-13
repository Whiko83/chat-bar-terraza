const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const palabrasProhibidas = ['tonto', 'feo', 'idiota', 'árbitro comprado'];

// NUEVO: Un registro para saber cuándo habló cada usuario por última vez
const registroTiempos = {};
const TIEMPO_ESPERA = 5000; // 5 segundos en milisegundos

app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });
app.get('/tv', (req, res) => { res.sendFile(__dirname + '/tv.html'); });

io.on('connection', (socket) => {
  console.log('Un nuevo usuario se ha conectado: ' + socket.id);

  socket.on('enviar_comentario', (datos) => {
    const tiempoActual = Date.now();

    // 1. FILTRO ANTI-SPAM
    if (registroTiempos[socket.id]) {
      const tiempoPasado = tiempoActual - registroTiempos[socket.id];
      // Si no han pasado 5 segundos...
      if (tiempoPasado < TIEMPO_ESPERA) {
        console.log(`Spam bloqueado del usuario ${socket.id}`);
        // Le mandamos un aviso SOLO a ese móvil
        socket.emit('aviso_spam', 'Por favor, espera 5 segundos entre mensajes.');
        return; // Cortamos la función aquí para que no llegue a la TV
      }
    }

    // Si todo es correcto, actualizamos la hora de su último mensaje
    registroTiempos[socket.id] = tiempoActual;

    // 2. FILTRO DE PALABRAS (El que ya teníamos)
    let textoLimpio = datos.texto;
    palabrasProhibidas.forEach(palabra => {
      const regex = new RegExp(palabra, 'gi');
      textoLimpio = textoLimpio.replace(regex, '***');
    });
    
    // Emitimos el texto a la televisión
    io.emit('nuevo_comentario', { texto: textoLimpio });
  });

  socket.on('disconnect', () => {
    // Borramos su registro al irse para no ocupar memoria a lo tonto
    delete registroTiempos[socket.id];
    console.log('Usuario desconectado');
  });
});

// AHORA DEBE DECIR ESTO:
const PUERTO = process.env.PORT || 3000;
server.listen(PUERTO, () => {
  console.log(`Servidor de chat funcionando en el puerto ${PUERTO}`);
});