import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnjrbwT3q3f0pMbx60jFU4d_FQBTjumN4",
  authDomain: "wrapsv2.firebaseapp.com",
  projectId: "wrapsv2",
  storageBucket: "wrapsv2.firebasestorage.app",
  messagingSenderId: "757507659564",
  appId: "1:757507659564:web:283dd8c296904a9ae3fe89",
  measurementId: "G-RD68EC6RXG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "pos_data", "wraps_store");

window.db = db;
window.docRef = docRef;
window.setDoc = setDoc;
window.isInitialLoad = true;

onSnapshot(docRef, (docSnap) => {
  const ind = document.getElementById("indicadorEstado");
  if (docSnap.exists()) {
    const cloudData = docSnap.data();
    if (window.isInitialLoad || (cloudData && cloudData.lotes)) {
      window.estadoApp = cloudData;
      window.isInitialLoad = false;
    }
    if (ind) {
      ind.textContent = "☁️ Nube OK";
      ind.className = "bg-emerald-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase";
    }
  } else {
    if (ind) {
      ind.textContent = "⚠️ Sin Datos";
      ind.className = "bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase";
    }
    guardarDatosLocales();
  }
  renderizarSelectorLotes();
  renderizarTodo();
}, (error) => {
  const ind = document.getElementById("indicadorEstado");
  if (ind) {
    ind.textContent = "Offline";
    ind.className = "bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase";
  }
});

const VARIEDADES = ["Carne", "Pollo", "Bondiola", "Caprese"];
let variedadSeleccionada = "Carne";
let variedadCarritoSeleccionada = "Carne";
let tipoMasaSimple = "Común";
let tipoMasaCarrito = "Común";
let metodoPagoSeleccionado = "Efectivo";
let metodoPagoWebSeleccionado = "Efectivo";
let modoRegistro = "simple";
let tipoEntregaSeleccionado = "Retiro";
let carritoActual = [];
let clientesDesplegados = {};
let clientesEntregadosDesplegados = {};
let clientesProgramadosDesplegados = {};
let diasDesplegados = {};
let isAdmin = false;
let pedidoCliente = {}; 

// Estado temporal para la edición avanzada de ítems en modales de cliente
window.currentEditingItems = [];

window.estadoApp = {
  lotes: [
    {
      id: "Lote Octubre 2026",
      activo: true,
      precioVenta: 5700,
      precioCompra: 3050,
      stockInicial: { 
        Carne: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Pollo: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Bondiola: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Caprese: { comun: 10, integral: 10, comunProx: false, integralProx: false } 
      }
    }
  ],
  ventas: [],
  imagen1: "https://i.postimg.cc/d1LTcSj6/wrap1.jpg",
  imagen2: "https://i.postimg.cc/NM5rvPkb/wrap2.jpg"
};

function getStockComun(lote, variedad) {
  if (!lote.stockInicial || !lote.stockInicial[variedad]) return 0;
  if (typeof lote.stockInicial[variedad] === 'number') return Math.floor(lote.stockInicial[variedad] / 2);
  return lote.stockInicial[variedad].comun || 0;
}

function getStockIntegral(lote, variedad) {
  if (!lote.stockInicial || !lote.stockInicial[variedad]) return 0;
  if (typeof lote.stockInicial[variedad] === 'number') return Math.ceil(lote.stockInicial[variedad] / 2);
  return lote.stockInicial[variedad].integral || 0;
}

function isComunProximamente(lote, variedad) {
  if (!lote.stockInicial || !lote.stockInicial[variedad]) return false;
  if (typeof lote.stockInicial[variedad] === 'number') return (lote.comunProximamente === true);
  return lote.stockInicial[variedad].comunProx === true || lote.comunProximamente === true;
}

function isIntegralProximamente(lote, variedad) {
  if (!lote.stockInicial || !lote.stockInicial[variedad]) return false;
  if (typeof lote.stockInicial[variedad] === 'number') return (lote.integralProximamente === true);
  return lote.stockInicial[variedad].integralProx === true || lote.integralProximamente === true;
}

function toggleDropdownAdmin() {
  const menu = document.getElementById("dropdownAdminMenu");
  menu.classList.toggle("hidden");
}
window.toggleDropdownAdmin = toggleDropdownAdmin;

function cerrarDropdownAdmin() {
  document.getElementById("dropdownAdminMenu").classList.add("hidden");
}
window.cerrarDropdownAdmin = cerrarDropdownAdmin;

window.addEventListener("click", function(e) {
  const container = document.getElementById("dropdownAdminContainer");
  if (container && !container.contains(e.target)) {
    cerrarDropdownAdmin();
  }
});

function accesoRapidoSecreto() {
  if (!isAdmin) {
    const panel = document.getElementById("panelLoginCelda");
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      document.getElementById("inputUserAdmin").focus();
    }
  }
}
window.accesoRapidoSecreto = accesoRapidoSecreto;

window.addEventListener("hashchange", () => {
  verificarModoPorURL();
});

function verificarModoPorURL() {
  const hash = window.location.hash;
  if (hash === "#admin") {
    if (isAdmin) {
      activarModoAdminDirecto();
    } else {
      activarModoPublico();
      document.getElementById("panelLoginCelda").classList.remove("hidden");
    }
  } else {
    activarModoPublico();
  }
}

function activarModoAdminDirecto() {
  isAdmin = true;
  document.getElementById("panelLoginCelda").classList.add("hidden");
  document.getElementById("dropdownAdminContainer").classList.remove("hidden");
  document.getElementById("btnWhatsappFlotante").classList.add("hidden");
  document.getElementById("tituloHeader").textContent = "Panel de Administración";
  document.getElementById("subtituloHeader").textContent = "Control total de ventas, caja y stock";
  document.getElementById("vistaPrivadaAdmin").classList.remove("hidden");
  document.getElementById("seccionControlLote").classList.remove("hidden");
  document.getElementById("vistaPublicaStock").classList.add("hidden");
  renderizarTodo();
}

function activarModoPublico() {
  isAdmin = false;
  document.getElementById("panelLoginCelda").classList.add("hidden");
  document.getElementById("dropdownAdminContainer").classList.add("hidden");
  document.getElementById("btnWhatsappFlotante").classList.remove("hidden");
  document.getElementById("tituloHeader").textContent = "WRAPS - Stock Disponible";
  document.getElementById("subtituloHeader").textContent = "Consulta el stock disponible en tiempo real";
  document.getElementById("vistaPrivadaAdmin").classList.add("hidden");
  document.getElementById("seccionControlLote").classList.add("hidden");
  document.getElementById("vistaPublicaStock").classList.remove("hidden");
  renderizarStockPublico();
}

function procesarLogin() {
  const usuarioInput = document.getElementById("inputUserAdmin").value.trim();
  const passwordInput = document.getElementById("inputPassAdmin").value.trim();

  if ((usuarioInput === "fedenick" && passwordInput === "Nick94@") || 
      (usuarioInput === "bebesita" && passwordInput === "bebeteamo")) {
    isAdmin = true;
    document.getElementById("inputUserAdmin").value = "";
    document.getElementById("inputPassAdmin").value = "";
    window.location.hash = "admin";
    activarModoAdminDirecto();
  } else {
    alert("Usuario o contraseña incorrectos.");
  }
}
window.procesarLogin = procesarLogin;

function cerrarSesionAdmin() {
  window.location.hash = "publica";
  activarModoPublico();
}
window.cerrarSesionAdmin = cerrarSesionAdmin;

function obtenerFechaHoyISO() {
  const hoy = new Date();
  return hoy.toISOString().split('T')[0];
}

