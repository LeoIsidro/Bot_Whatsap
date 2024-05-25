const { Client ,LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Cliente de WhatsApp

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one",
        dataPath: './session-data' // Ruta personalizada para almacenar los datos de la sesión
    }),
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

// Funciones de obtencion de la base de datos

const getInventario = () => {
    return 'Inventario';
}

const insertarVenta = (producto) => {
    return 'Venta';
}




// Escuchando mensajes

client.on('message', msg => {
    console.log('Message received', msg.body);
    console.log('From', msg.from); 
    if (msg.from ==='51940425961@c.us' && msg.type === 'chat') {
      if (msg.body === 'Hola') {
        client.sendMessage(msg.from, 'Bienvenido matias, que operacion deseas realizar\n 1. Consultar Inventario\n2. Registrar nueva venta \n3. Registrar Inventario\n4. Consultar movimientos\n5. Salir');
      }
      else if (!isNaN(msg.body)) {
        switch (msg.body) {
          case '1':
              client.sendMessage(msg.from, 'Aquí está el inventario...');
              client.sendMessage(msg.from, getInventario());
              break;
          case '2':
              client.sendMessage(msg.from, 'Registrando nueva venta...');
              client.sendMessage(msg.from, 'Ingrese la cantidad de productos vendidos');
              // Aquí se debería esperar a que el usuario ingrese la cantidad de productos vendidos
              // Se almacena la cantidad de productos vendidos
              var cantidad = msg.body;
              while (cantidad) {
                client.sendMessage(msg.from, 'Ingrese el nombre del producto vendido');
                var producto = msg.body;
                insertarVenta(producto);
                cantidad--;
              }
              client.sendMessage(msg.from, 'Venta registrada');              
              break;
          case '3':
              client.sendMessage(msg.from, 'Registrando inventario...');
              client.sendMessage(msg.from, 'Inventario registrado');
              break;
          case '4':
              client.sendMessage(msg.from, 'Aquí están los movimientos...');
              break;
          case '5':
              client.sendMessage(msg.from, 'Saliendo...');
              break;
          default:
              client.sendMessage(msg.from, 'Opción no válida, intente nuevamente');
              break;
        }
      }
    }
});

client.sendMessage('519404259', 'Hola');




client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();