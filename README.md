# Mi Recetario Thermomix TM7

Aplicación en español con categorías, búsqueda por nombre o ingredientes, favoritas, ingredientes, pasos y creación, edición y eliminación de recetas. Diseño adaptable a iPad y móvil. HTML, CSS y JavaScript sin dependencias de ejecución, cuentas ni servicios de pago.

## Probar en un ordenador

Desde este directorio, con Python 3 instalado:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000`. Detén el servidor con Ctrl+C.

## Probar desde tu iPad sin publicar en internet

1. Descarga este repositorio a un ordenador y ejecuta el comando anterior en su carpeta.
2. Conecta el ordenador y el iPad a la misma red Wi-Fi privada.
3. Busca la IP local del ordenador en los ajustes de red, por ejemplo `192.168.1.35`.
4. En Safari del iPad abre `http://192.168.1.35:8000`, sustituyendo la IP por la real. Si el cortafuegos pregunta, permite el puerto 8000 solo en tu red privada. No abras puertos en el router.
5. Crea una receta, añade una foto desde Fotos o Archivos, márcala como favorita y recarga para comprobar que sigue guardada. Prueba las categorías y la búsqueda. Abre la receta para editarla o eliminarla; la eliminación pide confirmación.

El servidor de este entorno en la nube no es accesible directamente desde tu Wi-Fi. Estos pasos requieren un ordenador local. No se ha publicado la aplicación. El ordenador debe permanecer encendido mientras se use. No es todavía una aplicación instalable que funcione sin servidor.

## Datos y copias de seguridad

Las recetas y fotografías se guardan con `localStorage` en el navegador y dirección desde los que accedes. No se sincronizan con otros dispositivos ni navegadores. Usar otra IP o puerto crea un almacenamiento distinto. Borrar los datos de Safari puede eliminar el recetario; evita el modo privado y exporta copias periódicamente a Archivos.

**Exportar copia** descarga un JSON con recetas y fotos. **Importar copia** valida el archivo y agrega sus recetas sin borrar las existentes; conserva ambas versiones si tienen el mismo identificador y distinto contenido. Las fotos se convierten en JPEG de hasta 1000 píxeles para limitar el espacio. Si se agota el almacenamiento, la aplicación avisa y conserva los datos previamente guardados.

Los tres ejemplos están identificados como **demostrativos**, con métodos convencionales: no son recetas oficiales ni instrucciones validadas para la TM7. Consulta el manual y recetas verificadas antes de utilizar el equipo. Los ejemplos conservan esta advertencia al editarlos.

## Fotografía

La fotografía de portada es ilustrativa y está incluida localmente; no representa los tres ejemplos. Es una fotografía de Rachel Michetti, cortesía de Pikolo Espresso Bar, publicada como CC0 en [scikit-image](https://github.com/scikit-image/scikit-image); su procedencia está documentada en `assets/PROCEDENCIA.md`. Las recetas muestran una ilustración sencilla hasta que añadas tu propia fotografía.

## Comprobaciones

Pruebas de navegador en `tests/recetario.spec.cjs`. Requieren Playwright como herramienta de desarrollo; no es una dependencia de la aplicación. Cubren crear y editar con foto, persistencia al recargar, búsqueda, categorías, favoritas, eliminación y copias de seguridad, con un viewport de iPad. No sustituyen una prueba en un iPad físico.

Para ejecutar las pruebas: `npm ci`, `npx playwright install chromium` y `npm test`. Si Chromium ya está instalado, usa `CHROMIUM_PATH=/ruta/a/chromium npm test`.
