# FoodRush Frontend

Aplicacion web de delivery para clientes, administradores y repartidores. Esta construida con Vue 3, Vite, Vue Router, Tailwind CSS y SweetAlert2.

## Mapa rapido del proyecto

- `src/main.js`: arranque de Vue, estilos globales y router.
- `src/router.js`: rutas publicas, rutas protegidas y redireccion a portales operativos.
- `src/services/api.js`: cliente HTTP central para Render, token bearer y header `X-Tenant-ID`.
- `src/services/storage.js`: sesion, carrito, favoritos, pagos, pedidos cacheados y notificaciones en `localStorage`.
- `src/services/operations.js`: dataset compartido por Administracion, Delivery y Tracking.
- `src/views/Home.vue`: portada del cliente, busqueda, filtros, ofertas y franquicias.
- `src/views/Checkout.vue`: direccion, metodo de entrega, pagos y creacion de pedidos.
- `src/views/Tracking.vue`: seguimiento del pedido, estado, codigo de entrega y mapa.
- `src/views/administracion.vue`: panel operativo para confirmar pedidos, ver catalogo, usuarios y metricas.
- `src/views/delivery.vue`: panel del repartidor para aceptar, recoger y entregar pedidos.
- `src/views/franchiseConfigs.js`: configuracion visual de franquicias.
- `src/data/mockProducts.js`: productos locales de respaldo si el backend no responde.

## Como ubicar llamadas importantes

- Login y registro llaman al backend desde `src/services/api.js` con `api.login` y `api.register`.
- Las vistas de franquicia cargan productos con `api.getProducts` y usan `src/views/franchiseConfigs.js` para saber tenant, colores y logo.
- Checkout crea el pedido con `api.createOrder`; si el backend falla, guarda un pedido local con `buildLocalOrder`.
- Administracion confirma pedidos con `updateOrderStatus`; Delivery lee esos cambios desde `fetchOperationalDataset`.
- Tracking busca primero el pedido cacheado y luego intenta consultar el backend si el ID es numerico.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
