<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Control Bares</title>
    <style>
        body { font-family: sans-serif; background: #222; color: white; padding: 20px; text-align: center; }
        .card { background: #333; padding: 20px; border-radius: 15px; max-width: 400px; margin: 20px auto; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        .input-group { margin-bottom: 15px; text-align: left; background: #2a2a2a; padding: 10px; border-radius: 8px; }
        .input-group label { font-size: 12px; color: #aaa; margin-left: 5px; text-transform: uppercase; }
        input { width: 90%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #555; background: #444; color: white; }
        button { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-primary { background: #00e5ff; color: black; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
    </style>
</head>
<body>

    <h1 id="bar-nombre">Cargando...</h1>

    <div class="card">
        <h3>⚽ Configurar Partido de Hoy</h3>
        
        <div class="input-group">
            <label>Equipo Local</label>
            <input id="eq1" type="text" placeholder="Ej: Real Madrid">
            <input id="img1" type="text" placeholder="Pega el enlace del escudo (Opcional)">
        </div>

        <div class="input-group">
            <label>Equipo Visitante</label>
            <input id="eq2" type="text" placeholder="Ej: FC Barcelona">
            <input id="img2" type="text" placeholder="Pega el enlace del escudo (Opcional)">
        </div>

        <button class="btn-primary" onclick="guardarEquipos()">ACTUALIZAR EQUIPOS Y ESCUDOS</button>
    </div>

    <div class="card">
        <h3>⚙️ Control del Chat</h3>
        <button class="btn-success" onclick="enviarOrden('admin_abrir_chat')">ABRIR CHAT</button>
        <button class="btn-danger" onclick="enviarOrden('admin_cerrar_chat')">CERRAR CHAT</button>
        <button class="btn-warning" onclick="enviarOrden('admin_limpiar_chat')">VACIAR PANTALLAS</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const params = new URLSearchParams(window.location.search);
        const nombreBar = params.get('bar') || "Bar Genérico";
        document.getElementById('bar-nombre').innerText = "Panel: " + nombreBar;

        socket.emit('unirse_sala', nombreBar);

        function guardarEquipos() {
            const equipo1 = document.getElementById('eq1').value;
            const img1 = document.getElementById('img1').value;
            
            const equipo2 = document.getElementById('eq2').value;
            const img2 = document.getElementById('img2').value;
            
            if (equipo1 && equipo2) {
                // Ahora enviamos un "Objeto" completo con el nombre y la imagen
                socket.emit('admin_configurar_equipos', { 
                    bar: nombreBar, 
                    equipo1: { nombre: equipo1, escudo: img1 }, 
                    equipo2: { nombre: equipo2, escudo: img2 } 
                });
                alert("¡Equipos y escudos actualizados en las pantallas de todos los clientes!");
            } else {
                alert("Por favor, introduce al menos el nombre de los dos equipos.");
            }
        }

        function enviarOrden(orden) {
            if(orden === 'admin_limpiar_chat' && !confirm("¿Seguro que quieres borrar todos los mensajes?")) return;
            socket.emit(orden, nombreBar);
        }
    </script>
</body>
</html>