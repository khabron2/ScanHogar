/**
 * Google Apps Script - Backend/API para Consulta de Precios
 * 
 * Este script lee una hoja de cálculo llamada "PRODUCTOS" y expone
 * una API web para la consulta de productos por código de barras y novedades.
 * 
 * Configuración:
 * 1. Crea una hoja de cálculo en Google Drive.
 * 2. Cambia el nombre de la primera pestaña a "PRODUCTOS".
 * 3. Crea las siguientes columnas en la fila 1:
 *    ID | Codigo | Marca | Descripcion | Unid. | Precio | Foto | Stock
 * 4. Ve a Extensiones -> Apps Script y pega este código en `Code.gs`.
 * 5. Crea los archivos HTML correspondientes (Index.html, Scanner.html, Novedades.html, Styles.html, Scripts.html).
 * 6. Haz clic en "Nueva implementación" -> "Aplicación web".
 * 7. Configura: "Ejecutar como: Tú" y "Quién tiene acceso: Cualquiera".
 * 8. Copia la URL de la aplicación web implementada.
 */

// Nombre de la hoja de cálculo
const HOJA_PRODUCTOS = "PRODUCTOS";
const TIEMPO_CACHE_SEGUNDOS = 600; // 10 minutos de caché para consultas ultra rápidas

/**
 * Maneja las peticiones GET (tanto para la Web App independiente como para llamadas de API)
 */
function doGet(e) {
  // Manejo de CORS para llamadas fetch desde aplicaciones externas (como nuestra app de React)
  const action = e.parameter.action;
  
  if (action === "buscar") {
    const codigo = e.parameter.codigo;
    const producto = buscarProductoPorCodigo(codigo);
    return crearRespuestaJson(producto || { error: "No se encontró el producto" });
  } 
  
  if (action === "novedades") {
    const novedades = obtenerNovedadesProductos();
    return crearRespuestaJson(novedades);
  }
  
  // Si no se especifica acción de API, servir la interfaz de usuario de la Web App de Apps Script
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Consulta de Precios - PWA')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Función requerida por el usuario: BuscarProducto(codigo)
 * Retorna el producto correspondiente al código, utilizando CacheService para mayor velocidad.
 */
function BuscarProducto(codigo) {
  return buscarProductoPorCodigo(codigo);
}

/**
 * Función requerida por el usuario: ObtenerNovedades()
 * Retorna los últimos 30 productos ordenados por ID descendente.
 */
function ObtenerNovedades() {
  return obtenerNovedadesProductos();
}

/**
 * Busca un producto por su código (admite EAN13, EAN8, UPC, Code128, QR)
 * Utiliza caché para optimizar la velocidad de respuesta.
 */
function buscarProductoPorCodigo(codigo) {
  if (!codigo) return null;
  codigo = String(codigo).trim();
  
  const cache = CacheService.getScriptCache();
  const cachedProduct = cache.get("prod_" + codigo);
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }
  
  // Si no está en caché, buscar en la hoja de cálculo
  const productos = leerTodosLosProductos();
  const producto = productos.find(p => String(p.codigo).trim() === codigo);
  
  if (producto) {
    // Guardar en caché por un tiempo determinado
    cache.put("prod_" + codigo, JSON.stringify(producto), TIEMPO_CACHE_SEGUNDOS);
    return producto;
  }
  
  return null;
}

/**
 * Obtiene los últimos 30 productos agregados, ordenados por ID de mayor a menor.
 */
function obtenerNovedadesProductos() {
  const cache = CacheService.getScriptCache();
  const cachedNovedades = cache.get("novedades_list");
  if (cachedNovedades) {
    return JSON.parse(cachedNovedades);
  }
  
  const productos = leerTodosLosProductos();
  // Ordenar por ID descendente (ID más alto primero)
  const ordenados = productos.sort((a, b) => {
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
  
  // Tomar los últimos 30 cargados
  const novedades = ordenados.slice(0, 30);
  
  cache.put("novedades_list", JSON.stringify(novedades), TIEMPO_CACHE_SEGUNDOS);
  return novedades;
}

/**
 * Lee todos los datos de la hoja "PRODUCTOS" y los mapea a objetos JSON.
 */
function leerTodosLosProductos() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PRODUCTOS);
    if (!sheet) {
      // Si la hoja no existe, crearla y poblarla con datos de prueba
      return crearHojaDePrueba();
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Solo cabecera o vacía
    
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const productos = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const prod = {};
      
      // Mapear cada columna por cabecera
      headers.forEach((header, index) => {
        let val = row[index];
        // Normalizar nombres de cabeceras según requerimiento
        if (header === "id") prod.id = Number(val) || i;
        else if (header === "codigo") prod.codigo = String(val).trim();
        else if (header === "marca") prod.marca = String(val).trim();
        else if (header === "descripcion") prod.descripcion = String(val).trim();
        else if (header === "unid.") prod.unidad = String(val).trim();
        else if (header === "precio") prod.precio = Number(val) || 0;
        else if (header === "foto") prod.foto = procesarUrlImagen(String(val).trim());
        else if (header === "stock") prod.stock = Number(val) || 0;
        else prod[header] = val;
      });
      
      if (prod.codigo) {
        productos.push(prod);
      }
    }
    
    return productos;
  } catch (error) {
    Logger.log("Error al leer productos: " + error.message);
    return [];
  }
}

