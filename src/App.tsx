/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  Camera, 
  Search, 
  House, 
  Sparkles, 
  Image as ImageIcon, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Database, 
  BookOpen, 
  Copy, 
  Check, 
  ChevronRight, 
  Settings, 
  Smartphone, 
  Zap, 
  Info,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// Interface de Producto
interface Producto {
  id: number;
  codigo: string;
  marca: string;
  descripcion: string;
  unidad: string;
  precio: number;
  foto: string;
  stock: number;
}

// Productos de demostración precargados (con códigos EAN reales e imágenes en Unsplash)
const PRODUCTOS_MOCK: Producto[] = [
  { 
    id: 10, 
    codigo: "77935471", 
    marca: "Taragüí", 
    descripcion: "Yerba Mate Taragüí con Palo 1kg", 
    unidad: "Paquete", 
    precio: 2950, 
    foto: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=500&auto=format&fit=crop&q=60", 
    stock: 40 
  },
  { 
    id: 9, 
    codigo: "7790080034561", 
    marca: "Milka", 
    descripcion: "Chocolate Milka Entero Leche 100g", 
    unidad: "Tableta", 
    precio: 1850, 
    foto: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&auto=format&fit=crop&q=60", 
    stock: 35 
  },
  { 
    id: 8, 
    codigo: "7790040112346", 
    marca: "Villavicencio", 
    descripcion: "Agua Mineral Sin Gas Villavicencio 1.5L", 
    unidad: "Botella", 
    precio: 950, 
    foto: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60", 
    stock: 50 
  },
  { 
    id: 7, 
    codigo: "7791293040242", 
    marca: "Rexona", 
    descripcion: "Desodorante Antitranspirante Rexona Clinical 48g", 
    unidad: "Barra", 
    precio: 3100, 
    foto: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60", 
    stock: 20 
  },
  { 
    id: 6, 
    codigo: "7790070411853", 
    marca: "Nescafé", 
    descripcion: "Nescafé Dolca Café Instantáneo Suave 170g", 
    unidad: "Frasco", 
    precio: 4200, 
    foto: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60", 
    stock: 15 
  },
  { 
    id: 5, 
    codigo: "7790238000554", 
    marca: "La Serenísima", 
    descripcion: "Leche Entera Clásica Ultra Pasteurizada 1L", 
    unidad: "Sachet", 
    precio: 1250, 
    foto: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60", 
    stock: 30 
  },
  { 
    id: 4, 
    codigo: "7622300743125", 
    marca: "Oreo", 
    descripcion: "Galletitas Oreo Original Rellenas 117g", 
    unidad: "Paquete", 
    precio: 850, 
    foto: "https://images.unsplash.com/photo-1558961312-503a5508f433?w=500&auto=format&fit=crop&q=60", 
    stock: 25 
  },
  { 
    id: 3, 
    codigo: "7791234567890", 
    marca: "Pringles", 
    descripcion: "Pringles Sabor Papas Original 124g", 
    unidad: "Tubo", 
    precio: 3890, 
    foto: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60", 
    stock: 12 
  },
  { 
    id: 2, 
    codigo: "7790895064012", 
    marca: "Coca-Cola", 
    descripcion: "Coca Cola Sabor Original 500 mL", 
    unidad: "Botella", 
    precio: 1400, 
    foto: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=60", 
    stock: 45 
  },
  { 
    id: 1, 
    codigo: "7790895000430", 
    marca: "Coca-Cola", 
    descripcion: "Coca Cola Sabor Original 2.25 L", 
    unidad: "Botella", 
    precio: 3250, 
    foto: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60", 
    stock: 18 
  }
];

// Helper para interactuar con localStorage de forma segura ante restricciones de iframe o navegación privada
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(key) : null;
    } catch (e) {
      console.warn("localStorage.getItem falló debido a restricciones de iframe o privacidad:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("localStorage.setItem falló debido a restricciones de iframe o privacidad:", e);
    }
  }
};