function formatearFechaVisual(fechaISO) {
  if (!fechaISO || !fechaISO.includes('-')) return fechaISO;
  const [anio, mes, dia] = fechaISO.split('-');
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaISO(fechaStr) {
  if (!fechaStr || !fechaStr.includes('/')) return fechaStr || obtenerFechaHoyISO();
  const [dia, mes, anio] = fechaStr.split('/');
  return `${anio}-${mes}-${dia}`;
}

async function guardarDatosLocales() {
  localStorage.setItem("wraps_pos_data", JSON.stringify(window.estadoApp));
  if (window.docRef && window.setDoc) {
    try {
      await window.setDoc(window.docRef, window.estadoApp);
    } catch (e) {
      console.error("Error al guardar en Firebase:", e);
    }
  }
}

function inicializar() {
  document.getElementById("inputFecha").value = obtenerFechaHoyISO();
  renderizarSelectorLotes();
  renderizarVariedades();
  renderizarStockPublico();
  verificarModoPorURL();
}

function ocultarErrorNombre() {
  const err = document.getElementById("errorNombre");
  const input = document.getElementById("inputClienteWeb");
  if(err) err.classList.add("hidden");
  if(input) input.classList.remove("border-rose-500");
}
window.ocultarErrorNombre = ocultarErrorNombre;

function ocultarErrorDireccion() {
  const err = document.getElementById("errorDireccion");
  const input = document.getElementById("inputDireccionEnvio");
  if(err) err.classList.add("hidden");
  if(input) input.classList.remove("border-rose-500");
}
window.ocultarErrorDireccion = ocultarErrorDireccion;

function setTipoEntrega(tipo) {
  tipoEntregaSeleccionado = tipo;
  const btnRetiro = document.getElementById("btnTipoRetiro");
  const btnEnvio = document.getElementById("btnTipoEnvio");
  const seccionDir = document.getElementById("seccionDireccionEnvio");

  if (tipo === 'Retiro') {
    btnRetiro.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-amber-950/60 border-amber-500 text-amber-300 flex items-center justify-center gap-1.5 shadow-sm";
    btnEnvio.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 shadow-sm";
    seccionDir.classList.add("hidden");
  } else {
    btnEnvio.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-amber-950/60 border-amber-500 text-amber-300 flex items-center justify-center gap-1.5 shadow-sm";
    btnRetiro.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 shadow-sm";
    seccionDir.classList.remove("hidden");
  }
}
window.setTipoEntrega = setTipoEntrega;

function setMetodoPagoWeb(metodo) {
  metodoPagoWebSeleccionado = metodo;
  const btnEfectivo = document.getElementById("btnPagoWebEfectivo");
  const btnTransf = document.getElementById("btnPagoWebTransf");
  const contenedorEfectivo = document.getElementById("contenedorPagoEfectivoWeb");
  const contenedorTransf = document.getElementById("contenedorPagoTransfWeb");

  if (metodo === 'Efectivo') {
    btnEfectivo.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-amber-950/60 border-amber-500 text-amber-300 flex items-center justify-center gap-1.5 shadow-sm";
    btnTransf.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 shadow-sm";
    contenedorEfectivo.classList.remove("hidden");
    contenedorTransf.classList.add("hidden");
  } else {
    btnTransf.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-amber-950/60 border-amber-500 text-amber-300 flex items-center justify-center gap-1.5 shadow-sm";
    btnEfectivo.className = "py-2.5 px-3 rounded-xl border text-xs font-bold transition bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 shadow-sm";
    contenedorTransf.classList.remove("hidden");
    contenedorEfectivo.classList.add("hidden");
  }
}
window.setMetodoPagoWeb = setMetodoPagoWeb;

function setTipoMasaSimple(masa) {
  tipoMasaSimple = masa;
  const bComun = document.getElementById("btnMasaComunSimple");
  const bIntegral = document.getElementById("btnMasaIntegralSimple");
  if (masa === 'Común') {
    bComun.className = "py-2 rounded-lg border text-xs font-bold bg-amber-950/60 border-amber-500 text-amber-300";
    bIntegral.className = "py-2 rounded-lg border text-xs font-bold bg-slate-950 border-slate-800 text-slate-400";
  } else {
    bIntegral.className = "py-2 rounded-lg border text-xs font-bold bg-amber-950/60 border-amber-500 text-amber-300";
    bComun.className = "py-2 rounded-lg border text-xs font-bold bg-slate-950 border-slate-800 text-slate-400";
  }
}
window.setTipoMasaSimple = setTipoMasaSimple;

function setTipoMasaCarrito(masa) {
  tipoMasaCarrito = masa;
  const bComun = document.getElementById("btnMasaComunCarrito");
  const bIntegral = document.getElementById("btnMasaIntegralCarrito");
  if (masa === 'Común') {
    bComun.className = "py-1.5 rounded-lg border text-xs font-bold bg-amber-950/60 border-amber-500 text-amber-300";
    bIntegral.className = "py-1.5 rounded-lg border text-xs font-bold bg-slate-950 border-slate-800 text-slate-400";
  } else {
    bIntegral.className = "py-1.5 rounded-lg border text-xs font-bold bg-amber-950/60 border-amber-500 text-amber-300";
    bComun.className = "py-1.5 rounded-lg border text-xs font-bold bg-slate-950 border-slate-800 text-slate-400";
  }
}
window.setTipoMasaCarrito = setTipoMasaCarrito;

function cambiarTabAdmin(tab) {
  const btnManuales = document.getElementById("btnTabManuales");
  const btnArmar = document.getElementById("btnTabArmar");
  const btnProgramados = document.getElementById("btnTabProgramados");
  const btnCompletados = document.getElementById("btnTabCompletados");
  const btnPorDia = document.getElementById("btnTabPorDia");

  const contentManuales = document.getElementById("tabContentManuales");
  const contentArmar = document.getElementById("tabContentArmar");
  const contentProgramados = document.getElementById("tabContentProgramados");
  const contentCompletados = document.getElementById("tabContentCompletados");
  const contentPorDia = document.getElementById("tabContentPorDia");

  if(btnManuales) btnManuales.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-slate-800 text-slate-300 hover:bg-slate-700";
  if(btnArmar) btnArmar.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-slate-800 text-slate-300 hover:bg-slate-700";
  if(btnProgramados) btnProgramados.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-slate-800 text-slate-300 hover:bg-slate-700";
  if(btnCompletados) btnCompletados.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-slate-800 text-slate-300 hover:bg-slate-700";
  if(btnPorDia) btnPorDia.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-slate-800 text-slate-300 hover:bg-slate-700";

  if(contentManuales) contentManuales.classList.add("hidden");
  if(contentArmar) contentArmar.classList.add("hidden");
  if(contentProgramados) contentProgramados.classList.add("hidden");
  if(contentCompletados) contentCompletados.classList.add("hidden");
  if(contentPorDia) contentPorDia.classList.add("hidden");

  if (tab === 'manuales') {
    if(btnManuales) btnManuales.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-amber-500 text-slate-950 shadow-md";
    if(contentManuales) contentManuales.classList.remove("hidden");
  } else if (tab === 'armar') {
    if(btnArmar) btnArmar.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-amber-500 text-slate-950 shadow-md";
    if(contentArmar) contentArmar.classList.remove("hidden");
  } else if (tab === 'programados') {
    if(btnProgramados) btnProgramados.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-blue-500 text-slate-950 shadow-md";
    if(contentProgramados) contentProgramados.classList.remove("hidden");
  } else if (tab === 'completados') {
    if(btnCompletados) btnCompletados.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-emerald-500 text-slate-950 shadow-md";
    if(contentCompletados) contentCompletados.classList.remove("hidden");
  } else if (tab === 'pordia') {
    if(btnPorDia) btnPorDia.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition bg-blue-500 text-slate-950 shadow-md";
    if(contentPorDia) contentPorDia.classList.remove("hidden");
  }
}
window.cambiarTabAdmin = cambiarTabAdmin;

function setModoRegistro(modo) {
  modoRegistro = modo;
  const btnSimple = document.getElementById("btnModoSimple");
  const btnCarrito = document.getElementById("btnModoCarrito");
  const secSimple = document.getElementById("sectorModoSimple");
  const secCarrito = document.getElementById("sectorModoCarrito");

  if (modo === 'simple') {
    btnSimple.className = "flex-1 py-1.5 rounded-lg text-center transition bg-amber-500 text-slate-950 font-bold";
    btnCarrito.className = "flex-1 py-1.5 rounded-lg text-center transition text-slate-400 hover:text-slate-200 font-bold";
    secSimple.classList.remove("hidden");
    secCarrito.classList.add("hidden");
  } else {
    btnCarrito.className = "flex-1 py-1.5 rounded-lg text-center transition bg-amber-500 text-slate-950 font-bold";
    btnSimple.className = "flex-1 py-1.5 rounded-lg text-center transition text-slate-400 hover:text-slate-200 font-bold";
    secCarrito.classList.remove("hidden");
    secSimple.classList.add("hidden");
    renderizarVariedadesCarrito();
  }
  calcularTotalesVenta();
}
window.setModoRegistro = setModoRegistro;

function renderizarSelectorLotes() {
  const select = document.getElementById("selectLote");
  if (!window.estadoApp.lotes || !select) return;
  
  const valActual = select.value;
  select.innerHTML = "";
  window.estadoApp.lotes.forEach(lote => {
    const option = document.createElement("option");
    option.value = lote.id;
    option.textContent = lote.id;
    if (lote.activo || lote.id === valActual) option.selected = true;
    select.appendChild(option);
  });
}

function cambiarLoteActivo() {
  const select = document.getElementById("selectLote");
  if (!select) return;
  window.estadoApp.lotes.forEach(l => l.activo = (l.id === select.value));
  guardarDatosLocales();
  renderizarTodo();
}
window.cambiarLoteActivo = cambiarLoteActivo;

function abrirModalRenombrarLote() {
  const lote = getLoteActivo();
  document.getElementById("inputNuevoNombreLote").value = lote.id;
  document.getElementById("modalRenombrarLote").classList.remove("hidden");
}
window.abrirModalRenombrarLote = abrirModalRenombrarLote;

function guardarNuevoNombreLote() {
  const nuevoNombre = document.getElementById("inputNuevoNombreLote").value.trim();
  if (!nuevoNombre) { alert("Escribe un nombre válido."); return; }
  const loteActual = getLoteActivo();
  const viejoId = loteActual.id;
  if (viejoId === nuevoNombre) { cerrarModales(); return; }

  loteActual.id = nuevoNombre;
  if (window.estadoApp.ventas) {
    window.estadoApp.ventas.forEach(v => { if (v.loteId === viejoId) v.loteId = nuevoNombre; });
  }

  guardarDatosLocales();
  cerrarModales();
  renderizarSelectorLotes();
  renderizarTodo();
}
window.guardarNuevoNombreLote = guardarNuevoNombreLote;

function eliminarLoteActivo() {
  const loteActual = getLoteActivo();
  if (!loteActual) return;
  if (!confirm(`⚠️ ¿Estás seguro de eliminar el "${loteActual.id}" y sus ventas?`)) return;

  window.estadoApp.lotes = window.estadoApp.lotes.filter(l => l.id !== loteActual.id);
  if (window.estadoApp.ventas) {
    window.estadoApp.ventas = window.estadoApp.ventas.filter(v => v.loteId !== loteActual.id);
  }

  if (window.estadoApp.lotes.length > 0) {
    window.estadoApp.lotes[0].activo = true;
  } else {
    window.estadoApp.lotes = [{ 
      id: "Lote Principal", 
      activo: true, 
      precioVenta: 5700, 
      precioCompra: 3050, 
      stockInicial: { 
        Carne: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Pollo: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Bondiola: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Caprese: { comun: 10, integral: 10, comunProx: false, integralProx: false } 
      } 
    }];
  }

  guardarDatosLocales();
  renderizarSelectorLotes();
  renderizarTodo();
}
window.eliminarLoteActivo = eliminarLoteActivo;

function getLoteActivo() {
  if (!window.estadoApp.lotes || window.estadoApp.lotes.length === 0) {
    return { 
      id: "Lote Principal", 
      precioVenta: 5700, 
      precioCompra: 3050, 
      stockInicial: { 
        Carne: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Pollo: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Bondiola: { comun: 10, integral: 10, comunProx: false, integralProx: false }, 
        Caprese: { comun: 10, integral: 10, comunProx: false, integralProx: false } 
      } 
    };
  }
  let lote = window.estadoApp.lotes.find(l => l.activo);
  if (!lote) { lote = window.estadoApp.lotes[0]; lote.activo = true; }
  if (lote.precioVenta === undefined) lote.precioVenta = 5700;
  if (lote.precioCompra === undefined) lote.precioCompra = 3050;
  return lote;
}

function renderizarStockPublico() {
  const grid = document.getElementById("gridStockPublico");
  if (!grid) return;
  grid.innerHTML = "";
  const lote = getLoteActivo();
  
  const ventasEntregadas = (window.estadoApp.ventas || []).filter(x => !x.esProgramado && x.estadoEntrega === 'Entregado');

  VARIEDADES.forEach(v => {
    const iniC = getStockComun(lote, v);
    const iniI = getStockIntegral(lote, v);
    const isComunProx = isComunProximamente(lote, v);
    const isIntegralProx = isIntegralProximamente(lote, v);

    const vendC = isComunProx ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === v && x.tipoMasa === 'Común').reduce((a, c) => a + c.cantidad, 0);
    const vendI = isIntegralProx ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === v && x.tipoMasa === 'Integral').reduce((a, c) => a + c.cantidad, 0);
    
    const dispC = isComunProx ? 0 : (iniC - vendC);
    const dispI = isIntegralProx ? 0 : (iniI - vendI);
    const dispTotal = dispC + dispI;
    
    if (!pedidoCliente[v]) {
      pedidoCliente[v] = { comun: 0, integral: 0 };
    }

    const cantComun = isComunProx ? 0 : (pedidoCliente[v].comun || 0);
    const cantIntegral = isIntegralProx ? 0 : (pedidoCliente[v].integral || 0);
    if (isComunProx) pedidoCliente[v].comun = 0;
    if (isIntegralProx) pedidoCliente[v].integral = 0;

    if (cantComun > dispC) pedidoCliente[v].comun = dispC < 0 ? 0 : dispC;
    if (cantIntegral > dispI) pedidoCliente[v].integral = dispI < 0 ? 0 : dispI;

    let totalText = "";
    if (dispTotal <= 0 && !isComunProx && !isIntegralProx) {
      totalText = `<span class="text-rose-400 font-bold uppercase text-xs">Total: Sin Stock</span>`;
    } else {
      totalText = `<span class="text-emerald-400 font-bold text-xs">Total disponibles: ${dispTotal}</span>`;
    }

    let comunBlockHTML = "";
    if (isComunProx) {
      comunBlockHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span class="font-bold text-slate-300 block text-sm">🌾 Común</span>
            <span class="text-[10px] text-slate-500">Próximamente disponible</span>
          </div>
          <span class="bg-slate-800 text-slate-400 font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Próximamente
          </span>
        </div>
      `;
    } else if (dispC <= 0) {
      comunBlockHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-rose-900/40">
          <div>
            <span class="font-bold text-slate-300 block text-sm">🌾 Común</span>
            <span class="text-[10px] text-rose-400 font-semibold">Agotado</span>
          </div>
          <span class="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Sin Stock
          </span>
        </div>
      `;
    } else {
      comunBlockHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div>
            <span class="font-bold text-slate-300 block text-sm">🌾 Común</span>
            <span class="text-[11px] text-emerald-400 font-semibold">${dispC} disponibles</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="modificarPedidoCliente('${v}', 'comun', -1)" class="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition flex items-center justify-center text-sm">-</button>
            <span class="w-6 text-center font-bold text-slate-100 text-base">${cantComun}</span>
            <button type="button" onclick="modificarPedidoCliente('${v}', 'comun', 1)" class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30 transition flex items-center justify-center border border-amber-500/30 text-sm">+</button>
          </div>
        </div>
      `;
    }

    let integralBlockHTML = "";
    if (isIntegralProx) {
      integralBlockHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-amber-900/40">
          <div>
            <span class="font-bold text-amber-400 block text-sm">🍞 Integral</span>
            <span class="text-[10px] text-amber-500/80">Próximamente disponible</span>
          </div>
          <span class="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Próximamente
          </span>
        </div>
      `;
    } else if (dispI <= 0) {
      integralBlockHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-rose-900/40">
          <div>
            <span class="font-bold text-amber-400 block text-sm">🍞 Integral</span>
            <span class="text-[10px] text-rose-400 font-semibold">Agotado</span>
          </div>
          <span class="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Sin Stock
          </span>
        </div>
      `;
    } else {
      integralBlockHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-amber-900/40">
          <div>
            <span class="font-bold text-amber-400 block text-sm">🍞 Integral</span>
            <span class="text-[11px] text-emerald-400 font-semibold">${dispI} disponibles</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="modificarPedidoCliente('${v}', 'integral', -1)" class="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition flex items-center justify-center text-sm">-</button>
            <span class="w-6 text-center font-bold text-amber-300 text-base">${cantIntegral}</span>
            <button type="button" onclick="modificarPedidoCliente('${v}', 'integral', 1)" class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30 transition flex items-center justify-center border border-amber-500/30 text-sm">+</button>
          </div>
        </div>
      `;
    }

    grid.innerHTML += `
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between transition hover:border-slate-700 shadow-md">
        <div class="text-center space-y-1.5 pb-3 border-b border-slate-800/80">
          <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">WRAP</span>
          <h3 class="font-black text-slate-100 text-2xl">${v}</h3>
          <div>
            ${totalText}
          </div>
        </div>
        <div class="mt-3 space-y-2.5">
          ${comunBlockHTML}
          ${integralBlockHTML}
        </div>
      </div>
    `;
  });

  actualizarBotonWhatsAppTexto();
}

