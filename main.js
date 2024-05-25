const { Client ,LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Cliente de WhatsApp

const client = new Client({

    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    }
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

async function getMensaje() {
    return new Promise(resolve => {
        client.once('message', msg => {
            if (msg.from === usuario ) {
                resolve(msg.body);
            }
        });
    });
}

var usuario='51970579052@c.us';


// Funciones de obtencion de la base de datos

async function getInventario () {
    return 'Inventario';
}


async function insertarVenta () {

    client.sendMessage(usuario, 'Ingrese la cantidad de productos vendidos');

    // Se almacena la cantidad de productos vendidos  
    var cantidad = await getMensaje();
    console.log(cantidad);

    while (cantidad>0) {
        client.sendMessage(usuario, 'Ingrese el nombre del producto');
        var producto = await getMensaje();
        console.log(producto);
        // Se inserta en la base de datos la venta

        //
        cantidad--;
    }
    client.sendMessage(usuario, 'Venta registrada');  
}

async function registrarInventario  ()  {
    client.sendMessage(usuario, 'Ingrese el nombre del producto');
    var producto = await getMensaje();
    console.log(producto);
    client.sendMessage(usuario, 'Ingrese la cantidad del producto');
    var cantidad = await getMensaje();
    console.log(cantidad);
    client.sendMessage(usuario, 'Ingrese el precio del producto');
    var precio = await getMensaje();
    console.log(precio);
    // Se inserta en la base de datos el producto

    client.sendMessage(usuario, 'Inventario registrado');
}


// Funciones de respuesta

async function mostrarOperaciones () {
    client.sendMessage(usuario, 'Bienvenido Usuario, que operacion deseas realizar\n 1. Consultar Inventario\n2. Registrar nueva venta \n3. Registrar Inventario\n4. Salir');
    const opcion = await getMensaje();
        switch (opcion) {
            case '1':
                client.sendMessage(usuario, 'Aquí está el inventario...');
                await getInventario();
                break;
            case '2':
                client.sendMessage(usuario, 'Registrando nueva venta...');
                await insertarVenta();
                mostrarOperaciones();
                break;
            case '3':
                client.sendMessage(usuario, 'Registrando inventario...');
                await registrarInventario();
                break;
            case '4':
                client.sendMessage(usuario, 'Saliendo...');
                Inicio();
                break;
            default:
                client.sendMessage(usuario, 'Opción no válida, intente nuevamente');
                mostrarOperaciones();
                break;
          } 
}




// Escuchando mensajes

async function Inicio() {
    var msg = await getMensaje();
    console.log(msg);
    while( msg !== 'Hola') {
         msg = await getMensaje();
    }
    
    mostrarOperaciones();
}




client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();

Inicio();