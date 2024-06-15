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


//var usuario;

async function mostrar_nombre_producto(codigo){
    console.log("MOSTRAR NOMBRE PRODUCTO");
    const { data, error } = await supabase.rpc('get_nombre',{numero :codigo});
    if (error) console.error('error', error);
    return data[0];
}
// Funciones de obtencion de la base de datos

async function getInventario (usuario) {
    // Se obtiene el inventario de la base de datos
    var inventario = await Mostrar_inventario(usuario);
    //console.log("Llegue");
    var mensaje = '';
    inventario.forEach(producto => {
        mensaje += `Nombre: ${producto.nombre_producto} | Cantidad: ${producto.cantidad} \n`;
    }
    );
    //console.log("Llegue");
    client.sendMessage(usuario, mensaje);
}

async function insertarVenta (usuario) {

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

async function registrarInventario  (usuario)  {
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

async function resumenVentas (usuario) {
    // Se obtiene el resumen de ventas de la base de datos
    const { data, error } = await supabase.rpc('resumenventas', { cliente: usuario });
    if (error) console.error('error', error);
    if (data) console.log('data', data);
    var mensaje = '';
    var ganancia_total = 0;
    if (data.length === 0) {
        client.sendMessage(usuario, 'No se han realizado ventas');
    }
    else {
    for (let i = 0; i < data.length; i++) {
        mensaje += `Producto: ${data[i].producto_nombre} | Cantidad: ${data[i].cantidad} | Precio: ${data[i].precio} \n`;
        ganancia_total += data[i].precio*data[i].cantidad;
    }
    client.sendMessage(usuario, mensaje);
    client.sendMessage(usuario, `Ganancia total: ${ganancia_total}`);
    }
    client.sendMessage(usuario, ':)');
}


// Funciones de respuesta

async function mostrarOperaciones (usuario) {
    client.sendMessage(usuario, 'Bienvenido Usuario, que operacion deseas realizar\n 1. Consultar Inventario\n 2. Registrar nueva venta\n 3. Registrar Inventario\n 4. Resumen de ventas del dia\n 5. Salir');
    const response = await getMensaje();
    const opcion = response.body;
        switch (opcion) {
            case '1':
                client.sendMessage(usuario, 'Aquí está el inventario...');
                await getInventario(usuario);
                break;
            case '2':
                client.sendMessage(usuario, 'Registrando nueva venta...');
                await insertarVenta(usuario);
                break;
            case '3':
                client.sendMessage(usuario, 'Registrando inventario...');
                await registrarInventario(usuario);
                break;
            case '4':
                client.sendMessage(usuario, 'Resumen de Ventas del dia...');
                await resumenVentas(usuario);
                break;
            case '5':
                client.sendMessage(usuario, 'Saliendo...');
                usuarios.set(usuario, { esperandoSaludo: true, data: null });
                //Inicio();
                return;
            default:
                client.sendMessage(usuario, 'Opción no válida, intente nuevamente');
                break;
          }
    mostrarOperaciones(usuario);
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

  return 1;
}


// Escuchando mensajes

const usuarios = new Map();

async function Inicio() {
  
  var response = await getMensaje();
  var msg = response.body;
  console.log(msg);
  var from = response.from;
  console.log(from);
  var data = await get_usuario(from);
  console.log(data);
  
  if (data) {
      client.sendMessage(from, 'No está registrado en el sistema, por favor comuníquese con el administrador');
      Inicio();
      return;
  }
  
  //usuario = data[0].numero;
  
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

//Inicio();

client.on('message', async (msg) => {

    if( get_usuario(msg.from)){
        const from = msg.from;
        // Verificar si el usuario ya está siendo rastreado
        if (!usuarios.has(from)) {
            // Inicializar el estado del usuario si es nuevo
            usuarios.set(from, { esperandoSaludo: true, data: null });
        }

        let estadoUsuario = usuarios.get(from);

        // Ejemplo de cómo manejar un saludo inicial
        if (estadoUsuario.esperandoSaludo && msg.body.toLowerCase() === 'hola') {
            estadoUsuario.esperandoSaludo = false;
            // Aquí se podría llamar a mostrarOperaciones() o cualquier otra función
            mostrarOperaciones(msg.from);
        }

        // Actualizar el estado del usuario en el mapa
        usuarios.set(from, estadoUsuario);
    }
    else{
        client.sendMessage(msg.from, 'No está registrado en el sistema, por favor comuníquese con el administrador');
    }

});

