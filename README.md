# Pendientes SICUN · Valida Catastral

Página pública de **solo lectura** para que cada técnico consulte las filas de su Excel de validación que requieren atención según el cruce con SICUN. El aviso es informativo y permite revisar y corregir la validación.

Todo el código está en `index.html`, sin frameworks ni proceso de compilación. El repositorio **no contiene datos**, Excel, CRC ni publicaciones; los datos se consultan en la API al abrir la página y no se guardan en localStorage. Solo se guardan la preferencia de tema (`vc-pend-theme`) y el distrito, búsqueda por polígono y orden de la portada (`vc-pend-filters`), con lectura y escritura protegidas por `try/catch`. No requiere login e incluye `noindex,nofollow` (esto evita la indexación voluntaria, pero no restringe el acceso público).

## Configuración

Rodrigo debe reemplazar la constante al inicio del script de `index.html`:

```js
const API_URL = 'PEGAR_AQUI_URL_EXEC';
```

Usar la URL HTTPS terminada en `/exec` del comparador publicado como aplicación web. La API debe permitir consultas GET desde GitHub Pages, sin login, y devolver JSON legible por el navegador (incluyendo CORS y redirecciones compatibles). Hasta configurarla se muestra un mensaje; ante fallos hay un botón para reintentar. Las solicitudes tienen un límite de 20 segundos.

GitHub Pages sirve el sitio desde `main` (raíz). Este cambio se propone en `feat/pagina-pendientes` mediante PR; no se fusiona ni publica automáticamente desde esa rama.

## Publicación de datos desde el comparador

1. Ejecutar el cruce del Excel de validación contra las versiones ANTES y DESPUÉS de SICUN en el comparador.
2. Publicar el resultado desde el comparador, con sus fechas y totales por polígono, técnico y validador.
3. La aplicación web del comparador expone la última publicación. No copiar datos ni archivos exportados a este repositorio. Las correcciones posteriores a DESPUÉS aparecerán en la próxima publicación.

Contrato de lectura:

- `GET API_URL?api=pendientes`: lista de `{poligono, publicado, antes, despues, totales}`.
- `GET API_URL?api=pendientes&pol=<poligono>`: `{poligono, publicado, antes, despues, totales, porValidador, porTecnico, filas}`.
- Cada fila contiene `{poligono, tecnico, hoja, validador, fi, codigo, smz, piso, estado, resultado, campos, obs}`. `codigo` es el CRC. Enviar identificadores como cadenas para conservar ceros iniciales.
- `totales` contiene `verificado`, `otroCampo`, `sinCambio`, `noAplica` y, opcionalmente, `pendientes`. Si no viene `pendientes`, se calcula como `sinCambio + noAplica`. “SICUN confirma” = `verificado / (verificado + otroCampo + sinCambio)`; sin denominador se muestra `—`.
- `resultado` admite etiquetas legibles o claves equivalentes como `sinCambio`, `noAplica`, `otroCampo` y `verificado`; se normalizan mayúsculas, espacios, acentos y símbolos. `noAplica` representa NO APLICA con cambio en SICUN. Otros resultados se muestran en la opción “Todos los resultados”. Los chips cuentan pendientes a partir de las filas, independientemente del resto de filtros.

## Uso

La portada permite filtrar por Todos, Independencia o Comas, buscar por polígono y ordenar por polígono (orden numérico), más pendientes o última publicación. Se restauran las últimas opciones al volver a abrir la página. El distrito se toma del campo opcional `distrito`; si falta, se deduce del prefijo del CRC (`codigo`): `150112` = Independencia y `150110` = Comas. Cuando el listado no trae esa información, al elegir un distrito se consultan los detalles con la misma API, hasta tres a la vez, y se conserva el distrito solo en memoria. Los polígonos sin distrito identificable siguen disponibles en Todos; si falla una consulta, aparece Reintentar.

Si el listado incluye `parcial: true`, la tarjeta muestra `parcial · falta X`, usando `parcialDetalle` como X. Sin detalle se muestra solo `parcial`; si `parcial` no viene o es falso, no se agrega el aviso. Ambos campos son opcionales.

Abrir un polígono y seleccionar un técnico. Por defecto se muestran SIN CAMBIO EN SICUN y NO APLICA pero SICUN cambió. Los filtros de resultado, validador y CRC se combinan. “Copiar lista” copia los CRC de las filas visibles, uno por línea; cada fila también permite copiar su CRC. El portapapeles requiere HTTPS o localhost y permiso del navegador; si falla se informa en la página.

El fragmento de URL conserva polígono y técnico, por ejemplo `#pol=260210019&tec=CRISTINA`. Los enlaces directos abren el polígono independientemente del distrito o búsqueda guardados. Se pueden compartir enlaces directos y usar atrás/adelante del navegador. En pantallas de hasta 700 px, las filas se presentan como tarjetas.

## Verificación local

Servir con `python3 -m http.server 8000` y abrir `http://localhost:8000`. Para probar datos, usar interceptación de red en un navegador automatizado o un mock local temporal y una copia de `index.html` con la URL del mock. Mantener los mocks fuera del repositorio y usar únicamente identificadores sintéticos.

Comprobar chips, filtros combinados, enlace directo y navegación por hash, copiado, pantalla de 390 px sin desborde, ambos temas (incluida persistencia), API sin configurar y API fallida. No se incluyen fixtures ni datos de prueba en este repositorio.