function modificarPedidoCliente(variedad, tipoMasa, delta) {
  const lote = getLoteActivo();
  if (tipoMasa === 'comun' && isComunProximamente(lote, variedad)) return;
  if (tipoMasa === 'integral' && isIntegralProximamente(lote, variedad)) return;

  const ventasEntregadas = (window.estadoApp.ventas || []).filter(x => !x.esProgramado && x.estadoEntrega === 'Entregado');
  
  const iniC = getStockComun(lote, variedad);
  const iniI = getStockIntegral(lote, variedad);
  const vendC = isComunProximamente(lote, variedad) ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === variedad && x.tipoMasa === 'Común').reduce((a, c) => a + c.cantidad, 0);
  const vendI = isIntegralProximamente(lote, variedad) ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === variedad && x.tipoMasa === 'Integral').reduce((a, c) => a + c.cantidad, 0);
  
  const dispC = iniC - vendC;
  const dispI = iniI - vendI;
  const dispTipo = tipoMasa === 'comun' ? dispC : dispI;

  if (dispTipo <= 0) {
    alert(`Lo sentimos, no hay stock disponible de ${variedad} (${tipoMasa === 'comun' ? 'Común' : 'Integral'}).`);
    return;
  }

  if (!pedidoCliente[variedad]) {
    pedidoCliente[variedad] = { comun: 0, integral: 0 };
  }

  let actualTipo = pedidoCliente[variedad][tipoMasa] || 0;

  if (delta > 0 && actualTipo >= dispTipo) {
    alert(`¡Atención! Solo hay ${dispTipo} unidades disponibles de wrap de ${variedad} (${tipoMasa === 'comun' ? 'Común' : 'Integral'}).`);
    return;
  }

  let nuevoValor = actualTipo + delta;
  if (nuevoValor < 0) nuevoValor = 0;

  pedidoCliente[variedad][tipoMasa] = nuevoValor;
  renderizarStockPublico();
}
window.modificarPedidoCliente = modificarPedidoCliente;

function actualizarBotonWhatsAppTexto() {
  const label = document.getElementById("labelTextoWhatsapp");
  if (!label) return;

  let totalUnidades = 0;
  let totalPesos = 0;
  const precioVenta = getLoteActivo().precioVenta || 5700;

  for (let variedad in pedidoCliente) {
    let cantComun = pedidoCliente[variedad].comun || 0;
    let cantIntegral = pedidoCliente[variedad].integral || 0;
    let cantTot = cantComun + cantIntegral;

    if (cantTot > 0) {
      totalUnidades += cantTot;
      totalPesos += cantTot * precioVenta;
    }
  }

  if (totalUnidades === 0) {
    label.textContent = "Hacer pedido";
  } else {
    label.textContent = `Pedir ${totalUnidades} ${totalUnidades === 1 ? 'wrap' : 'wraps'} ($${totalPesos.toLocaleString('es-AR')})`;
  }
}

function registrarPedidoWebYEnviarWhatsApp(event) {
  event.preventDefault();

  let totalUnidades = 0;
  for (let v in pedidoCliente) {
    let tot = (pedidoCliente[v].comun || 0) + (pedidoCliente[v].integral || 0);
    if (tot > 0) totalUnidades += tot;
  }

  if (totalUnidades === 0) {
    alert("Por favor seleccioná al menos 1 wrap para hacer tu pedido.");
    return;
  }

  const inputNombre = document.getElementById("inputClienteWeb");
  const errorNombre = document.getElementById("errorNombre");
  let nombreCliente = inputNombre ? inputNombre.value.trim() : "";

  if (!nombreCliente) {
    if (errorNombre) errorNombre.classList.remove("hidden");
    if (inputNombre) {
      inputNombre.classList.add("border-rose-500");
      inputNombre.focus();
    }
    return;
  }

  const inputDir = document.getElementById("inputDireccionEnvio");
  const errorDir = document.getElementById("errorDireccion");
  let direccionEnvio = "";

  if (tipoEntregaSeleccionado === 'Envio') {
    direccionEnvio = inputDir ? inputDir.value.trim() : "";
    if (!direccionEnvio) {
      if (errorDir) errorDir.classList.add("hidden");
      if (inputDir) {
        inputDir.classList.add("border-rose-500");
        inputDir.focus();
      }
      return;
    }
  }

  const inputPagaCon = document.getElementById("inputPagaConWeb");
  const pagaConValor = inputPagaCon ? inputPagaCon.value.trim() : "";

  const telefono = "5493814132279";
  const lote = getLoteActivo();
  const precioVenta = lote.precioVenta || 5700;
  
  let totalPesos = 0;
  let lineasItems = [];

  const now = Date.now();
  if (!window.estadoApp.ventas) window.estadoApp.ventas = [];

  let offsetIndex = 0;

  for (let variedad in pedidoCliente) {
    let cantComun = pedidoCliente[variedad].comun || 0;
    let cantIntegral = pedidoCliente[variedad].integral || 0;

    if (cantComun > 0) {
      totalPesos += cantComun * precioVenta;
      lineasItems.push(`• ${cantComun}x ${variedad} (Masa Común)`);

      window.estadoApp.ventas.unshift({
        id: now + (offsetIndex++),
        timestamp: now,
        loteId: lote.id,
        cliente: nombreCliente,
        variedad: variedad,
        tipoMasa: "Común",
        cantidad: cantComun,
        precioUnitario: lote.precioVenta,
        precioCompra: lote.precioCompra,
        metodoPago: metodoPagoWebSeleccionado,
        montoVuelto: metodoPagoWebSeleccionado === 'Efectivo' && pagaConValor ? Math.max(0, parseFloat(pagaConValor) - (cantComun * lote.precioVenta)) : 0,
        vueltoTransf: 0,
        estadoPago: "Pendiente",
        estadoEntrega: "Pendiente",
        preparado: false,
        tipoEntrega: tipoEntregaSeleccionado,
        direccionEnvio: direccionEnvio,
        fecha: formatearFechaVisual(obtenerFechaHoyISO()),
        esProgramado: false
      });
    }

    if (cantIntegral > 0) {
      totalPesos += cantIntegral * precioVenta;
      lineasItems.push(`• ${cantIntegral}x ${variedad} (Masa Integral)`);

      window.estadoApp.ventas.unshift({
        id: now + (offsetIndex++),
        timestamp: now,
        loteId: lote.id,
        cliente: nombreCliente,
        variedad: variedad,
        tipoMasa: "Integral",
        cantidad: cantIntegral,
        precioUnitario: lote.precioVenta,
        precioCompra: lote.precioCompra,
        metodoPago: metodoPagoWebSeleccionado,
        montoVuelto: metodoPagoWebSeleccionado === 'Efectivo' && pagaConValor ? Math.max(0, parseFloat(pagaConValor) - (cantIntegral * lote.precioVenta)) : 0,
        vueltoTransf: 0,
        estadoPago: "Pendiente",
        estadoEntrega: "Pendiente",
        preparado: false,
        tipoEntrega: tipoEntregaSeleccionado,
        direccionEnvio: direccionEnvio,
        fecha: formatearFechaVisual(obtenerFechaHoyISO()),
        esProgramado: false
      });
    }
  }

  let mensajeConstruido = `¡Hola! Quiero hacer el siguiente pedido de wraps:\n`;
  mensajeConstruido += lineasItems.join("\n");
  mensajeConstruido += `\n\n💰 *Total a pagar: $${totalPesos.toLocaleString('es-AR')}*`;
  mensajeConstruido += `\n👤 Mi nombre es: ${nombreCliente}`;
  
  if (tipoEntregaSeleccionado === 'Retiro') {
    mensajeConstruido += `\n📍 Tipo de entrega: Para retirar`;
  } else {
    mensajeConstruido += `\n📍 Tipo de entrega: Solicitar envío${direccionEnvio ? ` - Dirección: ${direccionEnvio}` : ''}`;
  }

  if (metodoPagoWebSeleccionado === 'Transferencia') {
    mensajeConstruido += `\n💳 Método de pago: Transferencia (Alias: nicklergal)`;
  } else {
    mensajeConstruido += `\n💳 Método de pago: Efectivo${pagaConValor ? ` (Paga con: $${pagaConValor})` : ''}`;
  }

  guardarDatosLocales();

  pedidoCliente = {};
  renderizarStockPublico();

  const urlWa = `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeConstruido)}`;
  window.location.href = urlWa;
}
window.registrarPedidoWebYEnviarWhatsApp = registrarPedidoWebYEnviarWhatsApp;

function renderizarVariedades() {
  const container = document.getElementById("gridVariedades");
  if (!container) return;
  container.innerHTML = "";
  const lote = getLoteActivo();
  const ventasEntregadas = (window.estadoApp.ventas || []).filter(x => !x.esProgramado && x.estadoEntrega === 'Entregado');

  VARIEDADES.forEach(v => {
    const iniC = getStockComun(lote, v);
    const iniI = getStockIntegral(lote, v);
    const isComunProx = isComunProximamente(lote, v);
    const isIntegralProx = isIntegralProximamente(lote, v);
    const vendC = isComunProx ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === v && x.tipoMasa === 'Común').reduce((a, c) => a + c.cantidad, 0);
    const vendI = isIntegralProx ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === v && x.tipoMasa === 'Integral').reduce((a, c) => a + c.cantidad, 0);
    const disp = (isComunProx ? 0 : (iniC - vendC)) + (isIntegralProx ? 0 : (iniI - vendI));

    const btn = document.createElement("button");
    btn.type = "button";
    btn.onclick = () => { variedadSeleccionada = v; renderizarVariedades(); };
    btn.className = `p-3 rounded-xl border text-left flex justify-between items-center transition ${v === variedadSeleccionada ? 'border-amber-500 bg-amber-950/50 text-amber-300 ring-2 ring-amber-500/50' : 'border-slate-800 bg-slate-950 text-slate-200'}`;
    btn.innerHTML = `<span class="text-sm font-semibold">${v}</span><span class="text-xs px-2 py-0.5 rounded-full font-bold ${disp <= 0 ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}">${disp} disp.</span>`;
    container.appendChild(btn);
  });
}

function renderizarVariedadesCarrito() {
  const container = document.getElementById("gridVariedadesCarrito");
  if (!container) return;
  container.innerHTML = "";
  VARIEDADES.forEach(v => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.onclick = () => { variedadCarritoSeleccionada = v; renderizarVariedadesCarrito(); };
    btn.className = `p-2 rounded-lg border text-xs font-semibold text-center transition ${v === variedadCarritoSeleccionada ? 'border-amber-500 bg-amber-950/60 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400'}`;
    btn.textContent = v;
    container.appendChild(btn);
  });
}

function agregarAlCarrito() {
  const cant = parseInt(document.getElementById("inputCantidadCarrito").value) || 1;
  const existe = carritoActual.find(x => x.variedad === variedadCarritoSeleccionada && x.tipoMasa === tipoMasaCarrito);
  if (existe) {
    existe.cantidad += cant;
  } else {
    carritoActual.push({ variedad: variedadCarritoSeleccionada, tipoMasa: tipoMasaCarrito, cantidad: cant });
  }
  document.getElementById("inputCantidadCarrito").value = 1;
  renderizarCarrito();
  calcularTotalesVenta();
}
window.agregarAlCarrito = agregarAlCarrito;

function eliminarItemCarrito(index) {
  carritoActual.splice(index, 1);
  renderizarCarrito();
  calcularTotalesVenta();
}
window.eliminarItemCarrito = eliminarItemCarrito;

function renderizarCarrito() {
  const container = document.getElementById("contenedorListaCarrito");
  if (!container) return;
  if (carritoActual.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-2">Sin items agregados aún.</p>`;
    return;
  }

  const lote = getLoteActivo();
  container.innerHTML = "";
  carritoActual.forEach((item, index) => {
    const sub = item.cantidad * lote.precioVenta;
    container.innerHTML += `
      <div class="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
        <span class="font-bold text-slate-200">${item.cantidad}× Wrap de ${item.variedad} (${item.tipoMasa}) <span class="text-slate-400 font-normal">($${sub.toLocaleString('es-AR')})</span></span>
        <button type="button" onclick="eliminarItemCarrito(${index})" class="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5">✕</button>
      </div>
    `;
  });
}

function subirImagenAdmin(event, num) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64String = e.target.result;
    if (num === 1) {
      window.estadoApp.imagen1 = base64String;
    } else {
      window.estadoApp.imagen2 = base64String;
    }
    guardarDatosLocales();
    renderizarImagenes();
    alert(`¡Foto ${num} actualizada con éxito!`);
  };
  reader.readAsDataURL(file);
}
window.subirImagenAdmin = subirImagenAdmin;

function renderizarImagenes() {
  const img1 = document.getElementById("imgPublica1");
  const img2 = document.getElementById("imgPublica2");

  const src1 = window.estadoApp.imagen1 || "https://i.postimg.cc/d1LTcSj6/wrap1.jpg";
  const src2 = window.estadoApp.imagen2 || "https://i.postimg.cc/NM5rvPkb/wrap2.jpg";

  if (img1) img1.src = src1;
  if (img2) img2.src = src2;
}

function setCantidad(cant) {
  document.getElementById("inputCantidad").value = cant;
  calcularTotalesVenta();
}
window.setCantidad = setCantidad;

function modificarCantidad(delta) {
  const input = document.getElementById("inputCantidad");
  input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
  calcularTotalesVenta();
}
window.modificarCantidad = modificarCantidad;

function setMetodoPago(metodo) {
  metodoPagoSeleccionado = metodo;
  document.getElementById("btnPagoEfectivo").className = metodo === 'Efectivo' ? "p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition border-amber-500 bg-amber-950/60 text-amber-300" : "p-3 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5 transition hover:bg-slate-800";
  document.getElementById("btnPagoTransf").className = metodo === 'Transferencia' ? "p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition border-blue-500 bg-blue-950/60 text-blue-300" : "p-3 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5 transition hover:bg-slate-800";
}
window.setMetodoPago = setMetodoPago;

