const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// NUEVA LÍNEA MÁGICA: Permite usar imágenes guardadas en una carpeta llamada "public"
app.use(express.static('public'));
const server = http.createServer(app);
const io = new Server(server);

const palabrasProhibidas = ['tonto', 'feo', 'idiota', 'árbitro comprado'];
const registroTiempos = {};
const TIEMPO_ESPERA = 5000;
const baresCerrados = {};
const equiposPorBar = {};

app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });
app.get('/admin', (req, res) => { res.sendFile(__dirname + '/admin.html'); });

function actualizarContador(nombreBar) {
    const sala = io.sockets.adapter.rooms.get(nombreBar);
    const numUsuarios = sala ? sala.size : 0;
    io.to(nombreBar).emit('actualizar_contador', numUsuarios);
}

io.on('connection', (socket) => {

    socket.on('unirse_sala', (nombreBar) => {
        socket.join(nombreBar);
        socket.miSala = nombreBar;
        const equipos = equiposPorBar[nombreBar] || [];
        socket.emit('configuracion_equipos', equipos);
        actualizarContador(nombreBar);
    });

    socket.on('admin_configurar_equipos', (datos) => {
        equiposPorBar[datos.bar] = [datos.equipo1, datos.equipo2];
        io.to(datos.bar).emit('configuracion_equipos', equiposPorBar[datos.bar]);
    });

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

    socket.on('enviar_comentario', (datos) => {
        if (baresCerrados[socket.miSala]) return;

        const tiempoActual = Date.now();
        if (registroTiempos[socket.id] && (tiempoActual - registroTiempos[socket.id] < TIEMPO_ESPERA)) {
            socket.emit('aviso_spam', 'Espera 5 segundos.');
            return;
        }
        registroTiempos[socket.id] = tiempoActual;

        let textoLimpio = datos.texto;
        palabrasProhibidas.forEach(p => {
            textoLimpio = textoLimpio.replace(new RegExp(p, 'gi'), '***');
        });
        
        if (socket.miSala) {
            socket.to(socket.miSala).emit('nuevo_comentario', { 
                equipo: datos.equipo, // Ahora incluye nombre y escudo
                texto: textoLimpio 
            });
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(sala => {
            setTimeout(() => actualizarContador(sala), 100);
        });
    });

    socket.on('disconnect', () => {
        delete registroTiempos[socket.id];
    });
});

const PUERTO = process.env.PORT || 3000;
server.listen(PUERTO, () => {
    console.log(`Servidor en puerto ${PUERTO}`);
});