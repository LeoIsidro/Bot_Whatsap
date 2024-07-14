const { createClient } = require('@supabase/supabase-js');
const { jsPDF } = require('jspdf');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
require('jspdf-autotable');

require('dotenv').config();

const supabaseUrl = 'https://qqzybmldrqayzaulyrkl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const emailKey = process.env.EMAIL_KEY
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
    if (data) console.log('INSERT', data);

}

const Mostrar_inventario = async (cliente,producto) => {
    // Consultar el inventario
    console.log(cliente);
    const { data, error } = await supabase.rpc('obtener_inventario', { cliente: cliente , producto: producto});
    if (error) console.error('error', error);
    if (data) console.log('data', data);
    return data;    
}


const { Client ,MessageMedia} = require('whatsapp-web.js');
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
    // console.log(data);
    return data[0];
}
// Funciones de obtencion de la base de datos

async function getInventario (usuario) {

    await client.sendMessage(usuario, 'Ingrese el codigo del producto');
    var producto = await getMensaje();
    while( producto.from != usuario){
        producto = await getMensaje();
    }
    console.log(producto.body);
    // Se obtiene el inventario de la base de datos
    var inventario = await Mostrar_inventario(usuario,producto.body);
    //console.log("Llegue");
    if(inventario.length === 0){
        await client.sendMessage(usuario, 'No se encuentra el producto');
    }
    else{
        var mensaje = `Producto: ${inventario[0].nombre_producto} | Cantidad: ${inventario[0].cantidad} \n`;
        await client.sendMessage(usuario, mensaje);
    }

}

async function insertarVenta (usuario) {

    await client.sendMessage(usuario, 'Escanee los productos vendidos');

    // Se almacena la cantidad de productos vendidos  
    let productos = await getMensaje();
    while( productos.from != usuario){
        productos = await getMensaje();
    }
    productos = productos.body;
    console.log(productos);
    console.log(productos.length);
    let indice = 0;

    while (indice < productos.length) {
        if (productos[indice] === ' ' || productos[indice] === ',' || productos[indice] === '\n') {
            indice++;
            continue;
        }
        let producto = productos.slice(indice, indice + 13);
        console.log(producto);
        // Se inserta en la base de datos la venta
        await Insert(usuario,producto);
        let nombre = await mostrar_nombre_producto(producto);
        await client.sendMessage(usuario, nombre);
        indice += 13;
    }
    // Espera a que todas las promesas se resuelvan
}

async function registrarInventario  (usuario)  {
    await client.sendMessage(usuario, 'Ingrese el codigo del producto');
    let producto = await getMensaje();
    while( producto.from != usuario){
        producto = await getMensaje();
    }
    producto = producto.body;
    console.log(producto);
    await client.sendMessage(usuario, 'Ingrese la cantidad del producto');
    let cantidad = await getMensaje();
    while( cantidad.from != usuario){
        cantidad = await getMensaje();
    }
    cantidad = cantidad.body;
    console.log(cantidad);
    // Se inserta en la base de datos el producto
    
    InsertInventario(usuario, producto,cantidad);
}

async function resumenVentas (usuario) {
    // Se obtiene el resumen de ventas de la base de datos
    const { data, error } = await supabase.rpc('obtener_ventas_diarias', { cliente: usuario });
    if (error) console.error('error', error);
    if (data) console.log('data', data);
    
    var ganancia_total = 0;

    if (data.length === 0) {
        await client.sendMessage(usuario, 'No se han realizado ventas');
    }
    else {
        console.log(data);
        for (let i = 0; i < data.length; i++) {
            ganancia_total += data[i].precio_venta*data[i].cantidad - data[i].precio_compra*data[i].cantidad;
        }
    
        // Crear el PDF con formato de reporte de ventas
        const doc = new jsPDF();
        doc.text("Reporte de Ventas", 10, 10);
        const columnas = ["Producto", "Cantidad", "Precio_compra", "Precio_venta"];
        const filas = data.map(venta => [venta.nombre_producto, venta.cantidad, venta.precio_compra, venta.precio_venta]);

        doc.autoTable({
            head: [columnas],
            body: filas,
            startY: 20
        });

        doc.text(`Ganancia total: ${ganancia_total}`, 10, doc.autoTable.previous.finalY + 10);

        const pdfPath = path.resolve(__dirname, 'reporte_ventas.pdf');

        doc.save(pdfPath);

        // Leer el archivo PDF
        const media = MessageMedia.fromFilePath(pdfPath);

        await client.sendMessage(usuario, media).then(response => {
            console.log('Archivo PDF enviado exitosamente');

            // Eliminar el archivo PDF
            fs.unlink(pdfPath, (err) => {
                if (err) {
                    console.error('Error al eliminar el archivo PDF:', err);
                } else {
                    console.log('Archivo PDF eliminado exitosamente');
                }
            });
        }).catch(error => {
            console.error('Error al enviar el archivo PDF:', error);
        });

    }
        await client.sendMessage(usuario, ':)');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'isidroleonardo15@gmail.com',
        pass: emailKey
    }
});