function calcularTotalesVenta() {
  const lote = getLoteActivo();
  const pv = lote.precioVenta;
  let total = 0;
  let cantWraps = 0;

  if (modoRegistro === 'simple') {
    cantWraps = parseInt(document.getElementById("inputCantidad").value) || 1;
    total = cantWraps * pv;
    document.getElementById("labelDetalleCobro").textContent = `${cantWraps} wrap${cantWraps > 1 ? 's' : ''} × $${pv.toLocaleString('es-AR')}`;
  } else {
    cantWraps = carritoActual.reduce((a, b) => a + b.cantidad, 0);
    total = cantWraps * pv;
    document.getElementById("labelDetalleCobro").textContent = `${cantWraps} wrap${cantWraps > 1 ? 's' : ''} total en pedido`;
  }
  
  document.getElementById("badgePrecioVenta").textContent = `$${pv.toLocaleString('es-AR')} c/u`;
  document.getElementById("labelTotalCobrar").textContent = `$${total.toLocaleString('es-AR')}`;
  calcularVuelto();
}

function calcularVuelto() {
  const lote = getLoteActivo();
  const pv = lote.precioVenta;
  let total = 0;

  if (modoRegistro === 'simple') {
    const cant = parseInt(document.getElementById("inputCantidad").value) || 1;
    total = cant * pv;
  } else {
    const cant = carritoActual.reduce((a, b) => a + b.cantidad, 0);
    total = cant * pv;
  }

  const pago = parseFloat(document.getElementById("inputPagoCliente").value) || 0;
  document.getElementById("labelMontoVuelto").textContent = `$${Math.max(0, pago - total).toLocaleString('es-AR')}`;
}
window.calcularVuelto = calcularVuelto;

function guardarVenta() {
  const lote = getLoteActivo();
  const cliente = document.getElementById("inputCliente").value.trim() || "Cliente Anónimo";
  const fechaISO = document.getElementById("inputFecha").value || obtenerFechaHoyISO();
  const fechaVisual = formatearFechaVisual(fechaISO);
  
  const estadoPago = document.getElementById("selectEstadoPago").value;
  const estadoEntrega = document.getElementById("selectEstadoEntrega").value;

  const esProgramado = (estadoEntrega === 'Futuro');

  if (!window.estadoApp.ventas) window.estadoApp.ventas = [];

  const now = Date.now();

  if (modoRegistro === 'simple') {
    const cantidad = parseInt(document.getElementById("inputCantidad").value) || 1;
    const pagoCliente = parseFloat(document.getElementById("inputPagoCliente").value) || (cantidad * lote.precioVenta);

    window.estadoApp.ventas.unshift({
      id: now,
      timestamp: now,
      loteId: lote.id,
      cliente,
      variedad: variedadSeleccionada,
      tipoMasa: tipoMasaSimple,
      cantidad,
      precioUnitario: lote.precioVenta,
      precioCompra: lote.precioCompra,
      metodoPago: metodoPagoSeleccionado,
      montoVuelto: Math.max(0, pagoCliente - (cantidad * lote.precioVenta)),
      vueltoTransf: 0,
      estadoPago,
      estadoEntrega: esProgramado ? "Pendiente" : estadoEntrega,
      preparado: false,
      tipoEntrega: "Retiro",
      direccionEnvio: "",
      fecha: fechaVisual,
      esProgramado
    });
  } else {
    if (carritoActual.length === 0) {
      alert("Añade al menos un wrap al pedido múltiple.");
      return;
    }

    const totalPedido = carritoActual.reduce((acc, curr) => acc + (curr.cantidad * lote.precioVenta), 0);
    const pagoCliente = parseFloat(document.getElementById("inputPagoCliente").value) || totalPedido;
    const vueltoTotal = Math.max(0, pagoCliente - totalPedido);

    carritoActual.forEach((item, index) => {
      window.estadoApp.ventas.unshift({
        id: now + index,
        timestamp: now + index,
        loteId: lote.id,
        cliente,
        variedad: item.variedad,
        tipoMasa: item.tipoMasa || "Común",
        cantidad: item.cantidad,
        precioUnitario: lote.precioVenta,
        precioCompra: lote.precioCompra,
        metodoPago: metodoPagoSeleccionado,
        montoVuelto: index === 0 ? vueltoTotal : 0,
        vueltoTransf: 0,
        estadoPago,
        estadoEntrega: esProgramado ? "Pendiente" : estadoEntrega,
        preparado: false,
        tipoEntrega: "Retiro",
        direccionEnvio: "",
        fecha: fechaVisual,
        esProgramado
      });
    });

    carritoActual = [];
    renderizarCarrito();
  }

  guardarDatosLocales();
  document.getElementById("inputCliente").value = "";
  document.getElementById("inputPagoCliente").value = "";
  setCantidad(1);
  renderizarTodo();
}
window.guardarVenta = guardarVenta;

// --- GESTIÓN DE EDICIÓN AVANZADA (AGREGAR / QUITAR / MODIFICAR WRAPS) ---

function renderizarItemsEdicionModal() {
  const container = document.getElementById("contenedorItemsEdicionModal");
  if (!container) return;

  if (window.currentEditingItems.length === 0) {
    container.innerHTML = `<p class="text-xs text-rose-400 italic text-center py-2">Debe haber al menos 1 wrap en el pedido.</p>`;
    return;
  }

  container.innerHTML = "";
  window.currentEditingItems.forEach((it, index) => {
    container.innerHTML += `
      <div class="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 gap-2">
        <div>
          <span class="font-bold text-slate-100">Wrap de ${it.variedad}</span>
          <span class="text-amber-400 font-semibold ml-1">(${it.tipoMasa || 'Común'})</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="modificarCantidadItemEdicion(${index}, -1)" class="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
          <span class="w-5 text-center font-bold text-slate-100">${it.cantidad}</span>
          <button type="button" onclick="modificarCantidadItemEdicion(${index}, 1)" class="w-6 h-6 rounded bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30">+</button>
          <button type="button" onclick="eliminarItemEdicion(${index})" class="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 ml-1">🗑️</button>
        </div>
      </div>
    `;
  });
}
window.renderizarItemsEdicionModal = renderizarItemsEdicionModal;

function modificarCantidadItemEdicion(index, delta) {
  window.currentEditingItems[index].cantidad += delta;
  if (window.currentEditingItems[index].cantidad <= 0) {
    window.currentEditingItems.splice(index, 1);
  }
  renderizarItemsEdicionModal();
}
window.modificarCantidadItemEdicion = modificarCantidadItemEdicion;

function eliminarItemEdicion(index) {
  window.currentEditingItems.splice(index, 1);
  renderizarItemsEdicionModal();
}
window.eliminarItemEdicion = eliminarItemEdicion;

function agregarItemEdicionDesdeModal() {
  const variedad = document.getElementById("selectNuevaVariedadEdicion").value;
  const tipoMasa = document.getElementById("selectNuevoTipoMasaEdicion").value;
  const cantidad = parseInt(document.getElementById("inputNuevaCantidadEdicion").value) || 1;

  const existente = window.currentEditingItems.find(x => x.variedad === variedad && x.tipoMasa === tipoMasa);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    window.currentEditingItems.push({
      id: Date.now() + Math.random(),
      variedad,
      tipoMasa,
      cantidad,
      preparado: false,
      estadoPago: "Pendiente"
    });
  }

  document.getElementById("inputNuevaCantidadEdicion").value = 1;
  renderizarItemsEdicionModal();
}
window.agregarItemEdicionDesdeModal = agregarItemEdicionDesdeModal;

// --- MODAL EDITAR CLIENTE (Pendientes de entrega) ---
function abrirModalEditarCliente(nombreNorm, loteId) {
  const ventasLote = (window.estadoApp.ventas || []).filter(v => v.loteId === loteId);
  const ventasCliente = ventasLote.filter(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    return nombreLimpio === nombreNorm;
  });

  if (ventasCliente.length === 0) return;

  const primeraVenta = ventasCliente[0];
  
  // Clonar ítems para edición en memoria
  window.currentEditingItems = ventasCliente.map(v => ({
    id: v.id,
    variedad: v.variedad || "Carne",
    tipoMasa: v.tipoMasa || "Común",
    cantidad: v.cantidad || 1,
    preparado: v.preparado || false,
    estadoPago: v.estadoPago || "Pendiente"
  }));

  document.getElementById("editClienteNorm").value = nombreNorm;
  document.getElementById("editClienteloteId").value = loteId;
  document.getElementById("editClienteNombre").value = primeraVenta.cliente || "";
  document.getElementById("editClienteVueltoTransf").value = primeraVenta.vueltoTransf || 0;
  document.getElementById("editClienteEstadoPago").value = primeraVenta.estadoPago || "Pagado";
  document.getElementById("editClienteEstadoEntrega").value = primeraVenta.estadoEntrega || "Pendiente";

  // Inyectar sección de wraps si no existe
  let contenedorModal = document.querySelector("#modalEditarCliente .space-y-3, #modalEditarCliente .space-y-4, #modalEditarCliente form") || document.querySelector("#modalEditarCliente > div > div");
  if (contenedorModal && !document.getElementById("contenedorItemsEdicionModal")) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 mt-2";
    wrapper.innerHTML = `
      <label class="block text-xs font-bold text-amber-400 uppercase">Wraps del Pedido (Agregar / Quitar)</label>
      <div id="contenedorItemsEdicionModal" class="space-y-1.5 max-h-40 overflow-y-auto"></div>
      <div class="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-900">
        <select id="selectNuevaVariedadEdicion" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-200">
          <option value="Carne">Carne</option>
          <option value="Pollo">Pollo</option>
          <option value="Bondiola">Bondiola</option>
          <option value="Caprese">Caprese</option>
        </select>
        <select id="selectNuevoTipoMasaEdicion" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-amber-300">
          <option value="Común">Común</option>
          <option value="Integral">Integral</option>
        </select>
        <div class="flex items-center gap-1">
          <input type="number" id="inputNuevaCantidadEdicion" value="1" min="1" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-100 text-center">
          <button type="button" onclick="agregarItemEdicionDesdeModal()" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">+</button>
        </div>
      </div>
    `;
    contenedorModal.insertBefore(wrapper, contenedorModal.firstChild);
  }

  renderizarItemsEdicionModal();
  document.getElementById("modalEditarCliente").classList.remove("hidden");
}
window.abrirModalEditarCliente = abrirModalEditarCliente;

function guardarEdicionCliente() {
  const nombreNorm = document.getElementById("editClienteNorm").value;
  const loteId = document.getElementById("editClienteloteId").value;
  const nuevoNombre = document.getElementById("editClienteNombre").value.trim() || "Cliente Anónimo";
  const nuevoVueltoTransf = parseFloat(document.getElementById("editClienteVueltoTransf").value) || 0;
  const nuevoEstadoPago = document.getElementById("editClienteEstadoPago").value;
  const nuevoEstadoEntrega = document.getElementById("editClienteEstadoEntrega").value;

  if (window.currentEditingItems.length === 0) {
    alert("El pedido debe contener al menos un wrap.");
    return;
  }

  // Eliminar ventas anteriores de este cliente en este lote
  window.estadoApp.ventas = (window.estadoApp.ventas || []).filter(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    return !(v.loteId === loteId && nombreLimpio === nombreNorm && !v.esProgramado);
  });

  const lote = (window.estadoApp.lotes || []).find(l => l.id === loteId) || getLoteActivo();
  const now = Date.now();

  // Reinsertar las ventas actualizadas con los wraps agregados/quitados
  window.currentEditingItems.forEach((it, idx) => {
    window.estadoApp.ventas.unshift({
      id: it.id || (now + idx),
      timestamp: now + idx,
      loteId: loteId,
      cliente: nuevoNombre,
      variedad: it.variedad,
      tipoMasa: it.tipoMasa || "Común",
      cantidad: it.cantidad,
      precioUnitario: lote.precioVenta,
      precioCompra: lote.precioCompra,
      metodoPago: "Efectivo",
      montoVuelto: idx === 0 ? nuevoVueltoTransf : 0,
      vueltoTransf: idx === 0 ? nuevoVueltoTransf : 0,
      estadoPago: nuevoEstadoPago,
      estadoEntrega: nuevoEstadoEntrega,
      preparado: it.preparado || false,
      tipoEntrega: "Retiro",
      direccionEnvio: "",
      fecha: formatearFechaVisual(obtenerFechaHoyISO()),
      esProgramado: false
    });
  });

  guardarDatosLocales();
  cerrarModales();
  renderizarTodo();
}
window.guardarEdicionCliente = guardarEdicionCliente;


