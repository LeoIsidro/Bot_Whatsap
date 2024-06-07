const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = 'https://qqzybmldrqayzaulyrkl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

//Métodos
const InsertInventario = async (numero, codigo, cantidad) => {
    // Actualizar la cantidad de productos en el inventario
    const { data, error } = await supabase.rpc('Incrementar_cantidad_productos', { numero: numero , codigo: codigo, cantidad_producto: cantidad});
    if (error) console.error('error', error)
    if (data) console.log('data', data)
}

const Insert = async (c_id,nombre_producto) => {
    const { data, error } = await supabase
      .from('ventas')
      .insert([
        { numero: c_id, codigo:nombre_producto},
      ])
      .select()
    if (error) console.error('error', error);
    if (data) console.log('data', data);

}

const Mostrar_inventario = async (cliente) => {
    // Consultar el inventario
    console.log(cliente);
    const { data, error } = await supabase.rpc('obtener_inventario', { cliente: cliente });
    if (error) console.error('error', error);
    if (data) console.log('data', data);
    return data;    
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
              resolve({ body: msg.body, from: msg.from });
      });
  });
}


var usuario;

async function mostrar_nombre_producto(codigo){
    console.log("MOSTRAR NOMBRE PRODUCTO");
    const { data, error } = await supabase.rpc('get_nombre',{numero :codigo});
    if (error) console.error('error', error);
    return data[0];
}
// Funciones de obtencion de la base de datos

async function getInventario () {
    // Se obtiene el inventario de la base de datos
    var inventario = await Mostrar_inventario(usuario);
    var mensaje = '';
    inventario.forEach(producto => {
        mensaje += `Nombre: ${producto.nombre_producto} | Cantidad: ${producto.cantidad} \n`;
    }
    );
    client.sendMessage(usuario, mensaje);
}

async function insertarVenta () {

    client.sendMessage(usuario, 'Escanee los productos vendidos');

    // Se almacena la cantidad de productos vendidos  
    var productos = await getMensaje();
    var productos = productos.body;
    console.log(productos);
    console.log(productos.length);
    let indice = 0;
    let nombres = [];

    while (indice < productos.length) {
        let producto = productos.slice(indice, indice + 13);
        console.log(producto);
        // Se inserta en la base de datos la venta
        await Insert(usuario,producto);
        nombres.push(mostrar_nombre_producto(producto));
        indice += 13;
    }
    // Espera a que todas las promesas se resuelvan
    nombres = await Promise.all(nombres);
    nombres.forEach(nombre => {
            console.log(nombre);
            client.sendMessage(usuario, nombre);
        }
    );
}

async function registrarInventario  ()  {
    client.sendMessage(usuario, 'Ingrese el codigo del producto');
    var producto = await getMensaje();
    var producto = producto.body;
    console.log(producto);
    client.sendMessage(usuario, 'Ingrese la cantidad del producto');
    var cantidad = await getMensaje();
    var cantidad = cantidad.body;
    console.log(cantidad);
    // Se inserta en la base de datos el producto
    
    InsertInventario(usuario, producto,cantidad);
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
                break;
            case '3':
                client.sendMessage(usuario, 'Registrando inventario...');
                await registrarInventario();
                break;
            case '4':
                client.sendMessage(usuario, 'Saliendo...');
                Inicio();
                return;
            default:
                client.sendMessage(usuario, 'Opción no válida, intente nuevamente');
                break;
          }
    mostrarOperaciones();
}

//Saber si el usuario esta registrado, consultamos en la base de datos
const get_usuario = async (numero) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('numero','nombre, apellido').eq('numero', numero)
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
  console.log(msg);
  var from = response.from;
  console.log(from);
  var data = await get_usuario(from);
  console.log(data);
  

  if (data.length === 0) {
      client.sendMessage(from, 'No está registrado en el sistema, por favor comuníquese con el administrador');
      Inicio();
      return;
  }
  usuario = data[0].numero;

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