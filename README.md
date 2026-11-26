# Nexo Salud

Aplicación de escritorio para que Gestión Humana registre y haga seguimiento de incapacidades y licencias, desde la recepción hasta la conciliación y el archivo.

## Abrir la aplicación

Descarga el paquete de tu sistema desde [GitHub Releases](https://github.com/jgallego001/Proyecto-final-Ingesoft-I/releases).

- **Windows de 64 bits.** Extrae el ZIP completo, abre la carpeta «Nexo Salud» y ejecuta `Nexo Salud.exe`. El paquete es portátil y no tiene firma de código propia.
- **Linux de 64 bits.** Extrae el archivo `.tar.gz` y ejecuta `./nexo-salud` desde la carpeta «Nexo Salud» con una sesión gráfica. Electron requiere las bibliotecas habituales de Chromium y GTK, además de un sandbox compatible. El lanzador usa espacios de nombres de usuario de Linux si el equipo no tiene configurado el helper sandbox de Chromium. En equipos con una política que los deshabilita, el administrador debe habilitar el sandbox mediante la política de la distribución.
- Crea una contraseña de al menos 10 caracteres. La necesitarás para volver a abrir el almacén. La aplicación no tiene recuperación de contraseña.

## Primer expediente

1. En Vista general, pulsa **Nuevo expediente** y registra la recepción.
2. En **Soportes**, adjunta los documentos de la lista. En **Registrar gestión**, deja constancia de la recepción física y de la revisión.
3. Registra la radicación con su evidencia y lleva el historial de cobro, pago, conciliación y archivo.
4. En **Reportes**, selecciona un mes, exporta a CSV y registra el envío. En **Configuración**, agrega los festivos que deban excluirse de los días hábiles.

Los trámites externos se hacen por los canales de cada entidad. La aplicación calcula vencimientos y registra gestiones, fechas, responsables y evidencia. El archivo final elimina la copia clínica almacenada y requiere confirmar la disposición de los originales físicos. Gestiona por separado las copias que se hayan exportado.

El almacén se cifra con AES-256-GCM y se desbloquea con una clave derivada de la contraseña mediante scrypt. Los archivos y reportes exportados quedan fuera del almacén cifrado. Para respaldar, cierra la app y conserva una copia protegida de toda la carpeta `vault` del directorio de datos de Nexo Salud. La aplicación es local y de una persona por sesión. Los roles del procedimiento se registran como responsables en el historial.

## Análisis con IA

El panel calcula prioridades con las reglas del procedimiento. Para generar además un resumen con IA, inicia Ollama en el mismo equipo y ejecuta `ollama pull llama3.2:3b`. En **Análisis**, pulsa **Generar resumen**. Ollama recibe conteos por estado y tipo de alerta. Los expedientes, nombres, soportes y notas quedan en el almacén.

## Desarrollo y empaquetado

En Node.js 24, ejecuta `npm ci`, `npm test` y `npm start`. Para empaquetar desde Linux, ejecuta `scripts/package.sh linux` o `scripts/package.sh win32`. Requiere `curl`, `unzip`, `zip`, `tar` y `sha256sum`. El script comprueba el SHA-256 del binario con el manifiesto de Electron. Puedes proporcionar una descarga previa mediante `NEXO_ELECTRON_ARCHIVE`.

Consulta [CASOS-DE-USO.md](CASOS-DE-USO.md) para ver actores, pasos, criterios y decisiones de interpretación.