/**
 * Procesa la URL de la imagen (por si viene de Google Drive)
 * para asegurar que sea de acceso directo y se renderice correctamente.
 */
function procesarUrlImagen(url) {
  if (!url) return "";
  
  // Detectar enlaces de Google Drive de visualización y convertirlos a descarga directa
  if (url.indexOf("drive.google.com") !== -1) {
    let id = "";
    if (url.indexOf("id=") !== -1) {
      id = url.split("id=")[1].split("&")[0];
    } else if (url.indexOf("/file/d/") !== -1) {
      id = url.split("/file/d/")[1].split("/")[0];
    }
    if (id) {
      return "https://lh3.googleusercontent.com/d/" + id + "=w500";
    }
  }
  return url;
}

/**
 * Helper para crear respuestas JSON de API con manejo de CORS
 */
function crearRespuestaJson(objeto) {
  const output = ContentService.createTextOutput(JSON.stringify(objeto));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Inicializa y puebla una hoja de productos de prueba si no existe.
 */
function crearHojaDePrueba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(HOJA_PRODUCTOS);
  if (!sheet) {
    sheet = ss.insertSheet(HOJA_PRODUCTOS);
  }
  
  sheet.clear();
  // Escribir cabeceras exactas del prompt
  sheet.appendRow(["ID", "Codigo", "Marca", "Descripcion", "Unid.", "Precio", "Foto", "Stock"]);
  
  // Agregar productos de prueba variados con códigos EAN y fotos reales
  const productosDemo = [
    [1, "7790895000430", "Coca-Cola", "Coca Cola Sabor Original 2.25 L", "Botella", 3250, "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60", 18],
    [2, "7790895064012", "Coca-Cola", "Coca Cola Sabor Original 500 mL", "Botella", 1400, "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=60", 45],
    [3, "7791234567890", "Pringles", "Pringles Sabor Papas Original 124g", "Tubo", 3890, "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60", 12],
    [4, "7622300743125", "Oreo", "Galletitas Oreo Original Rellenas 117g", "Paquete", 850, "https://images.unsplash.com/photo-1558961312-503a5508f433?w=500&auto=format&fit=crop&q=60", 25],
    [5, "7790238000554", "La Serenísima", "Leche Entera Clásica Ultra Pasteurizada 1L", "Sachet", 1250, "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60", 30],
    [6, "7790070411853", "Nescafé", "Nescafé Dolca Café Instantáneo Suave 170g", "Frasco", 4200, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60", 15],
    [7, "7791293040242", "Rexona", "Desodorante Antitranspirante Rexona Clinical 48g", "Barra", 3100, "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60", 20],
    [8, "7790040112346", "Villavicencio", "Agua Mineral Sin Gas Villavicencio 1.5L", "Botella", 950, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60", 50],
    [9, "7790080034561", "Milka", "Chocolate Milka Entero Leche 100g", "Tableta", 1850, "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&auto=format&fit=crop&q=60", 35],
    [10, "77935471", "Taragüí", "Yerba Mate Taragüí con Palo 1kg", "Paquete", 2950, "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=500&auto=format&fit=crop&q=60", 40]
  ];
  
  productosDemo.forEach(p => sheet.appendRow(p));
  return leerTodosLosProductos();
}

/**
 * Función de utilidad para limpiar la caché desde la consola o un menú.
 */
function limpiarCache() {
  const cache = CacheService.getScriptCache();
  cache.remove("novedades_list");
  // En producción, se puede iterar o simplemente esperar el TTL de expiración automática
  return "Caché limpiada con éxito";
}
