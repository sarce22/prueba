# Sabores y Velocidad

Sitio web para menu digital, pedidos y reservas con identidad visual urbana. Incluye catalogo filtrable, carrito, modales de personalizacion, envio de pedidos por WhatsApp y mapa interactivo.

## Caracteristicas
- Hero con promo y CTA principal.
- Seccion "Mas vendidos" (3 items destacados).
- Catalogo con filtros por categoria.
- Carrito con resumen, factura previa y envio por WhatsApp.
- Formulario de datos del cliente (nombre, celular, direccion).
- Skeleton loading para la carga del menu.
- Mapa Leaflet con estilo oscuro y marcador animado.
- Barra fija en movil con total y CTA "Pedir ahora".

## Estructura del proyecto
- `index.html`: estructura principal de la pagina.
- `css/styles.css`: estilos y animaciones.
- `js/app.js`: logica de catalogo, carrito, modales y mapa.
- `productos.json`: datos del menu (categorias e items).
- `images/`: logos e imagenes locales.

## Requisitos
- Navegador moderno con soporte para ES6.
- Conexion a internet (fuentes, Leaflet y tiles del mapa).

## Configuracion rapida
1) Logo: reemplaza el archivo en `images/` y ajusta la ruta en `index.html`.
2) WhatsApp: cambia `WHATSAPP_NUMBER` en `js/app.js`.
3) Mapa: ajusta las coordenadas en `js/app.js` (variable `armeniaCoords`).
4) Menu: edita `productos.json` para precios, descripciones e imagenes.
5) Mas vendidos: marca items con `"featured": true` en `productos.json`.

## Uso
1) Abre `index.html` en el navegador.
2) Agrega productos al carrito.
3) Confirma el pedido, completa datos del cliente y envia por WhatsApp.

## Notas de contenido
- Las imagenes del menu usan URLs de Unsplash con dimensiones 800x600.
- El mapa usa tiles de CARTO (tema oscuro) y Leaflet via CDN.

## Licencia
Uso interno del proyecto.
