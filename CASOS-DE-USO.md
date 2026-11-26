# Casos de uso de Nexo Salud

La fuente funcional es el procedimiento «Incapacidades», versión 001, de 14 páginas. Los actores representan quién realiza cada actividad. En Nexo Salud, el operador local registra al responsable y conserva el historial. Los pasos externos se realizan mediante los canales institucionales y su constancia se incorpora al expediente.

| ID | Caso de uso | Actor principal | Flujo y resultado verificable | Fuente |
|---|---|---|---|---|
| CU-01 | Avisar la incapacidad o licencia | Colaborador | Registrar el aviso inmediato al jefe y Administración de Personal con fecha y responsable. | 5.1.1, act. 1 |
| CU-02 | Asignar reemplazo | Líder | Registrar el nombre o referencia del reemplazo y las observaciones de continuidad. | act. 2 |
| CU-03 | Remitir soportes y registrar recepción | Colaborador, Recepción | Crear expediente por recepción, oficinas, líder comercial, correo o Gestión Humana. Registrar la entrega, con alerta a los dos días de emisión, y confirmar la entrega física por separado. | 5.1.1, act. 3 |
| CU-04 | Revisar documentación y escanear | Recepción, Personal | Adjuntar los archivos escaneados. Revisar certificado original, epicrisis cuando corresponda, FURIPS y soportes de licencia. Conservar la constancia de verificación y ubicación física. | 5.1.2, act. 4 |
| CU-05 | Solicitar faltantes y escalar | Personal, Coordinación | Registrar la primera notificación. Calcular tres días hábiles y habilitar el segundo llamado a partir de su vencimiento con documentos pendientes. Registrar la citación o que el colaborador tramitará ante EPS. | 5.1.2, act. 5 |
| CU-06 | Transcribir y radicar | Personal | Con soportes completos y recepción física, registrar número, canal, formato y evidencia. Consultar plazo y canal recomendados por entidad. Registrar una nueva radicación después de subsanar el rechazo. | 5.2, act. 5 y 7 |
| CU-07 | Gestionar la novedad de nómina | Personal, Nómina | Tras radicar, registrar entrega o devolución de los soportes físicos para nómina y archivo. | 5.2 |
| CU-08 | Elaborar informe de ausentismo | Personal, SG-SST | Seleccionar el mes, exportar días de ausentismo del periodo y dejar constancia del envío en los primeros tres días del mes. | act. 6 |
| CU-09 | Organizar el archivo físico y digital | Personal | Registrar la ubicación física por entidad y fecha inicial. Consultar expedientes ordenados por esos campos, identificar colaborador y fecha inicial y anexar liquidación al recibirse. | 5.1.2, 5.3 |
| CU-10 | Revisar el estado ante la entidad | Personal | Registrar verificaciones diarias y consultar alertas. Registrar causal de rechazo, subsanar y volver a radicar con nueva evidencia. | 5.4 |
| CU-11 | Registrar aceptación y promesa | Personal, EPS/ARL | Registrar importe aprobado, fecha comprometida y soporte disponible. El estado pasa a Cobrada. | 5.4, act. 8 |
| CU-12 | Solicitar pago y hacer seguimiento | Personal | Registrar solicitud y seguimiento semanales con evidencia. Consultar el saldo, fecha prometida y límite de tres años. Registrar contacto y acuerdo con la entidad. | 5.4.1, act. 9 y 11 |
| CU-13 | Registrar pago | Tesorería, Personal | Registrar transferencia, referencia, valor y días pagados. Acumular pagos parciales y calcular el saldo. | act. 10 |
| CU-14 | Identificar un pago o saldo | Personal, Contabilidad | Registrar el detalle obtenido del portal, incluidos pagos históricos. Si falta identificación, registrar transferencia y comunicación a Contabilidad y asesor de la entidad. Vincular al expediente cuando se identifique. | 5.5, act. 12 |
| CU-15 | Conciliar pagos y mantener el seguimiento | Contabilidad, Tesorería, Personal | Identificar cada pago, registrar la conciliación y exportar el periodo con colaborador, entidad, fechas, días y valor. Dejar constancia de la entrega del consolidado. | 5.5, 5.5.1, act. 13 |
| CU-16 | Estimar el reconocimiento de origen común | Personal | Registrar IBC mensual y días previos. Mostrar empleador para días 1–2 al 100 %, EPS para días 3–90 al 67 % y días 91–180 al 50 %. Informar días 181 en adelante para trámite ante AFP o EPS. | 5.5.2 |
| CU-17 | Generar monitoreo mensual | Personal | Exportar los expedientes del mes que superen 90 días y marcar los umbrales 90, 120, 150 y 180 según el acumulado al cierre del mes. | 5.5.3 |
| CU-18 | Dar seguimiento a rehabilitación | Personal, EPS, ARL, AFP, Nómina | Alertar para solicitar concepto antes del día 120 y enviarlo antes del 150. Registrar concepto y comunicación. Registrar aviso a las partes si falta el concepto, suspensión de nómina al superar 180 días y reintegro posterior cuando aplique. | 5.5.3 |
| CU-19 | Gestionar cobro persuasivo | Personal, Cartera | Registrar al menos dos requerimientos con evidencia. Trasladar a Cartera a los 180 días de cobro o antes si se acredita deterioro crediticio. Dejar constancia del agotamiento. | act. 14 y 15 |
| CU-20 | Gestionar cobro jurídico | Jurídica | Registrar traslado por rechazo improcedente acreditado, promesa vencida o agotamiento de Cartera. Registrar derecho de petición, tutela si no hubo respuesta y decisión de recuperación o baja. | 5.4.2, act. 15 |
| CU-21 | Archivar expedientes pagados | Personal, Gestión Documental | Tras identificar y conciliar el pago total, cotejar expediente físico, confirmar destrucción de los soportes clínicos y registrar entrega. El sistema elimina los adjuntos del tipo clínico y mantiene la trazabilidad administrativa. | 5.5.1, act. 16 |
| CU-22 | Analizar la gestión | Personal | Consultar prioridades calculadas o solicitar a Llama 3.2, vía Ollama local, un resumen de conteos agregados. | última página |
| CU-23 | Proteger y desbloquear el archivo | Operador | Crear contraseña, abrir o bloquear el almacén. Los datos y soportes permanecen cifrados mientras están almacenados por la aplicación. | soporte al flujo |