// --- MODAL EDITAR PROGRAMADO (Pendientes a futuro) ---
function abrirModalEditarProgramado(nombreNorm, loteId) {
  const ventasLote = (window.estadoApp.ventas || []).filter(v => v.loteId === loteId && v.esProgramado);
  const ventasCliente = ventasLote.filter(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    return nombreLimpio === nombreNorm;
  });

  if (ventasCliente.length === 0) return;

  const primeraVenta = ventasCliente[0];

  window.currentEditingItems = ventasCliente.map(v => ({
    id: v.id,
    variedad: v.variedad || "Carne",
    tipoMasa: v.tipoMasa || "Común",
    cantidad: v.cantidad || 1,
    preparado: false,
    estadoPago: v.estadoPago || "Pendiente"
  }));

  // Asegurar que exista el modal editProg con los campos necesarios o adaptarlo
  const modalProg = document.getElementById("modalEditarProgramado");
  if (!modalProg) return;

  // Rellenar campos ocultos / visibles si existen
  const elNorm = document.getElementById("editProgNorm") || (() => {
    const inp = document.createElement("input");
    inp.type = "hidden"; inp.id = "editProgNorm";
    modalProg.appendChild(inp);
    return inp;
  })();
  elNorm.value = nombreNorm;

  const elLote = document.getElementById("editProgLoteId") || (() => {
    const inp = document.createElement("input");
    inp.type = "hidden"; inp.id = "editProgLoteId";
    modalProg.appendChild(inp);
    return inp;
  })();
  elLote.value = loteId;

  const elCli = document.getElementById("editProgCliente");
  if (elCli) elCli.value = primeraVenta.cliente || "";

  const elFecha = document.getElementById("editProgFecha");
  if (elFecha) elFecha.value = formatearFechaISO(primeraVenta.fecha);

  // Inyectar sección de wraps en modal programado si no existe
  let contenedorModal = modalProg.querySelector(".space-y-3, .space-y-4, form") || modalProg.querySelector("div > div");
  if (contenedorModal && !document.getElementById("contenedorItemsEdicionProgModal")) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 mt-2";
    wrapper.innerHTML = `
      <label class="block text-xs font-bold text-blue-400 uppercase">Wraps del Pedido Futuro (Agregar / Quitar)</label>
      <div id="contenedorItemsEdicionProgModal" class="space-y-1.5 max-h-40 overflow-y-auto"></div>
      <div class="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-900">
        <select id="selectNuevaVariedadProgEdicion" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-200">
          <option value="Carne">Carne</option>
          <option value="Pollo">Pollo</option>
          <option value="Bondiola">Bondiola</option>
          <option value="Caprese">Caprese</option>
        </select>
        <select id="selectNuevoTipoMasaProgEdicion" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-amber-300">
          <option value="Común">Común</option>
          <option value="Integral">Integral</option>
        </select>
        <div class="flex items-center gap-1">
          <input type="number" id="inputNuevaCantidadProgEdicion" value="1" min="1" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-100 text-center">
          <button type="button" onclick="agregarItemEdicionProgModal()" class="bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">+</button>
        </div>
      </div>
    `;
    contenedorModal.insertBefore(wrapper, contenedorModal.firstChild);
  }

  renderizarItemsEdicionProgModal();
  modalProg.classList.remove("hidden");
}
window.abrirModalEditarProgramado = abrirModalEditarProgramado;

function renderizarItemsEdicionProgModal() {
  const container = document.getElementById("contenedorItemsEdicionProgModal");
  if (!container) return;

  if (window.currentEditingItems.length === 0) {
    container.innerHTML = `<p class="text-xs text-rose-400 italic text-center py-2">Debe haber al menos 1 wrap en el pedido.</p>`;
    return;
  }

  container.innerHTML = "";
  window.currentEditingItems.forEach((it, index) => {
    container.innerHTML += `
      <div class="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 gap-2">
        <div>
          <span class="font-bold text-slate-100">Wrap de ${it.variedad}</span>
          <span class="text-blue-300 font-semibold ml-1">(${it.tipoMasa || 'Común'})</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="modificarCantidadItemProgEdicion(${index}, -1)" class="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
          <span class="w-5 text-center font-bold text-slate-100">${it.cantidad}</span>
          <button type="button" onclick="modificarCantidadItemProgEdicion(${index}, 1)" class="w-6 h-6 rounded bg-blue-500/20 text-blue-300 font-bold hover:bg-blue-500/30">+</button>
          <button type="button" onclick="eliminarItemProgEdicion(${index})" class="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 ml-1">🗑️</button>
        </div>
      </div>
    `;
  });
}
window.renderizarItemsEdicionProgModal = renderizarItemsEdicionProgModal;

function modificarCantidadItemProgEdicion(index, delta) {
  window.currentEditingItems[index].cantidad += delta;
  if (window.currentEditingItems[index].cantidad <= 0) {
    window.currentEditingItems.splice(index, 1);
  }
  renderizarItemsEdicionProgModal();
}
window.modificarCantidadItemProgEdicion = modificarCantidadItemProgEdicion;

function eliminarItemProgEdicion(index) {
  window.currentEditingItems.splice(index, 1);
  renderizarItemsEdicionProgModal();
}
window.eliminarItemProgEdicion = eliminarItemProgEdicion;

function agregarItemEdicionProgModal() {
  const variedad = document.getElementById("selectNuevaVariedadProgEdicion").value;
  const tipoMasa = document.getElementById("selectNuevoTipoMasaProgEdicion").value;
  const cantidad = parseInt(document.getElementById("inputNuevaCantidadProgEdicion").value) || 1;

  const existente = window.currentEditingItems.find(x => x.variedad === variedad && x.tipoMasa === tipoMasa);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    window.currentEditingItems.push({
      id: Date.now() + Math.random(),
      variedad,
      tipoMasa,
      cantidad,
      preparado: false,
      estadoPago: "Pendiente"
    });
  }

  document.getElementById("inputNuevaCantidadProgEdicion").value = 1;
  renderizarItemsEdicionProgModal();
}
window.agregarItemEdicionProgModal = agregarItemEdicionProgModal;

function guardarEdicionProgramado() {
  const nombreNorm = document.getElementById("editProgNorm") ? document.getElementById("editProgNorm").value : "";
  const loteId = document.getElementById("editProgLoteId") ? document.getElementById("editProgLoteId").value : getLoteActivo().id;
  const nuevoNombre = document.getElementById("editProgCliente") ? document.getElementById("editProgCliente").value.trim() || "Cliente Programado" : "Cliente Programado";
  const fechaISO = document.getElementById("editProgFecha") ? document.getElementById("editProgFecha").value || obtenerFechaHoyISO() : obtenerFechaHoyISO();
  const fechaVisual = formatearFechaVisual(fechaISO);

  if (window.currentEditingItems.length === 0) {
    alert("El pedido debe contener al menos un wrap.");
    return;
  }

  // Eliminar ventas programadas anteriores de este cliente en este lote
  window.estadoApp.ventas = (window.estadoApp.ventas || []).filter(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    return !(v.loteId === loteId && nombreLimpio === nombreNorm && v.esProgramado);
  });

  const lote = (window.estadoApp.lotes || []).find(l => l.id === loteId) || getLoteActivo();
  const now = Date.now();

  window.currentEditingItems.forEach((it, idx) => {
    window.estadoApp.ventas.unshift({
      id: it.id || (now + idx),
      timestamp: now + idx,
      loteId: loteId,
      cliente: nuevoNombre,
      variedad: it.variedad,
      tipoMasa: it.tipoMasa || "Común",
      cantidad: it.cantidad,
      precioUnitario: lote.precioVenta,
      precioCompra: lote.precioCompra,
      metodoPago: "Efectivo",
      montoVuelto: 0,
      vueltoTransf: 0,
      estadoPago: "Pendiente",
      estadoEntrega: "Pendiente",
      preparado: false,
      tipoEntrega: "Retiro",
      direccionEnvio: "",
      fecha: fechaVisual,
      esProgramado: true
    });
  });

  guardarDatosLocales();
  cerrarModales();
  renderizarTodo();
}
window.guardarEdicionProgramado = guardarEdicionProgramado;

function activarPedidoProgramado(id) {
  const v = (window.estadoApp.ventas || []).find(x => x.id === id);
  if (v) {
    v.esProgramado = false;
    guardarDatosLocales();
    renderizarTodo();
  }
}
window.activarPedidoProgramado = activarPedidoProgramado;

function toggleEstadoPago(id) {
  const v = (window.estadoApp.ventas || []).find(x => x.id === id);
  if (v) { v.estadoPago = v.estadoPago === 'Pagado' ? 'Pendiente' : 'Pagado'; guardarDatosLocales(); renderizarTodo(); }
}
window.toggleEstadoPago = toggleEstadoPago;

function toggleEstadoEntrega(id) {
  const v = (window.estadoApp.ventas || []).find(x => x.id === id);
  if (v) { v.estadoEntrega = v.estadoEntrega === 'Entregado' ? 'Pendiente' : 'Entregado'; guardarDatosLocales(); renderizarTodo(); }
}
window.toggleEstadoEntrega = toggleEstadoEntrega;

function toggleEstadoPreparado(id) {
  const v = (window.estadoApp.ventas || []).find(x => x.id === id);
  if (v) {
    v.preparado = !v.preparado;
    guardarDatosLocales();
    renderizarTodo();
  }
}
window.toggleEstadoPreparado = toggleEstadoPreparado;

function eliminarVenta(id) {
  if (confirm("¿Estás seguro de eliminar este registro?")) {
    window.estadoApp.ventas = (window.estadoApp.ventas || []).filter(v => v.id !== id);
    guardarDatosLocales();
    renderizarTodo();
  }
}
window.eliminarVenta = eliminarVenta;

function eliminarPedidoClienteCompleto(nombreClienteNorm, loteId) {
  if (confirm(`¿Estás seguro de eliminar todo el pedido de este cliente?`)) {
    window.estadoApp.ventas = (window.estadoApp.ventas || []).filter(v => {
      let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      return !(v.loteId === loteId && nombreLimpio === nombreClienteNorm);
    });
    guardarDatosLocales();
    renderizarTodo();
  }
}
window.eliminarPedidoClienteCompleto = eliminarPedidoClienteCompleto;

function cambiarEstadoClientePago(nombreClienteNorm, loteId, nuevoEstado) {
  (window.estadoApp.ventas || []).forEach(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    if (v.loteId === loteId && nombreLimpio === nombreClienteNorm) {
      v.estadoPago = nuevoEstado;
    }
  });
  guardarDatosLocales();
  renderizarTodo();
}
window.cambiarEstadoClientePago = cambiarEstadoClientePago;

function cambiarEstadoClienteEntrega(nombreClienteNorm, loteId, nuevoEstado) {
  (window.estadoApp.ventas || []).forEach(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    if (v.loteId === loteId && nombreLimpio === nombreClienteNorm) {
      v.estadoEntrega = nuevoEstado;
      v.esProgramado = false;
    }
  });
  guardarDatosLocales();
  renderizarTodo();
}
window.cambiarEstadoClienteEntrega = cambiarEstadoClienteEntrega;

function moverPedidoAFuturo(nombreClienteNorm, loteId) {
  (window.estadoApp.ventas || []).forEach(v => {
    let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    if (v.loteId === loteId && nombreLimpio === nombreClienteNorm) {
      v.esProgramado = true;
      v.estadoEntrega = 'Pendiente';
    }
  });
  guardarDatosLocales();
  renderizarTodo();
}
window.moverPedidoAFuturo = moverPedidoAFuturo;

