const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- CONFIGURACIÓN DE ESCUDOS ---
const palabrasProhibidas = ['tonto', 'feo', 'idiota', 'árbitro comprado'];
const registroTiempos = {};
const TIEMPO_ESPERA = 5000; // 5 segundos
const baresCerrados = {}; // Memoria para saber qué bares tienen el chat bloqueado

// --- RUTAS DE LAS PÁGINAS WEB ---
app.get('/', (req, res) => { 
  res.sendFile(__dirname + '/index.html'); 
});

app.get('/admin', (req, res) => { 
  res.sendFile(__dirname + '/admin.html'); 
});

// --- LÓGICA EN TIEMPO REAL ---
io.on('connection', (socket) => {
  console.log('Un nuevo usuario se ha conectado: ' + socket.id);

  // 1. Asignación a la sala de un bar específico
  socket.on('unirse_sala', (nombreBar) => {
    socket.join(nombreBar);
    socket.miSala = nombreBar; 
    console.log(`Usuario conectado a la sala: ${nombreBar}`);
  });

  // 2. Órdenes del Panel de Control (Dueño)
  socket.on('admin_cerrar_chat', (nombreBar) => {
    baresCerrados[nombreBar] = true;
    socket.to(nombreBar).emit('orden_cerrar_chat');
  });

  socket.on('admin_abrir_chat', (nombreBar) => {
    baresCerrados[nombreBar] = false;
    socket.to(nombreBar).emit('orden_abrir_chat');
  });

  socket.on('admin_limpiar_chat', (nombreBar) => {
    socket.to(nombreBar).emit('orden_limpiar_chat');
  });

  // 3. Recepción de mensajes de los clientes
  socket.on('enviar_comentario', (datos) => {
    // Si el dueño ha cerrado el chat, bloqueamos el mensaje
    if (baresCerrados[socket.miSala] === true) {
        return; 
    }

    const tiempoActual = Date.now();

    // Escudo Anti-Spam
    if (registroTiempos[socket.id]) {
      const tiempoPasado = tiempoActual - registroTiempos[socket.id];
      if (tiempoPasado < TIEMPO_ESPERA) {
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
    
    // Emisión final a los móviles de la terraza
    if (socket.miSala) {
        socket.to(socket.miSala).emit('nuevo_comentario', { texto: textoLimpio });
    }
  });

  // 4. Limpieza al salir
  socket.on('disconnect', () => {
    delete registroTiempos[socket.id]; 
  });
});

// --- ARRANQUE AUTOMÁTICO EN RENDER ---
const PUERTO = process.env.PORT || 3000;
server.listen(PUERTO, () => {
  console.log(`Servidor de chat funcionando en el puerto ${PUERTO}`);
});