async function Enviar_Reporte_Mensual_Mail(){

    const ventas = [
        { fecha: '2024-06-01', producto: 'Producto A', cantidad: 10, precio: 100 },
        { fecha: '2024-06-02', producto: 'Producto B', cantidad: 5, precio: 200 },
        { fecha: '2024-06-03', producto: 'Producto C', cantidad: 3, precio: 150 },
        // Agrega más datos según sea necesario
    ];

    // Crear el PDF con formato de reporte de ventas
    const doc = new jsPDF();
    doc.text("Reporte de Ventas Mensual", 10, 10);

    // Agregar tabla de ventas
    const columnas = ["Producto", "Cantidad", "Precio_compra", "Precio_venta"];
    const filas = data.map(venta => [venta.nombre_producto, venta.cantidad, venta.precio_compra, venta.precio_venta]);


    doc.autoTable({
        head: [columnas],
        body: filas,
        startY: 20
    });

    const pdfPath = path.resolve(__dirname, 'reporte_ventas_mensual.pdf');
    doc.save(pdfPath);

    // Configuración del correo electrónico
    const mailOptions = {
        from: 'isidroleonardo15@@gmail.com',
        to: 'matias.maravi@utec.edu.pe', // Reemplaza con la dirección de correo del destinatario
        subject: 'Reporte de Ventas Mensual',
        text: 'Adjunto encontrarás el reporte de ventas mensual.',
        attachments: [
            {
                filename: 'reporte_ventas_mensual.pdf',
                path: pdfPath
            }
        ]
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error al enviar el correo:', error);
        }
        console.log('Correo enviado: ' + info.response);

        // Eliminar el archivo PDF después de enviarlo
        fs.unlink(pdfPath, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo PDF:', err);
            } else {
                console.log('Archivo PDF eliminado exitosamente');
            }
        });
    });
}

// Funciones de respuesta

async function mostrarOperaciones (usuario) {
    await client.sendMessage(usuario, 'Bienvenido Usuario, que operacion deseas realizar\n 1. Consultar Inventario\n 2. Registrar nueva venta\n 3. Registrar Inventario\n 4. Resumen de ventas del dia\n 5. Salir');
    let response = await getMensaje();
    while( response.from != usuario){
        response = await getMensaje();
    }
    const opcion = response.body;
        switch (opcion) {
            case '1':
                await client.sendMessage(usuario, 'Aquí está el inventario...');
                await getInventario(usuario);
                break;
            case '2':
                await client.sendMessage(usuario, 'Registrando nueva venta...');
                await insertarVenta(usuario);
                break;
            case '3':
                await client.sendMessage(usuario, 'Actualizando inventario...');
                await registrarInventario(usuario);
                break;
            case '4':
                await client.sendMessage(usuario, 'Resumen de Ventas del dia...');
                await resumenVentas(usuario);
                break;
            case '5':
                await client.sendMessage(usuario, 'Saliendo...');
                usuarios.set(usuario, { esperandoSaludo: true, data: null });
                return;

            default:
                await client.sendMessage(usuario, 'Opción no válida, intente nuevamente');
                break;
          }
    await mostrarOperaciones(usuario);
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
  if (data.length > 0){
    return 1;
  }
  else{
    return 0;
  }
}


// Escuchando mensajes

const usuarios = new Map();

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();

//Inicio();

client.on('message', async (msg) => {

    var usu= await get_usuario(msg.from);
    if(usu){
        console.log(usu);
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
        await client.sendMessage(msg.from, 'No está registrado en el sistema, por favor comuníquese con el administrador');
    }

});

schedule.scheduleJob('0 8 1 * *', () => {
    const fechaActualPeru = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
    const fechaPeru = new Date(fechaActualPeru); 

    const mes = fechaPeru.getMonth() + 1; // +1 porque getMonth() devuelve un rango de 0 a 11
    const ano = fechaPeru.getFullYear();

    Enviar_Reporte_Mensual_Mail(mes,ano);
});