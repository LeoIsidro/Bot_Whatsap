const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = 'https://qqzybmldrqayzaulyrkl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

//Métodos
const InsertInventario = async (numero, codigo, cantidad, precio) => {
    const { data, error } = await supabase
      .from('inventario')
      .insert([
        { numero: numero, codigo:codigo, cantidad:cantidad, precio:precio },
      ])
      .select()
    if (error) console.error('error', error)
    if (data) console.log('data', data)
}

const Insert = async (c_id,nombre_producto) => {
    const { data, error } = await supabase
      .from('Ventas')
      .insert([
        { Cliente_id: c_id, Nombre:nombre_producto},
      ])
      .select()
    if (error) console.error('error', error);
    if (data) console.log('data', data);
}


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
              resolve({ body: msg.body, from: msg.from });
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
        await Insert(2,producto);
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
    
    InsertInventario(producto,2,precio,cantidad);
    client.sendMessage(usuario, 'Inventario registrado');
}


// Funciones de respuesta

async function mostrarOperaciones () {
    client.sendMessage(usuario, 'Bienvenido Usuario, que operacion deseas realizar\n 1. Consultar Inventario\n2. Registrar nueva venta \n3. Registrar Inventario\n4. Salir');
    const response = await getMensaje();
    const opcion = response.body;
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

//Saber si el usuario esta registrado, consultamos en la base de datos
const get_usuario = async (numero) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('nombre, apellido').eq('numero', numero)
  if (error){
    console.error('error', error);
    return;
  } 

  return data;
}


// Escuchando mensajes

async function Inicio() {
  var response = await getMensaje();
  var msg = response.body;
  var from = response.from;
  const usuario = await get_usuario(from);
  if (usuario.length === 0) {
      client.sendMessage(from, 'No está registrado en el sistema, por favor comuníquese con el administrador');
      return; // Reemplaza 'break' con 'return' para salir de la función
  }

  while( msg !== 'Hola') {
       var response = await getMensaje();
       msg = response.body;
  }
  
  mostrarOperaciones();
}




client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();

Inicio();