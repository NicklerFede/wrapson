# 🌯 Sistema POS y Gestión de Wraps

Aplicación web moderna y optimizada desarrollada para la administración integral de un negocio de wraps. Permite llevar el control absoluto del stock en tiempo real, gestión de lotes, registro de ventas, control financiero detallado, pedidos programados y una pasarela de pedidos interactiva integrada directamente con **WhatsApp**.

---

## ✨ Características Principales

### 🛒 Vista Pública (Clientes)
* **Catálogo en Tiempo Real:** Visualización dinámica del stock disponible por variedad (*Carne, Pollo, Bondiola, Caprese*) y tipo de masa (*Común o Integral*).
* **Alertas de Disponibilidad:** Identificación visual de productos "Sin Stock" o "Próximamente".
* **Armado de Pedidos:** Selector intuitivo de cantidades con cálculo automático de totales.
* **Checkout por WhatsApp:** Envío automatizado del pedido estructurado con opciones de tipo de entrega (*Retiro en local o Envío a domicilio*) y método de pago (*Efectivo o Transferencia*).

### 🔐 Panel de Administración
* **Acceso Seguro:** Panel protegido por credenciales de administración.
* **Control de Lotes:** Creación, cambio y administración de lotes con configuración de precios de venta, costos de compra y stock inicial personalizado por sabor y masa.
* **Modos de Venta:** Registro rápido (modo simple) o mediante carrito de compras múltiple.
* **Gestión Avanzada de Pedidos:**
  * Pestañas organizadas para **Pendientes de entrega**, **Pedidos programados/futuros** y **Historial de entregados**.
  * Edición avanzada de pedidos: capacidad de agregar, quitar o modificar las cantidades de wraps directamente desde los modales de cliente.
  * Control de estados de preparación (*Preparado / No preparado*) y estado de pagos (*Pagado / Pendiente*).
* **Módulo Financiero y Métricas:**
  * Resumen de ventas brutas y netas (desglosado en efectivo y transferencias).
  * Cálculo automático de reinversión, costos y montos fiados.
  * Panel de rendimiento de sabores con porcentajes de venta.
* **Respaldo de Datos:** Herramienta de exportación e importación de la base de datos completa en formato **JSON**.
* **Sincronización en la Nube:** Integración con **Firebase Firestore** para sincronización en tiempo real y persistencia local (`localStorage`) como respaldo offline.

---

## 🛠️ Tecnologías Utilizadas

* **JavaScript (ES6 Modules)** para la lógica de negocio y renderizado dinámico.
* **Firebase Firestore (v10)** para la base de datos en la nube.
* **Tailwind CSS** para el diseño de la interfaz (UI/UX) moderna y responsiva.
* **HTML5**

---

## 🚀 Instalación y Configuración

1. Clona este repositorio en tu equipo local:
   ```bash
   git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