function reciclarPedidoCliente(nombreClienteNorm, loteId) {
  if (confirm(`¿Deseas devolver este pedido entregado a "Pendientes de entrega"?`)) {
    (window.estadoApp.ventas || []).forEach(v => {
      let nombreLimpio = (v.cliente || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (v.loteId === loteId && nombreLimpio === nombreClienteNorm) {
        v.estadoEntrega = 'Pendiente';
      }
    });
    guardarDatosLocales();
    renderizarTodo();
  }
}
window.reciclarPedidoCliente = reciclarPedidoCliente;

function toggleAcordeonCliente(clienteKey) {
  clientesDesplegados[clienteKey] = !clientesDesplegados[clienteKey];
  renderizarHistorialVentasSeparado();
}
window.toggleAcordeonCliente = toggleAcordeonCliente;

function toggleAcordeonClienteEntregado(clienteKey) {
  clientesEntregadosDesplegados[clienteKey] = !clientesEntregadosDesplegados[clienteKey];
  renderizarHistorialVentasSeparado();
}
window.toggleAcordeonClienteEntregado = toggleAcordeonClienteEntregado;

function toggleAcordeonClienteProgramado(clienteKey) {
  clientesProgramadosDesplegados[clienteKey] = !clientesProgramadosDesplegados[clienteKey];
  renderizarHistorialVentasSeparado();
}
window.toggleAcordeonClienteProgramado = toggleAcordeonClienteProgramado;

function toggleAcordeonDia(diaKey) {
  diasDesplegados[diaKey] = !diasDesplegados[diaKey];
  renderizarVentasPorDia();
}
window.toggleAcordeonDia = toggleAcordeonDia;

function abrirModalEditarVenta(id) {
  const venta = (window.estadoApp.ventas || []).find(x => x.id === id);
  if (!venta) return;

  document.getElementById("editVentaId").value = venta.id;
  document.getElementById("editVentaCliente").value = venta.cliente || "";
  document.getElementById("editVentaVariedad").value = venta.variedad || "Carne";
  document.getElementById("editVentaTipoMasa").value = venta.tipoMasa || "Común";
  document.getElementById("editVentaCantidad").value = venta.cantidad || 1;

  document.getElementById("modalEditarVenta").classList.remove("hidden");
}
window.abrirModalEditarVenta = abrirModalEditarVenta;

function guardarEdicionVenta() {
  const id = parseFloat(document.getElementById("editVentaId").value);
  const venta = (window.estadoApp.ventas || []).find(x => x.id === id);

  if (venta) {
    venta.cliente = document.getElementById("editVentaCliente").value.trim() || "Cliente Anónimo";
    venta.variedad = document.getElementById("editVentaVariedad").value;
    venta.tipoMasa = document.getElementById("editVentaTipoMasa").value;
    venta.cantidad = parseInt(document.getElementById("editVentaCantidad").value) || 1;

    guardarDatosLocales();
    cerrarModales();
    renderizarTodo();
  }
}
window.guardarEdicionVenta = guardarEdicionVenta;

function renderizarTodo() {
  renderizarStockPublico();
  renderizarImagenes();
  if (isAdmin) {
    calcularTotalesVenta();
    renderizarVariedades();
    renderizarTablaStock();
    renderizarRendimientoSabores();
    renderizarResumenFinanciero();
    renderizarHistorialVentasSeparado();
    renderizarVentasPorDia();
  }
}

function renderizarTablaStock() {
  const tbody = document.getElementById("tablaStock");
  if (!tbody) return;
  tbody.innerHTML = "";
  const lote = getLoteActivo();
  const ventasEntregadas = (window.estadoApp.ventas || []).filter(x => !x.esProgramado && x.estadoEntrega === 'Entregado');
  
  VARIEDADES.forEach(v => {
    const iniC = getStockComun(lote, v);
    const iniI = getStockIntegral(lote, v);
    const isComunProx = isComunProximamente(lote, v);
    const isIntegralProx = isIntegralProximamente(lote, v);
    const vendC = isComunProx ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === v && x.tipoMasa === 'Común').reduce((a, c) => a + c.cantidad, 0);
    const vendI = isIntegralProx ? 0 : ventasEntregadas.filter(x => x.loteId === lote.id && x.variedad === v && x.tipoMasa === 'Integral').reduce((a, c) => a + c.cantidad, 0);
    const dispC = isComunProx ? 0 : (iniC - vendC);
    const dispI = isIntegralProx ? 0 : (iniI - vendI);

    tbody.innerHTML += `
      <tr class="hover:bg-slate-800/50">
        <td class="py-2.5 px-2 font-semibold text-slate-200">${v}</td>
        <td class="py-2.5 px-2 text-center text-slate-300">${isComunProx ? '🌾 Próximamente' : dispC <= 0 ? '🌾 Sin Stock' : '🌾 ' + dispC + ' / ' + iniC}</td>
        <td class="py-2.5 px-2 text-center text-amber-300">${isIntegralProx ? '🍞 Próximamente' : dispI <= 0 ? '🍞 Sin Stock' : '🍞 ' + dispI + ' / ' + iniI}</td>
      </tr>
    `;
  });
}

function renderizarRendimientoSabores() {
  const container = document.getElementById("contenedorRendimientoSabores");
  if (!container) return;
  container.innerHTML = "";
  
  const lote = getLoteActivo();
  const ventasEntregadas = (window.estadoApp.ventas || []).filter(v => v.loteId === lote.id && !v.esProgramado && v.estadoEntrega === 'Entregado');
  document.getElementById("textoLoteActivoRendimiento").textContent = lote.id;

  const datosSabores = VARIEDADES.map(v => {
    const iniC = getStockComun(lote, v);
    const iniI = getStockIntegral(lote, v);
    const isComunProx = isComunProximamente(lote, v);
    const isIntegralProx = isIntegralProximamente(lote, v);
    const inicial = (isComunProx ? 0 : iniC) + (isIntegralProx ? 0 : iniI);

    const vendidos = ventasEntregadas.filter(x => x.variedad === v).reduce((a, c) => a + c.cantidad, 0);
    const porcentaje = inicial > 0 ? Math.min(100, Math.round((vendidos / inicial) * 100)) : 0;
    return { variedad: v, inicial, vendidos, porcentaje };
  }).sort((a, b) => b.porcentaje - a.porcentaje);

  datosSabores.forEach(item => {
    container.innerHTML += `
      <div class="space-y-1">
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold text-slate-200">${item.variedad}</span>
          <span class="font-black text-amber-400">${item.porcentaje}% <span class="text-slate-400 font-normal">(${item.vendidos}/${item.inicial} un.)</span></span>
        </div>
        <div class="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
          <div class="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500" style="width: ${item.porcentaje}%"></div>
        </div>
      </div>
    `;
  });
}