## Reglas interpretadas

- Se pide certificado original en todos los casos por la regla general de la página 4, incluida paternidad. La excepción de epicrisis para enfermedad general o accidente laboral ya transcritos se toma de la actividad 3. Accidentes de tránsito y licencias de maternidad o paternidad mantienen el soporte médico. Clasifica historia clínica o triage utilizado como soporte médico en «Epicrisis / soporte médico».
- Los 30 días calendario de paternidad se cuentan desde el nacimiento. Los demás plazos de la tabla se cuentan desde el inicio, porque el documento no explicita su fecha base. Famisanar y entidades sin plazo indicado muestran una solicitud de confirmación. El archivo se organiza por entidad y fecha inicial.
- El plazo de tres años de pago se muestra desde la aceptación. La fecha prometida de un acuerdo tiene prioridad en las alertas. El plazo de 180 días de Cartera se cuenta desde el primer requerimiento. Los festivos aplicables los configura el operador.
- En monitoreo e IBC, el operador indica los días previos de la misma cadena. La estimación usa IBC mensual dividido entre 30 y aplica los porcentajes consignados en el PDF. Los importes de conciliación corresponden a los pagos registrados.
- Los portales de EPS/ARL, correo, transferencias, nómina y radicación jurídica se gestionan fuera de la aplicación. El sistema guarda referencias, responsables y evidencia.