export default function App() {
  // Estado de navegación: 'inicio' | 'novedades' | 'guia'
  const [activeTab, setActiveTab] = useState<'inicio' | 'novedades' | 'guia'>('inicio');
  
  // URL por defecto provista para la hoja de cálculo de Google
  const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTzEeKZf0E-1nVsl1kjqhCfjYF-zg3LLKRAjqhPWVrtSLlhmG36J7ZHj_DSJJ4-4YhTQ/exec';

  // Estados de datos
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return safeLocalStorage.getItem('apps_script_url') || DEFAULT_SCRIPT_URL;
  });
  const [useLiveSheet, setUseLiveSheet] = useState<boolean>(() => {
    const saved = safeLocalStorage.getItem('use_live_sheet');
    if (saved === null) return true; // Sincronización automática activada por defecto
    return saved === 'true';
  });
  const [manualCode, setManualCode] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isNovedadesLoading, setIsNovedadesLoading] = useState<boolean>(false);
  const [novedades, setNovedades] = useState<Producto[]>(PRODUCTOS_MOCK);
  
  // Detalle del producto seleccionado
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [productNotFound, setProductNotFound] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [isProductLoading, setIsProductLoading] = useState<boolean>(false);

  // Controladores del Escáner Cámara
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isFlashSupported, setIsFlashSupported] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useSimulatedCamera, setUseSimulatedCamera] = useState<boolean>(false);

  // Alertas / Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(appsScriptUrl);

  // Copia de códigos de guía
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [openGuideSection, setOpenGuideSection] = useState<string>('code-gs');

  // Guardar configuración en localStorage
  useEffect(() => {
    safeLocalStorage.setItem('apps_script_url', appsScriptUrl);
    safeLocalStorage.setItem('use_live_sheet', String(useLiveSheet));
  }, [appsScriptUrl, useLiveSheet]);

  // Estado para la instalación de PWA (Instalar App en el celular)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    return safeLocalStorage.getItem('pwa_banner_dismissed') !== 'true';
  });

  const dismissInstallBanner = () => {
    safeLocalStorage.setItem('pwa_banner_dismissed', 'true');
    setShowInstallBanner(false);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (safeLocalStorage.getItem('pwa_banner_dismissed') !== 'true') {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Si la app ya está corriendo instalada, ocultamos el banner por defecto
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Mensaje de ayuda si es iOS o no se ha disparado el prompt nativo
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isiOS) {
        triggerToast("En iPhone/iOS: toca 'Compartir' y luego 'Añadir a pantalla de inicio'.");
        dismissInstallBanner();
      } else {
        triggerToast("Para instalar: abre el menú de opciones del navegador y selecciona 'Instalar aplicación'.");
      }
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        triggerToast("¡Gracias por instalar nuestra aplicación!");
        dismissInstallBanner();
      }
    } catch (err) {
      console.warn("PWA prompt error:", err);
    }
    setDeferredPrompt(null);
  };

  // Cargar novedades al arrancar o cambiar configuración
  useEffect(() => {
    fetchNovedades();
  }, [useLiveSheet, appsScriptUrl]);

  // Mostrar mensaje de toast temporal
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sonido de Escaneo de Código de Barras (Efecto premium por Web Audio API)
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime); // Beep de supermercado
      oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.08);
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
      
      if (navigator.vibrate) {
        navigator.vibrate(60);
      }
    } catch (e) {
      console.log("AudioContext blocked or not supported", e);
    }
  };

  // Buscar Producto (desde buscador manual o escaneo de cámara)
  const handleProductSearch = async (codigo: string) => {
    if (!codigo) return;
    const cleanCode = codigo.trim();
    
    // Preparar interfaz de detalle
    setIsProductLoading(true);
    setProductNotFound(false);
    setSelectedProduct(null);
    setShowProductModal(true);

    if (useLiveSheet && appsScriptUrl) {
      try {
        const fetchUrl = `${appsScriptUrl.includes('?') ? appsScriptUrl + '&' : appsScriptUrl + '?'}action=buscar&codigo=${encodeURIComponent(cleanCode)}`;
        const response = await fetch(fetchUrl);
        const data = await response.json();
        
        if (data && !data.error) {
          setSelectedProduct(data);
        } else {
          setProductNotFound(true);
        }
      } catch (err) {
        console.warn("Información de red (búsqueda en Google Sheets):", err);
        triggerToast("Error de conexión. Mostrando datos Demo.");
        
        // Fallback a mock data para que la app nunca quede colgada si el script del cliente falla
        const localProd = PRODUCTOS_MOCK.find(p => p.codigo === cleanCode);
        if (localProd) {
          setSelectedProduct(localProd);
        } else {
          setProductNotFound(true);
        }
      } finally {
        setIsProductLoading(false);
      }
    } else {
      // Modo simulación local
      setTimeout(() => {
        const localProd = PRODUCTOS_MOCK.find(p => p.codigo === cleanCode);
        setIsProductLoading(false);
        if (localProd) {
          setSelectedProduct(localProd);
        } else {
          setProductNotFound(true);
        }
      }, 600);
    }
  };

  // Cargar Novedades (Últimos 30 productos)
  const fetchNovedades = async () => {
    setIsNovedadesLoading(true);
    if (useLiveSheet && appsScriptUrl) {
      try {
        const fetchUrl = `${appsScriptUrl.includes('?') ? appsScriptUrl + '&' : appsScriptUrl + '?'}action=novedades`;
        const response = await fetch(fetchUrl);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setNovedades(data);
        } else {
          setNovedades(PRODUCTOS_MOCK);
          triggerToast("Respuesta inválida de novedades.");
        }
      } catch (err) {
        console.warn("Información de red (cargando novedades de Google Sheets):", err);
        setNovedades(PRODUCTOS_MOCK);
      } finally {
        setIsNovedadesLoading(false);
      }
    } else {
      // Modo simulación local
      setIsNovedadesLoading(true);
      setTimeout(() => {
        setNovedades(PRODUCTOS_MOCK);
        setIsNovedadesLoading(false);
      }, 500);
    }
  };

  // Arrancar el Escáner de la Cámara
  const startCameraScanner = async () => {
    setIsScanning(true);
    setManualCode('');
    setCameraError(null);
    setUseSimulatedCamera(false);
    
    // Retardo breve para que el elemento div con id='reader' se monte en el DOM
    setTimeout(async () => {
      try {
        const availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras);
        
        if (availableCameras && availableCameras.length > 0) {
          // Intentar seleccionar la cámara trasera
          const backCamera = availableCameras.find(cam => 
            cam.label.toLowerCase().includes('back') || 
            cam.label.toLowerCase().includes('trasera') || 
            cam.label.toLowerCase().includes('environment')
          );
          
          const selectedId = backCamera ? backCamera.id : availableCameras[0].id;
          setActiveCameraId(selectedId);
          
          initiateHtml5Scanner(selectedId);
        } else {
          setCameraError("No se encontraron cámaras físicas de video en este dispositivo.");
          setUseSimulatedCamera(true);
          triggerToast("Iniciando simulador de escaneo...");
        }
      } catch (err: any) {
        console.warn("Acceso a cámaras no disponible (simulador activado):", err?.message || err);
        setCameraError("La cámara no está disponible o el navegador tiene restricciones de acceso.");
        setUseSimulatedCamera(true);
        triggerToast("Iniciando simulador de escaneo...");
      }
    }, 300);
  };

  const initiateHtml5Scanner = (cameraId: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const html5Scanner = new Html5Qrcode("reader");
    scannerRef.current = html5Scanner;

    const config = {
      fps: 15,
      qrbox: (width: number, height: number) => {
        // Caja de escaneo apaisada y optimizada para códigos de barra largos
        return {
          width: Math.min(width * 0.85, 290),
          height: Math.min(height * 0.45, 140)
        };
      },
      aspectRatio: 1.777778 // 16:9 widescreen
    };

    html5Scanner.start(
      cameraId,
      config,
      (decodedText) => {
        // ÉXITO DEL ESCANEO
        playBeepSound();
        stopCameraScanner();
        handleProductSearch(decodedText);
      },
      () => {
        // Fallas de frame silenciosas mientras busca
      }
    ).then(() => {
      // Comprobar soporte de linterna
      setTimeout(() => {
        try {
          if (scannerRef.current) {
            const hasTorch = scannerRef.current.isTorchSupported();
            setIsFlashSupported(hasTorch);
          }
        } catch (e) {
          setIsFlashSupported(false);
        }
      }, 500);
    }).catch(err => {
      console.warn("Fallo al arrancar escáner de cámara (simulador activado):", err);
      setCameraError("Fallo al iniciar el sensor de cámara. Se activó el simulador.");
      setUseSimulatedCamera(true);
    });
  };

  const stopCameraScanner = () => {
    setIsScanning(false);
    setIsFlashOn(false);
    setCameraError(null);
    setUseSimulatedCamera(false);
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        }).catch(() => {
          scannerRef.current = null;
        });
      } catch (e) {
        scannerRef.current = null;
      }
    }
  };

  const handleCameraSwitch = () => {
    if (cameras.length <= 1) {
      triggerToast("No hay más cámaras disponibles");
      return;
    }
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setActiveCameraId(nextCameraId);
    
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        initiateHtml5Scanner(nextCameraId);
      }).catch(() => {
        initiateHtml5Scanner(nextCameraId);
      });
    }
  };

  const handleFlashToggle = async () => {
    if (!scannerRef.current || !isFlashSupported) return;
    try {
      const nextFlashState = !isFlashOn;
      setIsFlashOn(nextFlashState);
      await scannerRef.current.applyVideoConstrains({
        advanced: [{ torch: nextFlashState } as any]
      });
    } catch (err) {
      console.warn("Información de red (Error toggling flash):", err);
      setIsFlashOn(false);
    }
  };

  // Formatear precios como Pesos Argentinos o formato tradicional
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  const copyToClipboard = (text: string, filename: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(filename);
    triggerToast(`¡Código de ${filename} copiado!`);
    setTimeout(() => {
      setCopiedFile(null);
    }, 2000);
  };

  // Código de ejemplo para la guía
  const getCodeSnippet = (filename: string) => {
    switch (filename) {
      case 'Code.gs':
        return `// Pegar en tu archivo Code.gs de Google Apps Script
const HOJA_PRODUCTOS = "PRODUCTOS";
const TIEMPO_CACHE_SEGUNDOS = 600; // 10 min de caché

function doGet(e) {
  const action = e.parameter.action;
  if (action === "buscar") {
    const codigo = e.parameter.codigo;
    const producto = buscarProductoPorCodigo(codigo);
    return crearRespuestaJson(producto || { error: "No encontrado" });
  } 
  if (action === "novedades") {
    return crearRespuestaJson(obtenerNovedadesProductos());
  }
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Consulta de Precios')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

function buscarProductoPorCodigo(codigo) {
  if (!codigo) return null;
  const cache = CacheService.getScriptCache();
  const cached = cache.get("prod_" + codigo);
  if (cached) return JSON.parse(cached);
  
  const productos = leerTodosLosProductos();
  const producto = productos.find(p => String(p.codigo).trim() === String(codigo).trim());
  if (producto) {
    cache.put("prod_" + codigo, JSON.stringify(producto), TIEMPO_CACHE_SEGUNDOS);
    return producto;
  }
  return null;
}

function obtenerNovedadesProductos() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("novedades_list");
  if (cached) return JSON.parse(cached);
  
  const productos = leerTodosLosProductos();
  const novedades = productos.sort((a,b) => b.id - a.id).slice(0, 30);
  cache.put("novedades_list", JSON.stringify(novedades), TIEMPO_CACHE_SEGUNDOS);
  return novedades;
}

function leerTodosLosProductos() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PRODUCTOS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const productos = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const prod = {};
    headers.forEach((header, idx) => {
      let val = row[idx];
      if (header === "id") prod.id = Number(val);
      else if (header === "codigo") prod.codigo = String(val).trim();
      else if (header === "marca") prod.marca = String(val);
      else if (header === "descripcion") prod.descripcion = String(val);
      else if (header === "unid.") prod.unidad = String(val);
      else if (header === "precio") prod.precio = Number(val);
      else if (header === "foto") prod.foto = String(val);
      else if (header === "stock") prod.stock = Number(val);
    });
    if (prod.codigo) productos.push(prod);
  }
  return productos;
}`;
      case 'Index.html':
        return `<!-- Estructura principal Index.html del Apps Script -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
  <?!= HtmlService.createHtmlOutputFromFile('Styles').getContent(); ?>
</head>
<body class="bg-[#F5F5F7] font-sans">
  <div class="max-w-md mx-auto bg-white min-h-screen relative pb-24 shadow-md">
    <!-- El html completo incluye Scanner, Novedades, Styles y Scripts -->
  </div>
</body>
</html>`;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex justify-center items-center py-0 md:py-10 px-0 md:px-4 select-none relative font-sans overflow-x-hidden">
      
      {/* Visualización de Notificación Toast */}
      {toastMessage && (
        <div id="toast" className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-full shadow-xl flex items-center gap-2 animate-fade-in transition-all">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CONTENEDOR MÓVIL (Borde estilo Smartphone para simulación en computadoras) */}
      <div className="w-full max-w-md h-screen md:h-[880px] bg-white md:rounded-[36px] overflow-hidden shadow-2xl relative flex flex-col md:border-[10px] md:border-neutral-800">
        
        {/* Cabecera / Barra superior simulada en móvil */}
        <header className="bg-white border-b border-neutral-100 py-4 px-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 leading-none">NUEVO ESTILO HOME</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${useLiveSheet ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                <span className="text-[9px] font-semibold text-neutral-500">
                  Vicario Segura N° 1063
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Ajustes de Google Sheet */}
            <button 
              onClick={() => {
                setTempUrl(appsScriptUrl);
                setShowSettingsModal(true);
              }}
              className={`p-2 rounded-xl transition-colors ${useLiveSheet ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-50 text-neutral-500 hover:text-neutral-800'}`}
              title="Configuración de Base de Datos"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto pb-24 bg-[#F5F5F7]">
          
          {/* VISTA 1: INICIO (Escanear / Buscar) */}
          {activeTab === 'inicio' && (
            <div className="p-6 flex flex-col h-full animate-fade-in" id="inicio-view">
              
              {/* Presentación */}
              <div className="flex flex-col items-center text-center mt-4 mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[22px] flex items-center justify-center shadow-sm mb-4">
                  <Barcode className="w-8 h-8 text-blue-600" style={{ strokeWidth: '1.5px' }} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-900">Consulta de Precios</h2>
                <p className="text-xs text-neutral-400 mt-1 max-w-[250px]">
                  Escanea el código de barras de cualquier producto para ver su precio, unidad y stock al instante.
                </p>
              </div>

              {/* Banner de Instalación PWA */}
              {showInstallBanner && (
                <div className="mb-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-4.5 shadow-xl shadow-blue-500/10 relative overflow-hidden flex flex-col gap-3.5 border border-blue-500/20">
                  {/* Círculo decorativo de fondo */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
                  
                  <button 
                    onClick={dismissInstallBanner}
                    className="absolute top-2.5 right-2.5 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl shrink-0 border border-white/10 shadow-inner">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold tracking-tight">Precios Vicario en tu Celular</h3>
                      <p className="text-[10px] text-blue-100/90 mt-0.5 leading-tight">
                        Accede al instante desde tu pantalla de inicio.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleInstallApp}
                      className="flex-1 bg-white text-blue-700 hover:bg-neutral-50 text-sm font-extrabold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    >
                      <span>Instalar</span>
                    </button>
                    <button
                      onClick={dismissInstallBanner}
                      className="bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-white/5"
                    >
                      Ocultar
                    </button>
                  </div>
                </div>
              )}

              {/* Botón de Escaneo de Cámara */}
              <button 
                id="btn-abrir-escaner"
                onClick={startCameraScanner}
                className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200/80 border-2 border-dashed border-blue-200 rounded-[32px] flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
              >
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-neutral-800">Escanear Código</span>
                <span className="text-[11px] text-blue-600 font-medium mt-1">Usar cámara del celular</span>
              </button>

              {/* Divisor */}
              <div className="relative flex py-2 items-center my-6">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                  o ingresar manualmente
                </span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              {/* Input Manual de Código */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-neutral-400">
                    <Barcode className="w-5 h-5" />
                  </span>
                  <input 
                    type="text" 
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej: 7790895000430" 
                    className="w-full pl-12 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleProductSearch(manualCode);
                      }
                    }}
                  />
                  {manualCode && (
                    <button 
                      onClick={() => setManualCode('')}
                      className="absolute right-4 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button 
                  id="btn-buscar"
                  onClick={() => handleProductSearch(manualCode)}
                  disabled={!manualCode.trim()}
                  className={`w-full font-bold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    manualCode.trim() 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 active:scale-[0.99]' 
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Buscar Producto
                </button>
              </div>
            </div>
          )}

          {/* VISTA 2: NOVEDADES (Últimos cargados) */}
          {activeTab === 'novedades' && (
            <div className="p-6 animate-fade-in" id="novedades-view">
              
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    Novedades
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      {novedades.length}
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Últimos productos cargados en Google Sheets</p>
                </div>
                <button 
                  onClick={fetchNovedades}
                  disabled={isNovedadesLoading}
                  className={`p-2.5 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 text-neutral-600 transition-all cursor-pointer ${isNovedadesLoading ? 'animate-spin text-blue-500' : ''}`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Skeletons Loader de Novedades */}
              {isNovedadesLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="bg-white border border-neutral-100 rounded-2xl p-3 flex flex-col animate-pulse">
                      <div className="w-full aspect-square bg-neutral-100 rounded-xl mb-3"></div>
                      <div className="h-3.5 bg-neutral-100 rounded w-1/3 mb-2"></div>
                      <div className="h-5 bg-neutral-100 rounded w-5/6 mb-4"></div>
                      <div className="h-6 bg-neutral-100 rounded w-2/3 mt-auto"></div>
                    </div>
                  ))}
                </div>
              ) : novedades.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center mb-3">
                    <Package className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-700">Catálogo vacío</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">No se encontraron productos registrados en la base de datos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {novedades.map(prod => (
                    <div 
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setProductNotFound(false);
                        setShowProductModal(true);
                      }}
                      className="bg-white border border-neutral-200/60 rounded-2xl p-3 flex flex-col hover:border-blue-100 transition-all cursor-pointer active:scale-[0.98] shadow-sm group"
                    >
                      <div className="w-full aspect-square bg-neutral-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                        {prod.foto ? (
                          <img 
                            src={prod.foto} 
                            alt={prod.descripcion} 
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-neutral-300 flex flex-col items-center justify-center">
                            <ImageIcon className="w-8 h-8" style={{ strokeWidth: 1 }} />
                            <span className="text-[9px] text-neutral-400 mt-1">Sin foto</span>
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-neutral-900/50 backdrop-blur-sm text-white font-extrabold text-[8px] tracking-wider px-2 py-0.5 rounded-full uppercase">
                          {prod.marca || 'S/M'}
                        </span>
                      </div>

                      <h3 className="text-xs font-semibold text-neutral-800 line-clamp-2 h-8 leading-tight mb-1" title={prod.descripcion}>
                        {prod.descripcion}
                      </h3>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[9px] text-neutral-400 font-medium">Contenido: {prod.unidad || '-'}</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-50">
                        <span className="text-sm font-extrabold text-[#34A853]">
                          {formatCurrency(prod.precio)}
                        </span>
                        <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                          Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* VISTA 3: GUÍA DE CONFIGURACIÓN DE GOOGLE SHEETS */}
          {activeTab === 'guia' && (
            <div className="p-6 animate-fade-in" id="guia-view">
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Guía de Integración
                </h2>
                <p className="text-xs text-neutral-400 mt-1">Conecta tu propia hoja de Google Sheets en 4 pasos</p>
              </div>

              {/* Paso 1 */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">1</div>
                  <h3 className="text-xs font-bold text-neutral-800">Crea tu Google Sheet</h3>
                </div>
                <p className="text-xs text-neutral-500 pl-9 leading-relaxed">
                  Crea una nueva hoja de cálculo en Google Drive y renombra la primera pestaña a <strong className="text-neutral-700">PRODUCTOS</strong>.
                </p>
                <div className="mt-2.5 ml-9 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase mb-1">Columnas de Fila 1 (Cabeceras exactas):</span>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {['ID', 'Codigo', 'Marca', 'Descripcion', 'Unid.', 'Precio', 'Foto', 'Stock'].map(h => (
                      <span key={h} className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded font-bold text-neutral-700">{h}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">2</div>
                  <h3 className="text-xs font-bold text-neutral-800">Crea el Apps Script</h3>
                </div>
                <p className="text-xs text-neutral-500 pl-9 leading-relaxed mb-3">
                  Ve a <strong className="text-neutral-700">Extensiones &rarr; Apps Script</strong> y pega el código backend del archivo <code className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[11px] font-mono">Code.gs</code>.
                </p>
                
                {/* Selector de códigos copyable */}
                <div className="ml-9 border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200 flex justify-between items-center">
                    <span className="text-[11px] font-mono font-bold text-neutral-600">Code.gs</span>
                    <button 
                      onClick={() => copyToClipboard(getCodeSnippet('Code.gs'), 'Code.gs')}
                      className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedFile === 'Code.gs' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-medium">{copiedFile === 'Code.gs' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-neutral-900 text-neutral-300 text-[10px] font-mono max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {getCodeSnippet('Code.gs')}
                  </pre>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">3</div>
                  <h3 className="text-xs font-bold text-neutral-800">Publica como Web App</h3>
                </div>
                <p className="text-xs text-neutral-500 pl-9 leading-relaxed">
                  Haz clic en <strong className="text-neutral-700">Implementar &rarr; Nueva implementación</strong>.
                  Selecciona tipo: <strong className="text-neutral-700">Aplicación web</strong>.
                  Configura: <br />
                  • <strong className="text-neutral-700">Ejecutar como:</strong> Tu usuario<br />
                  • <strong className="text-neutral-700">Quién tiene acceso:</strong> Cualquiera
                </p>
                <div className="mt-2 ml-9 p-2.5 bg-blue-50 border border-blue-100 text-[11px] text-blue-800 rounded-xl">
                  Copia la URL generada (debe terminar en <code className="font-mono">/exec</code>).
                </div>
              </div>

              {/* Paso 4 */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">4</div>
                  <h3 className="text-xs font-bold text-neutral-800">Pega la URL en esta Web App</h3>
                </div>
                <p className="text-xs text-neutral-500 pl-9 leading-relaxed mb-3">
                  Toca el botón de engranaje (<Settings className="w-3.5 h-3.5 inline mx-0.5" />) arriba a la derecha, pega la URL que copiaste de Apps Script y activa la casilla "Sincronizar en Vivo".
                </p>
                <button 
                  onClick={() => {
                    setTempUrl(appsScriptUrl);
                    setShowSettingsModal(true);
                  }}
                  className="ml-9 w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-blue-100 hover:bg-blue-700 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurar URL Ahora
                </button>
              </div>

            </div>
          )}

        </main>

        {/* REPRODUCTOR DE CÁMARA (ZONA ESCÁNER SUPERPUESTA) */}
        {isScanning && (
          <div id="scanner-container" className="absolute inset-0 bg-neutral-950 flex flex-col justify-between z-40 animate-fade-in">
            {/* Header Escáner */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-neutral-800 text-blue-400 rounded-xl">
                  <Camera className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white leading-none">Lector de Códigos</h2>
                  <span className="text-[9px] text-neutral-400 mt-1 block">Apunta hacia el código de barras</span>
                </div>
              </div>
              <button 
                onClick={stopCameraScanner}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewport de Cámara o Simulación */}
            <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-neutral-950">
              
              {!useSimulatedCamera ? (
                <>
                  <div id="interactive-scanner" className="w-full h-full max-w-sm flex items-center justify-center relative">
                    {/* Elemento de renderizado para Html5Qrcode */}
                    <div id="reader" className="w-full h-full [&>div]:border-none [&_video]:object-cover"></div>
                  </div>

                  {/* Guía Visual Superpuesta */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center p-6">
                    
                    {/* Caja / Frame central de foco */}
                    <div className="w-[280px] aspect-[2/1.2] border-2 border-dashed border-blue-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(10,10,10,0.65)] flex justify-center items-center">
                      
                      {/* Esquinas sólidas */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-lg"></div>

                      {/* Línea Láser Animada */}
                      <div className="w-[90%] h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] absolute animate-laser"></div>
                    </div>

                    <p className="text-[10px] font-bold text-blue-200 mt-6 px-3 py-1.5 bg-neutral-900/90 rounded-full backdrop-blur-sm tracking-wider uppercase">
                      EAN-13, EAN-8, UPC, Code-128
                    </p>
                  </div>
                </>
              ) : (
                /* VISTA SIMULACIÓN DE ESCANEO */
                <div className="absolute inset-0 flex flex-col justify-between p-6 overflow-y-auto no-scrollbar bg-neutral-950 text-white">
                  
                  {/* Info de Error & Simulación */}
                  <div className="mt-4 mb-4 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      Simulador Integrado
                    </div>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                      {cameraError || "Dispositivo de video no encontrado."}
                    </p>
                  </div>

                  {/* Escáner de Holograma Animado */}
                  <div className="relative w-full aspect-[2/1] border border-neutral-800 rounded-2xl flex flex-col justify-center items-center bg-neutral-900/50 overflow-hidden shrink-0">
                    {/* Rejilla de fondo de tecnología */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    {/* Código de barras del holograma */}
                    <div className="z-10 flex flex-col items-center gap-2">
                      <Barcode className="w-20 h-10 text-neutral-600 animate-pulse-slow" />
                      <span className="text-[9px] font-mono tracking-widest text-neutral-500">SIMULANDO LECTOR DE BARRAS</span>
                    </div>

                    {/* Escáner de línea láser roja */}
                    <div className="absolute inset-x-0 h-[1.5px] bg-red-500 shadow-[0_0_10px_#ef4444] animate-laser"></div>
                  </div>



                  {/* Buscador de código rápido manual integrado en el escáner */}
                  <div className="w-full max-w-sm mx-auto pt-2 border-t border-neutral-900">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block text-center mb-2">
                      O digita un código para simular la lectura:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: 77935471"
                        id="sim-code-input"
                        className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.currentTarget as HTMLInputElement).value;
                            if (val.trim()) {
                              playBeepSound();
                              stopCameraScanner();
                              handleProductSearch(val);
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sim-code-input') as HTMLInputElement)?.value;
                          if (val && val.trim()) {
                            playBeepSound();
                            stopCameraScanner();
                            handleProductSearch(val);
                          } else {
                            triggerToast("Por favor ingresa un código");
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Simular
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer Escáner */}
            <div className="px-6 py-6 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={handleFlashToggle}
                  disabled={!isFlashSupported}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isFlashSupported 
                      ? isFlashOn 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                      : 'bg-neutral-800 text-neutral-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{isFlashOn ? 'Apagar Luz' : 'Encender Luz'}</span>
                </button>

                <button 
                  onClick={handleCameraSwitch}
                  disabled={cameras.length <= 1}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    cameras.length > 1 
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                      : 'bg-neutral-800 text-neutral-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Cambiar Cámara</span>
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 text-center">
                * Si la cámara no inicia, asegúrate de habilitar permisos o usa el buscador manual.
              </p>
            </div>
          </div>
        )}

        {/* MODAL DETALLE DE PRODUCTO */}
        {showProductModal && (
          <div className="absolute inset-0 bg-neutral-900/40 flex flex-col justify-end z-30 animate-fade-in-up">
            <div className="w-full bg-white rounded-t-[32px] overflow-hidden max-h-[92%] flex flex-col relative shadow-2xl">
              
              {/* Barra de arrastre / Cierre superior */}
              <div className="w-full py-3.5 flex justify-center items-center relative border-b border-neutral-100 shrink-0">
                <div className="w-12 h-1 bg-neutral-200 rounded-full"></div>
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="absolute right-4 p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                
                {/* Caso 1: Buscando/Cargando */}
                {isProductLoading && (
                  <div className="animate-pulse space-y-6">
                    <div className="w-full aspect-[4/3] bg-neutral-100 rounded-[24px]"></div>
                    <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                    <div className="h-6 bg-neutral-100 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                    <div className="h-14 bg-neutral-100 rounded-2xl"></div>
                    <div className="h-10 bg-neutral-100 rounded-2xl"></div>
                  </div>
                )}

                {/* Caso 2: No Encontrado */}
                {productNotFound && !isProductLoading && (
                  <div className="py-8 flex flex-col items-center text-center animate-fade-in">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 shadow-sm">
                      <AlertCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">No se encontró el producto</h3>
                    <p className="text-xs text-neutral-400 mt-2 max-w-[240px] leading-relaxed">
                      El código ingresado o escaneado no se encuentra registrado en la hoja de Google Sheets.
                    </p>
                    <button 
                      onClick={() => {
                        setShowProductModal(false);
                        startCameraScanner();
                      }}
                      className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-md shadow-blue-100 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Escanear nuevamente
                    </button>
                  </div>
                )}

                {/* Caso 3: Producto Encontrado */}
                {selectedProduct && !isProductLoading && (
                  <div className="animate-fade-in">
                    
                    {/* Imagen del Producto (~40% de alto aproximado) */}
                    <div className="w-full aspect-[4/3] bg-neutral-50 border border-neutral-100 rounded-[24px] overflow-hidden mb-6 flex items-center justify-center relative shadow-inner">
                      {selectedProduct.foto ? (
                        <img 
                          src={selectedProduct.foto} 
                          alt={selectedProduct.descripcion} 
                          className="w-full h-full object-contain p-4 transition-opacity duration-300"
                        />
                      ) : (
                        <div className="text-neutral-300 flex flex-col items-center justify-center">
                          <ImageIcon className="w-14 h-14" style={{ strokeWidth: 1 }} />
                          <span className="text-xs text-neutral-400 mt-2">Sin foto registrada</span>
                        </div>
                      )}
                    </div>

                    {/* Marca Tag */}
                    <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                      {selectedProduct.marca || 'Sin Marca'}
                    </span>

                    {/* Descripción */}
                    <h2 className="text-lg font-bold text-neutral-900 leading-snug mb-1">
                      {selectedProduct.descripcion}
                    </h2>

                    {/* Unidad */}
                    <p className="text-xs text-neutral-400 mb-6 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Contenido:</span> 
                      <strong className="font-semibold text-neutral-700 ml-1">
                        {selectedProduct.unidad || 'Unidad estándar'}
                      </strong>
                    </p>

                    {/* Precio Destacado */}
                    <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl mb-5">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1 block">
                        Precio al Público
                      </span>
                      <div className="text-3xl font-extrabold text-[#34A853] tracking-tight flex items-baseline">
                        {formatCurrency(selectedProduct.precio)}
                      </div>
                    </div>

                    {/* Stock disponible con semáforo inteligente */}
                    <div className="flex items-center gap-3.5 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      {selectedProduct.stock <= 0 ? (
                        <>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 bg-rose-50 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Disponibilidad</span>
                            <span className="text-sm font-bold text-rose-600">Agotado / Sin stock</span>
                          </div>
                        </>
                      ) : selectedProduct.stock <= 5 ? (
                        <>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-500 bg-amber-50 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Disponibilidad</span>
                            <span className="text-sm font-bold text-amber-600">{selectedProduct.stock} unidades (¡Crítico!)</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Disponibilidad</span>
                            <span className="text-sm font-bold text-neutral-800">{selectedProduct.stock} unidades</span>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* MODAL CONFIGURACIÓN / SETTINGS DE GOOGLE SHEETS */}
        {showSettingsModal && (
          <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center p-5 z-40 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in flex flex-col">
              
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-neutral-700" />
                  <h3 className="text-sm font-bold text-neutral-900">Configuración Base de Datos</h3>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1.5">Sincronización en Vivo</label>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-800">Usar Google Sheets</span>
                      <span className="text-[10px] text-neutral-400 leading-tight">Activar conexión directa con tu Sheet</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useLiveSheet}
                        onChange={(e) => {
                          if (e.target.checked && !tempUrl.trim()) {
                            triggerToast("Ingresa primero la URL de tu Apps Script");
                            return;
                          }
                          setUseLiveSheet(e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-neutral-600 block">Google Apps Script Web App URL</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTempUrl(DEFAULT_SCRIPT_URL);
                        triggerToast("Cargada URL oficial predeterminada");
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      Usar predeterminada
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                  <span className="text-[9px] text-neutral-400 mt-1.5 leading-relaxed block">
                    Sincronizada con la hoja oficial. Si la cambias, puedes regresar a la predeterminada con un toque.
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const cleanUrl = tempUrl.trim();
                    setAppsScriptUrl(cleanUrl);
                    if (!cleanUrl) {
                      setUseLiveSheet(false);
                    }
                    setShowSettingsModal(false);
                    triggerToast("Configuración guardada con éxito");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MENÚ DE NAVEGACIÓN INFERIOR (Pestañas fijas) */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200/80 px-8 py-3 flex justify-around items-center z-10">
          
          <button 
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'inicio' ? 'text-blue-600 font-bold' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'inicio' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-neutral-400'}`}>
              <House className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide font-semibold">Inicio</span>
          </button>

          <button 
            onClick={() => setActiveTab('novedades')}
            className={`flex flex-col items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'novedades' ? 'text-blue-600 font-bold' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'novedades' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-neutral-400'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide font-semibold">Novedades</span>
          </button>

        </nav>

      </div>
    </div>
  );
}