function renderizarResumenFinanciero() {
  const lote = getLoteActivo();
  
  const ventasPagadasEntregadas = (window.estadoApp.ventas || []).filter(v => v.loteId === lote.id && !v.esProgramado && v.estadoEntrega === 'Entregado' && v.estadoPago === 'Pagado');
  const ventasFiadasEntregadas = (window.estadoApp.ventas || []).filter(v => v.loteId === lote.id && !v.esProgramado && v.estadoEntrega === 'Entregado' && v.estadoPago !== 'Pagado');

  let totalVendidos = 0;
  let efectivoBruto = 0;
  let transfBrutaTotal = 0;
  let totalFiado = 0;

  ventasPagadasEntregadas.forEach(v => {
    const monto = v.cantidad * (v.precioUnitario || lote.precioVenta);
    totalVendidos += v.cantidad;
    if (v.metodoPago === 'Efectivo') {
      efectivoBruto += monto;
    } else {
      transfBrutaTotal += monto;
    }
  });

  ventasFiadasEntregadas.forEach(v => {
    const monto = v.cantidad * (v.precioUnitario || lote.precioVenta);
    totalVendidos += v.cantidad;
    totalFiado += monto;
  });

  const ventaBrutaTotal = efectivoBruto + transfBrutaTotal;

  let totalStockInicial = 0;
  if (lote.stockInicial) {
    Object.keys(lote.stockInicial).forEach(v => {
      const val = lote.stockInicial[v];
      const isComunProx = isComunProximamente(lote, v);
      const isIntegralProx = isIntegralProximamente(lote, v);
      if (typeof val === 'number') {
        totalStockInicial += val;
      } else if (typeof val === 'object') {
        totalStockInicial += (isComunProx ? 0 : (val.comun || 0)) + (isIntegralProx ? 0 : (val.integral || 0));
      }
    });
  } else {
    totalStockInicial = 80;
  }
  const totalReinversion = totalStockInicial * (lote.precioCompra || 3050);

  const costoTotalPagados = totalVendidos * (lote.precioCompra || 3050);
  const gananciaNetaTotal = Math.max(0, ventaBrutaTotal - costoTotalPagados);
  const efectivoNeto = Math.max(0, efectivoBruto - (totalVendidos * (lote.precioCompra || 3050) * (efectivoBruto / (ventaBrutaTotal || 1))));
  const transfNeta = Math.max(0, gananciaNetaTotal - efectivoNeto);

  const arqueoEfectivo = efectivoBruto;
  const arqueoTransf = transfBrutaTotal;

  document.getElementById("resumenVendidosBadge").textContent = `${totalVendidos} wraps vendidos`;
  document.getElementById("resumenBrutaTotal").textContent = `$${ventaBrutaTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById("resumenEfectivoBruto").textContent = `$${efectivoBruto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById("resumenTransfBruta").textContent = `$${transfBrutaTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  document.getElementById("resumenNetaTotal").textContent = `$${gananciaNetaTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById("resumenEfectivoNeto").textContent = `$${efectivoNeto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById("resumenTransfNeta").textContent = `$${transfNeta.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  document.getElementById("resumenReinversion").textContent = `$${totalReinversion.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById("resumenFiado").textContent = `$${totalFiado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  document.getElementById("resumenCajaEfectivoReal").textContent = `$${arqueoEfectivo.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById("resumenBancoReal").textContent = `$${arqueoTransf.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function renderizarHistorialVentasSeparado() {
  const containerPendientes = document.getElementById("contenedorPendientesAgrupado");
  const containerProgramados = document.getElementById("contenedorProgramadosAgrupado");
  const containerCompletados = document.getElementById("contenedorCompletadosAgrupado");

  if (!containerPendientes || !containerCompletados) return;

  containerPendientes.innerHTML = "";
  if(containerProgramados) containerProgramados.innerHTML = "";
  containerCompletados.innerHTML = "";

  const lote = getLoteActivo();
  
  const ventasLote = (window.estadoApp.ventas || [])
    .filter(v => v.loteId === lote.id)
    .sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));

  let countPendientes = 0;
  let countProgramados = 0;
  let countCompletados = 0;

  const wrapsPendientesPorSabor = { Bondiola: 0, Carne: 0, Caprese: 0, Pollo: 0 };
  let totalWrapsSinPreparar = 0;
  const mapaClientesPendientes = {};
  const mapaClientesProgramados = {};
  const mapaClientesEntregados = {};

  ventasLote.forEach(v => {
    const total = v.cantidad * (v.precioUnitario || lote.precioVenta);
    const entrega = v.estadoEntrega || 'Pendiente';
    const pago = v.estadoPago || 'Pagado';
    const preparado = v.preparado === true;
    const esProg = v.esProgramado === true;

    let nombreLimpio = (v.cliente || 'Cliente Anónimo').replace(/\s*\([^)]*\)/g, '').trim();
    if (!nombreLimpio) nombreLimpio = "Cliente Anónimo";
    const keyNormalizada = nombreLimpio.toLowerCase();

    if (esProg) {
      countProgramados++;
      if (!mapaClientesProgramados[keyNormalizada]) {
        mapaClientesProgramados[keyNormalizada] = {
          nombre: nombreLimpio,
          nombreNorm: keyNormalizada,
          loteId: v.loteId,
          fecha: v.fecha,
          tipoEntrega: v.tipoEntrega || 'Retiro',
          direccionEnvio: v.direccionEnvio || '',
          metodosPago: new Set(),
          items: [],
          totalWraps: 0,
          montoTotal: 0,
          minTimestamp: v.timestamp || v.id || 0
        };
      }
      mapaClientesProgramados[keyNormalizada].items.push(v);
      mapaClientesProgramados[keyNormalizada].totalWraps += v.cantidad;
      mapaClientesProgramados[keyNormalizada].montoTotal += total;
      mapaClientesProgramados[keyNormalizada].metodosPago.add(v.metodoPago);
    } else if (entrega === 'Entregado') {
      countCompletados++;
      if (!mapaClientesEntregados[keyNormalizada]) {
        mapaClientesEntregados[keyNormalizada] = {
          nombre: nombreLimpio,
          nombreNorm: keyNormalizada,
          loteId: v.loteId,
          fecha: v.fecha,
          tipoEntrega: v.tipoEntrega || 'Retiro',
          direccionEnvio: v.direccionEnvio || '',
          metodosPago: new Set(),
          items: [],
          totalWraps: 0,
          montoTotal: 0,
          minTimestamp: v.timestamp || v.id || 0
        };
      }
      mapaClientesEntregados[keyNormalizada].items.push(v);
      mapaClientesEntregados[keyNormalizada].totalWraps += v.cantidad;
      mapaClientesEntregados[keyNormalizada].montoTotal += total;
      mapaClientesEntregados[keyNormalizada].metodosPago.add(v.metodoPago);
    } else {
      countPendientes++;

      if (!preparado) {
        totalWrapsSinPreparar += v.cantidad;
        if (wrapsPendientesPorSabor[v.variedad] !== undefined) {
          wrapsPendientesPorSabor[v.variedad] += v.cantidad;
        } else {
          wrapsPendientesPorSabor[v.variedad] = v.cantidad;
        }
      }

      if (!mapaClientesPendientes[keyNormalizada]) {
        mapaClientesPendientes[keyNormalizada] = {
          nombre: nombreLimpio,
          nombreNorm: keyNormalizada,
          loteId: v.loteId,
          fecha: v.fecha,
          tipoEntrega: v.tipoEntrega || 'Retiro',
          direccionEnvio: v.direccionEnvio || '',
          metodosPago: new Set(),
          items: [],
          totalWraps: 0,
          montoTotal: 0,
          todosPagados: true,
          todosEntregados: false,
          minTimestamp: v.timestamp || v.id || 0
        };
      }

      mapaClientesPendientes[keyNormalizada].items.push(v);
      mapaClientesPendientes[keyNormalizada].totalWraps += v.cantidad;
      mapaClientesPendientes[keyNormalizada].montoTotal += total;
      mapaClientesPendientes[keyNormalizada].metodosPago.add(v.metodoPago);

      if (pago !== 'Pagado') mapaClientesPendientes[keyNormalizada].todosPagados = false;
    }
  });

  const elLabelResumen = document.getElementById("labelResumenTotalesWraps");
  const elGridChips = document.getElementById("gridChipsSaboresPendientes");

  if (elLabelResumen && elGridChips) {
    elLabelResumen.innerHTML = `
      <span>Wraps Faltantes por Armar: <strong class="text-amber-400 text-lg sm:text-xl">${totalWrapsSinPreparar}</strong></span>
    `;

    elGridChips.innerHTML = `
      <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
        <span class="text-amber-400">B:</span> <span class="text-slate-100">${wrapsPendientesPorSabor.Bondiola || 0}</span>
      </div>
      <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
        <span class="text-amber-400">C:</span> <span class="text-slate-100">${wrapsPendientesPorSabor.Carne || 0}</span>
      </div>
      <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
        <span class="text-amber-400">Ca:</span> <span class="text-slate-100">${wrapsPendientesPorSabor.Caprese || 0}</span>
      </div>
      <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
        <span class="text-amber-400">P:</span> <span class="text-slate-100">${wrapsPendientesPorSabor.Pollo || 0}</span>
      </div>
    `;
  }

  const listaClientesPendientes = Object.values(mapaClientesPendientes).sort((a, b) => b.minTimestamp - a.minTimestamp);

  if (listaClientesPendientes.length === 0) {
    containerPendientes.innerHTML = `
      <div class="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-sm italic">
        🎉 No hay pedidos pendientes de entrega.
      </div>
    `;
  } else {
    listaClientesPendientes.forEach(clienteObj => {
      const clienteKey = `cli_${clienteObj.nombreNorm.replace(/\s+/g, '_')}`;
      const isExpanded = clientesDesplegados[clienteKey] === true;

      const conteoVariedades = {};
      let todosPreparados = clienteObj.items.length > 0;

      clienteObj.items.forEach(it => {
        const keyItem = `${it.variedad} (${it.tipoMasa || 'Común'})`;
        conteoVariedades[keyItem] = (conteoVariedades[keyItem] || 0) + it.cantidad;
        if (!it.preparado) todosPreparados = false;
      });

      const resumenTexto = Object.entries(conteoVariedades)
        .map(([varName, qty]) => `${qty} ${varName}`)
        .join(" • ");

      const metodosPagoStr = Array.from(clienteObj.metodosPago).join(" / ");
      
      const badgeEntregaHTML = clienteObj.tipoEntrega === 'Envio'
        ? `<span class="text-[10px] bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-800/80">🛵 Envío: ${clienteObj.direccionEnvio || 'Sin dirección'}</span>`
        : `<span class="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">🏃‍♂️ Retira en local</span>`;

      const badgePreparadoHTML = todosPreparados
        ? `<span class="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800/80">✅ Preparado</span>`
        : `<span class="text-[10px] bg-amber-950/80 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-800/80">⏳ No preparado</span>`;

      let filasDetalleHTML = "";
      clienteObj.items.forEach(it => {
        const sub = it.cantidad * (it.precioUnitario || lote.precioVenta);
        const prep = it.preparado === true;

        filasDetalleHTML += `
          <div class="flex flex-wrap items-center justify-between text-xs p-2.5 rounded-lg border transition gap-2 ${prep ? 'bg-slate-950/40 border-slate-800/50 opacity-70' : 'bg-slate-950 border-slate-800'}">
            <div class="flex items-center gap-2">
              <span class="font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">${it.cantidad}x</span>
              <span class="font-semibold text-slate-200 ${prep ? 'line-through text-slate-400' : ''}">Wrap de ${it.variedad} <span class="text-amber-400 font-bold">(${it.tipoMasa || 'Común'})</span></span>
              <span class="text-slate-500">($${sub.toLocaleString('es-AR')})</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="abrirModalEditarVenta(${it.id})" class="px-2 py-0.5 rounded font-bold bg-slate-800 text-amber-400 border border-slate-700" title="Editar ítem individual">✏️</button>
              <button type="button" onclick="toggleEstadoPreparado(${it.id})" class="px-2.5 py-1 rounded font-bold transition text-xs ${prep ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}">
                ${prep ? '✓' : '✕'}
              </button>
              <button type="button" onclick="toggleEstadoPago(${it.id})" class="px-2 py-0.5 rounded font-bold ${it.estadoPago === 'Pagado' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}">
                ${it.estadoPago === 'Pagado' ? '✅ Pago' : '❌ No Pagado'}
              </button>
              <button type="button" onclick="eliminarVenta(${it.id})" class="text-rose-400 hover:text-rose-300 font-bold px-1">✕</button>
            </div>
          </div>
        `;
      });

      containerPendientes.innerHTML += `
        <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition">
          <div class="p-3 sm:p-4 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60">
            <div class="flex items-center gap-3 cursor-pointer select-none w-full sm:w-auto" onclick="toggleAcordeonCliente('${clienteKey}')">
              <span class="text-slate-400 font-bold text-sm transform transition duration-200 ${isExpanded ? 'rotate-90' : ''}">▶</span>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-black text-slate-100 text-base">${clienteObj.nombre}</h3>
                  <span class="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full">${clienteObj.fecha}</span>
                  ${badgeEntregaHTML}
                  ${badgePreparadoHTML}
                </div>
                <p class="text-xs text-amber-300 font-medium mt-0.5">${clienteObj.totalWraps} ${clienteObj.totalWraps === 1 ? 'wrap' : 'wraps'} <span class="text-slate-500">(${resumenTexto})</span></p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <div class="text-left sm:text-right shrink-0">
                <span class="block text-xs font-black text-emerald-400 text-base">$${clienteObj.montoTotal.toLocaleString('es-AR')}</span>
                <span class="block text-[10px] font-bold text-slate-400 uppercase">${metodosPagoStr}</span>
              </div>

              <div class="flex flex-wrap items-center gap-1.5">
                <button type="button" onclick="abrirModalEditarCliente('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow" title="Editar / Agregar o quitar wraps">✏️ Editar Wraps</button>
                <button type="button" onclick="moverPedidoAFuturo('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow" title="Pasar a pedido a futuro">🗓️ Futuro</button>
                <button type="button" onclick="eliminarPedidoClienteCompleto('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow">🗑️</button>
                
                ${!clienteObj.todosPagados ? `
                  <button type="button" onclick="cambiarEstadoClientePago('${clienteObj.nombreNorm}', '${clienteObj.loteId}', 'Pagado')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow">✅ Cobrar</button>
                ` : `
                  <span class="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-800">✅ Cobrado</span>
                `}

                <button type="button" onclick="cambiarEstadoClienteEntrega('${clienteObj.nombreNorm}', '${clienteObj.loteId}', 'Entregado')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow">📦 Marcar Entregado</button>
              </div>
            </div>
          </div>

          <div class="p-3 bg-slate-900/30 space-y-2 ${isExpanded ? '' : 'hidden'}">
            ${filasDetalleHTML}
          </div>
        </div>
      `;
    });
  }

  if(containerProgramados) {
    const listaClientesProgramados = Object.values(mapaClientesProgramados).sort((a, b) => b.minTimestamp - a.minTimestamp);

    if (listaClientesProgramados.length === 0) {
      containerProgramados.innerHTML = `
        <div class="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-sm italic">
          🗓️ No hay pendientes a futuro registrados.
        </div>
      `;
    } else {
      listaClientesProgramados.forEach(clienteObj => {
        const clienteKey = `cli_prog_${clienteObj.nombreNorm.replace(/\s+/g, '_')}`;
        const isExpanded = clientesProgramadosDesplegados[clienteKey] === true;

        const conteoVariedades = {};
        clienteObj.items.forEach(it => {
          const keyItem = `${it.variedad} (${it.tipoMasa || 'Común'})`;
          conteoVariedades[keyItem] = (conteoVariedades[keyItem] || 0) + it.cantidad;
        });

        const resumenTexto = Object.entries(conteoVariedades)
          .map(([varName, qty]) => `${qty} ${varName}`)
          .join(" • ");

        let filasDetalleHTML = "";
        clienteObj.items.forEach(it => {
          const sub = it.cantidad * (it.precioUnitario || lote.precioVenta);
          filasDetalleHTML += `
            <div class="flex flex-wrap items-center justify-between text-xs p-2.5 rounded-lg border bg-slate-950 border-slate-800 gap-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">${it.cantidad}x</span>
                <span class="font-semibold text-slate-200">Wrap de ${it.variedad} <span class="text-blue-300 font-bold">(${it.tipoMasa || 'Común'})</span></span>
                <span class="text-slate-500">($${sub.toLocaleString('es-AR')})</span>
              </div>
              <button type="button" onclick="eliminarVenta(${it.id})" class="text-rose-400 hover:text-rose-300 font-bold px-1">✕</button>
            </div>
          `;
        });

        containerProgramados.innerHTML += `
          <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition">
            <div class="p-3 sm:p-4 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60">
              <div class="flex items-center gap-3 cursor-pointer select-none w-full sm:w-auto" onclick="toggleAcordeonClienteProgramado('${clienteKey}')">
                <span class="text-slate-400 font-bold text-sm transform transition duration-200 ${isExpanded ? 'rotate-90' : ''}">▶</span>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-black text-slate-100 text-base">${clienteObj.nombre}</h3>
                    <span class="text-[10px] bg-blue-950 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-800">Fecha prog: ${clienteObj.fecha}</span>
                  </div>
                  <p class="text-xs text-blue-300 font-medium mt-0.5">${clienteObj.totalWraps} wraps <span class="text-slate-500">(${resumenTexto})</span></p>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                <span class="text-sm font-black text-emerald-400">$${clienteObj.montoTotal.toLocaleString('es-AR')}</span>
                <div class="flex items-center gap-1.5">
                  <button type="button" onclick="abrirModalEditarProgramado('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow" title="Editar / Agregar o quitar wraps">✏️ Editar Wraps</button>
                  <button type="button" onclick="cambiarEstadoClienteEntrega('${clienteObj.nombreNorm}', '${clienteObj.loteId}', 'Entregado')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow flex items-center gap-1.5">
                    📦 Entregar
                  </button>
                </div>
              </div>
            </div>
            <div class="p-3 bg-slate-900/30 space-y-2 ${isExpanded ? '' : 'hidden'}">
              ${filasDetalleHTML}
            </div>
          </div>
        `;
      });
    }
  }

  const listaClientesEntregados = Object.values(mapaClientesEntregados).sort((a, b) => b.minTimestamp - a.minTimestamp);

  if (listaClientesEntregados.length === 0) {
    containerCompletados.innerHTML = `
      <div class="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-sm italic">
        📭 No hay pedidos entregados todavía.
      </div>
    `;
  } else {
    listaClientesEntregados.forEach(clienteObj => {
      const clienteKey = `cli_ent_${clienteObj.nombreNorm.replace(/\s+/g, '_')}`;
      const isExpanded = clientesEntregadosDesplegados[clienteKey] === true;

      const conteoVariedades = {};
      let todosPagados = true;
      clienteObj.items.forEach(it => {
        const keyItem = `${it.variedad} (${it.tipoMasa || 'Común'})`;
        conteoVariedades[keyItem] = (conteoVariedades[keyItem] || 0) + it.cantidad;
        if (it.estadoPago !== 'Pagado') todosPagados = false;
      });

      const resumenTexto = Object.entries(conteoVariedades)
        .map(([varName, qty]) => `${qty} ${varName}`)
        .join(" • ");

      const badgePagoHTML = todosPagados
        ? `<span class="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800/80">✅ Pagado</span>`
        : `<span class="text-[10px] bg-rose-950 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-800/80">❌ No Pagado</span>`;

      let filasDetalleHTML = "";
      clienteObj.items.forEach(it => {
        const sub = it.cantidad * (it.precioUnitario || lote.precioVenta);
        filasDetalleHTML += `
          <div class="flex flex-wrap items-center justify-between text-xs p-2.5 rounded-lg border bg-slate-950 border-slate-800 gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">${it.cantidad}x</span>
              <span class="font-semibold text-slate-200">Wrap de ${it.variedad} <span class="text-emerald-400 font-bold">(${it.tipoMasa || 'Común'})</span></span>
              <span class="text-slate-500">($${sub.toLocaleString('es-AR')})</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="toggleEstadoPago(${it.id})" class="px-2 py-0.5 rounded font-bold ${it.estadoPago === 'Pagado' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}">
                ${it.estadoPago === 'Pagado' ? '✅ Pagado' : '❌ No Pagado'}
              </button>
              <button type="button" onclick="eliminarVenta(${it.id})" class="text-rose-400 hover:text-rose-300 font-bold px-1">✕</button>
            </div>
          </div>
        `;
      });

      containerCompletados.innerHTML += `
        <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition">
          <div class="p-3 sm:p-4 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60">
            <div class="flex items-center gap-3 cursor-pointer select-none w-full sm:w-auto" onclick="toggleAcordeonClienteEntregado('${clienteKey}')">
              <span class="text-slate-400 font-bold text-sm transform transition duration-200 ${isExpanded ? 'rotate-90' : ''}">▶</span>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-black text-slate-100 text-base">${clienteObj.nombre}</h3>
                  <span class="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full">${clienteObj.fecha}</span>
                  ${badgePagoHTML}
                </div>
                <p class="text-xs text-emerald-400 font-medium mt-0.5">${clienteObj.totalWraps} wraps <span class="text-slate-500">(${resumenTexto})</span></p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
              <span class="text-sm font-black text-emerald-400">$${clienteObj.montoTotal.toLocaleString('es-AR')}</span>
              <button type="button" onclick="abrirModalEditarCliente('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow" title="Editar pedido">✏️ Editar</button>
              <button type="button" onclick="reciclarPedidoCliente('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow">♻️ Reciclar</button>
              <button type="button" onclick="eliminarPedidoClienteCompleto('${clienteObj.nombreNorm}', '${clienteObj.loteId}')" class="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow">🗑️</button>
            </div>
          </div>
          <div class="p-3 bg-slate-900/30 space-y-2 ${isExpanded ? '' : 'hidden'}">
            ${filasDetalleHTML}
          </div>
        </div>
      `;
    });
  }

  document.getElementById("resumenTotalPendientesNum").textContent = `${countPendientes} pendientes`;
  const elProgNum = document.getElementById("resumenTotalProgramadosNum");
  if(elProgNum) elProgNum.textContent = `${countProgramados} programados`;
  document.getElementById("resumenTotalCompletadosNum").textContent = `${countCompletados} entregados`;
}

function renderizarVentasPorDia() {
  const container = document.getElementById("contenedorVentasPorDia");
  if (!container) return;
  container.innerHTML = "";

  const lote = getLoteActivo();
  const ventasLote = (window.estadoApp.ventas || []).filter(v => v.loteId === lote.id && !v.esProgramado);

  const mapaDias = {};

  ventasLote.forEach(v => {
    const fechaKey = v.fecha || "Sin fecha";
    if (!mapaDias[fechaKey]) {
      mapaDias[fechaKey] = {
        fecha: fechaKey,
        totalWraps: 0,
        montoTotal: 0,
        sabores: { Bondiola: 0, Carne: 0, Caprese: 0, Pollo: 0 },
        items: []
      };
    }

    const sub = v.cantidad * (v.precioUnitario || lote.precioVenta);
    mapaDias[fechaKey].totalWraps += v.cantidad;
    mapaDias[fechaKey].montoTotal += sub;
    
    if (mapaDias[fechaKey].sabores[v.variedad] !== undefined) {
      mapaDias[fechaKey].sabores[v.variedad] += v.cantidad;
    } else {
      mapaDias[fechaKey].sabores[v.variedad] = v.cantidad;
    }

    mapaDias[fechaKey].items.push(v);
  });

  const listaDias = Object.values(mapaDias);
  document.getElementById("resumenDiasTotalNum").textContent = `${listaDias.length} días registrados`;

  if (listaDias.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-sm italic">
        📅 No hay ventas registradas para agrupar por día.
      </div>
    `;
    return;
  }

  listaDias.forEach(diaObj => {
    const diaKey = `dia_${diaObj.fecha.replace(/[/]/g, '_')}`;
    const isExpanded = diasDesplegados[diaKey] === true;

    let itemsDiaHTML = "";
    diaObj.items.forEach(it => {
      const sub = it.cantidad * (it.precioUnitario || lote.precioVenta);
      itemsDiaHTML += `
        <div class="flex flex-wrap items-center justify-between text-xs p-2.5 rounded-lg border bg-slate-950 border-slate-800 gap-2">
          <div>
            <span class="font-bold text-slate-200">${it.cliente || 'Cliente Anónimo'}</span>
            <span class="text-amber-400 font-bold ml-2">${it.cantidad}x ${it.variedad} (${it.tipoMasa || 'Común'})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-emerald-400">$${sub.toLocaleString('es-AR')}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML += `
      <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition">
        <div class="p-4 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60">
          
          <div class="flex items-center gap-3 cursor-pointer select-none w-full sm:w-auto" onclick="toggleAcordeonDia('${diaKey}')">
            <span class="text-slate-400 font-bold text-sm transform transition duration-200 ${isExpanded ? 'rotate-90' : ''}">▶</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-black text-slate-100 text-base">🗓️ ${diaObj.fecha}</h3>
                <span class="text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/50">${diaObj.totalWraps} wraps</span>
              </div>
              <span class="block text-xs font-bold text-emerald-400 mt-1">Total recaudado: $${diaObj.montoTotal.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
              <span class="text-amber-400">B:</span> <span class="text-slate-100">${diaObj.sabores.Bondiola || 0}</span>
            </div>
            <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
              <span class="text-amber-400">C:</span> <span class="text-slate-100">${diaObj.sabores.Carne || 0}</span>
            </div>
            <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
              <span class="text-amber-400">Ca:</span> <span class="text-slate-100">${diaObj.sabores.Caprese || 0}</span>
            </div>
            <div class="flex items-center gap-1.5 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
              <span class="text-amber-400">P:</span> <span class="text-slate-100">${diaObj.sabores.Pollo || 0}</span>
            </div>
          </div>

        </div>

        <div class="p-3 bg-slate-900/30 space-y-2 ${isExpanded ? '' : 'hidden'}">
          ${itemsDiaHTML}
        </div>
      </div>
    `;
  });
}

function cerrarModales() {
  document.getElementById("modalNuevoLote").classList.add("hidden");
  document.getElementById("modalRenombrarLote").classList.add("hidden");
  document.getElementById("modalEditarStock").classList.add("hidden");
  document.getElementById("modalEditarVenta").classList.add("hidden");
  document.getElementById("modalEditarCliente").classList.add("hidden");
  const mProg = document.getElementById("modalEditarProgramado");
  if(mProg) mProg.classList.add("hidden");
}
window.cerrarModales = cerrarModales;

function abrirModalNuevoLote() {
  const container = document.getElementById("inputsNuevoStock");
  container.innerHTML = "";
  VARIEDADES.forEach(v => {
    container.innerHTML += `
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <span class="block text-xs font-bold text-amber-400 uppercase">${v}</span>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-slate-400 uppercase">🌾 Común</label>
            <input type="number" id="nuevoStock_${v}_comun" value="10" min="0" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-100">
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 uppercase">🍞 Integral</label>
            <input type="number" id="nuevoStock_${v}_integral" value="10" min="0" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-100">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
          <div class="flex items-center gap-1.5">
            <input type="checkbox" id="nuevoProx_${v}_comun" class="w-3.5 h-3.5 rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-amber-500">
            <label for="nuevoProx_${v}_comun" class="text-[10px] text-slate-300 font-semibold cursor-pointer">Próximamente Común</label>
          </div>
          <div class="flex items-center gap-1.5">
            <input type="checkbox" id="nuevoProx_${v}_integral" class="w-3.5 h-3.5 rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-amber-500">
            <label for="nuevoProx_${v}_integral" class="text-[10px] text-amber-300 font-semibold cursor-pointer">Próximamente Integral</label>
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("modalNuevoLote").classList.remove("hidden");
}
window.abrirModalNuevoLote = abrirModalNuevoLote;

function crearNuevoLote() {
  const nombre = document.getElementById("inputNombreNuevoLote").value.trim() || `Lote ${window.estadoApp.lotes.length + 1}`;
  const precioVenta = parseFloat(document.getElementById("nuevoPrecioVenta").value) || 5700;
  const precioCompra = parseFloat(document.getElementById("nuevoPrecioCompra").value) || 3050;
  
  const stockInicial = {};
  VARIEDADES.forEach(v => {
    stockInicial[v] = {
      comun: parseInt(document.getElementById(`nuevoStock_${v}_comun`).value) || 0,
      integral: parseInt(document.getElementById(`nuevoStock_${v}_integral`).value) || 0,
      comunProx: document.getElementById(`nuevoProx_${v}_comun`).checked,
      integralProx: document.getElementById(`nuevoProx_${v}_integral`).checked
    };
  });
  
  if (!window.estadoApp.lotes) window.estadoApp.lotes = [];
  window.estadoApp.lotes.forEach(l => l.activo = false);
  window.estadoApp.lotes.unshift({ id: nombre, activo: true, precioVenta, precioCompra, stockInicial });
  
  guardarDatosLocales(); cerrarModales(); renderizarSelectorLotes(); renderizarTodo();
}
window.crearNuevoLote = crearNuevoLote;

function abrirModalEditarStock() {
  const lote = getLoteActivo();
  document.getElementById("editPrecioVenta").value = lote.precioVenta;
  document.getElementById("editPrecioCompra").value = lote.precioCompra;

  const container = document.getElementById("inputsEditarStock");
  container.innerHTML = "";
  VARIEDADES.forEach(v => {
    const c = getStockComun(lote, v);
    const i = getStockIntegral(lote, v);
    const proxC = isComunProximamente(lote, v);
    const proxI = isIntegralProximamente(lote, v);

    container.innerHTML += `
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <span class="block text-xs font-bold text-amber-400 uppercase">${v}</span>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-slate-400 uppercase">🌾 Común</label>
            <input type="number" id="editStock_${v}_comun" value="${c}" min="0" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-100">
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 uppercase">🍞 Integral</label>
            <input type="number" id="editStock_${v}_integral" value="${i}" min="0" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-100">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
          <div class="flex items-center gap-1.5">
            <input type="checkbox" id="editProx_${v}_comun" ${proxC ? 'checked' : ''} class="w-3.5 h-3.5 rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-amber-500">
            <label for="editProx_${v}_comun" class="text-[10px] text-slate-300 font-semibold cursor-pointer">Próximamente Común</label>
          </div>
          <div class="flex items-center gap-1.5">
            <input type="checkbox" id="editProx_${v}_integral" ${proxI ? 'checked' : ''} class="w-3.5 h-3.5 rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-amber-500">
            <label for="editProx_${v}_integral" class="text-[10px] text-amber-300 font-semibold cursor-pointer">Próximamente Integral</label>
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("modalEditarStock").classList.remove("hidden");
}
window.abrirModalEditarStock = abrirModalEditarStock;

function guardarEdicionStock() {
  const lote = getLoteActivo();
  lote.precioVenta = parseFloat(document.getElementById("editPrecioVenta").value) || lote.precioVenta;
  lote.precioCompra = parseFloat(document.getElementById("editPrecioCompra").value) || lote.precioCompra;

  delete lote.comunProximamente;
  delete lote.integralProximamente;

  if (!lote.stockInicial) lote.stockInicial = {};
  VARIEDADES.forEach(v => {
    lote.stockInicial[v] = {
      comun: parseInt(document.getElementById(`editStock_${v}_comun`).value) || 0,
      integral: parseInt(document.getElementById(`editStock_${v}_integral`).value) || 0,
      comunProx: document.getElementById(`editProx_${v}_comun`).checked,
      integralProx: document.getElementById(`editProx_${v}_integral`).checked
    };
  });
  
  guardarDatosLocales(); cerrarModales(); renderizarTodo();
}
window.guardarEdicionStock = guardarEdicionStock;

function exportarJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.estadoApp, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `respaldo_wraps_pos.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
window.exportarJSON = exportarJSON;

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.lotes && Array.isArray(data.lotes)) {
        window.estadoApp.lotes = data.lotes;
      }
      
      if (data.ventas && Array.isArray(data.ventas)) {
        window.estadoApp.ventas = data.ventas.map(v => ({
          id: v.id || Date.now() + Math.random(),
          timestamp: v.timestamp || v.id || Date.now(),
          loteId: v.loteId || (window.estadoApp.lotes[0] ? window.estadoApp.lotes[0].id : "Lote Principal"),
          cliente: v.cliente || "Cliente Anónimo",
          variedad: v.variedad || "Carne",
          tipoMasa: v.tipoMasa || "Común",
          cantidad: parseInt(v.cantidad) || 1,
          precioUnitario: parseFloat(v.precioUnitario) || 5700,
          precioCompra: parseFloat(v.precioCompra) || 3050,
          metodoPago: v.metodoPago || "Efectivo",
          montoVuelto: parseFloat(v.montoVuelto) || 0,
          vueltoTransf: parseFloat(v.vueltoTransf) || 0,
          estadoPago: v.estadoPago || "Pagado",
          estadoEntrega: v.estadoEntrega || "Pendiente",
          preparado: v.preparado || false,
          tipoEntrega: v.tipoEntrega || "Retiro",
          direccionEnvio: v.direccionEnvio || "",
          fecha: formatearFechaVisual(v.fecha) || formatearFechaVisual(obtenerFechaHoyISO()),
          esProgramado: v.esProgramado || false
        }));
      }

      if (data.imagen1) window.estadoApp.imagen1 = data.imagen1;
      if (data.imagen2) window.estadoApp.imagen2 = data.imagen2;

      guardarDatosLocales();
      renderizarSelectorLotes(); 
      renderizarTodo();
      alert("¡Respaldo JSON cargado e importado perfectamente!");
    } catch(err) { 
      console.error(err);
      alert("Error: El archivo JSON está corrupto o no tiene el formato correcto."); 
    }
  };
  reader.readAsText(file);
}
window.importarJSON = importarJSON;

window.onload = inicializar;