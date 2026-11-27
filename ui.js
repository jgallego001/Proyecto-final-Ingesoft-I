const D = window.Nexo;
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
let data;
let page = 'inicio';
let currentId;
let detailTab = 'resumen';
let period = D.today().slice(0, 7);
let reportKind = 'Ausentismo';
let filter = '';
let stateFilter = '';
let sortBy = '';
let configured = true;
let aiOutput = '';
let working = false;

const icons = {
  logo: '<path d="M8 3h5l-2 6h6l-3 9H9l2-6H5z" fill="currentColor" stroke="none"/><path d="M18 3v4m-2-2h4"/>',
  home: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  chart: '<path d="M4 3v17h17M9 15v-3m5 3V8m5 7V5"/>',
  spark: '<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="17" r="2" fill="currentColor"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M4 12h15m-6-6l6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  wallet: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H6a2 2 0 0 1-2-2zm16 3h-5v4h5"/>',
  check: '<circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  search: '<circle cx="10" cy="10" r="5"/><path d="m14 14 5 5"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4m-11 6v3h14v-3"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/>',
  file: '<path d="M6 3h8l4 4v14H6zM9 12h6m-6 4h6"/>'
};
const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (s) => s ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(s + 'T12:00:00Z')) : 'Sin fecha';
const money = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((v) => v[0].toUpperCase()).join('');
const opt = (v, label = v, selected = false, disabled = false) =>
  `<option value="${esc(v)}"${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}>${esc(label)}</option>`;
const btn = (label, action, symbol = '', extra = '') => `<button type="button" class="btn ${extra}" data-action="${action}">${symbol ? icon(symbol, 17) : ''}${label}</button>`;
const empty = (heading, text, symbol = 'folder', action = '') => `<div class="empty"><span class="empty-icon">${icon(symbol, 25)}</span><strong>${heading}</strong><p>${text}</p>${action}</div>`;
const verifiedLabel = 'Documentos verificados y aceptados';
const statusLabel = (state) => state === 'Verificada' ? verifiedLabel : state;
const pill = (s) => {
  const color = ['Pagada', 'Conciliada', 'Archivada', 'Verificada'].includes(s) ? 'green' : ['Rechazada', 'Vencida'].includes(s) ? 'red' : ['Transcrita', 'Cobrada'].includes(s) ? 'blue' : 'amber';
  return `<span class="pill ${color}"><i></i>${esc(statusLabel(s))}</span>`;
};
const logo = () => `<div class="brand"><div class="brand-mark">${icon('logo', 25)}</div><div><strong>Nexo Salud</strong><span>Gestión de incapacidades</span></div></div>`;
function notice(message, error = false) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.className = error ? 'error' : '';
  toast.hidden = false;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => { toast.hidden = true; }, 5600);
}
function heading(title, sub, actions = '') {
  return `<header class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div>${actions}</header>`;
}
function lockScreen() {
  app.innerHTML = `<main class="unlock"><div class="unlock-visual"><div class="orbit one"></div><div class="orbit two"></div><div class="orbit three"></div><div class="unlock-brand">${logo()}<h1>Gestión laboral<br>con seguimiento.</h1><p>Recepción, radicación y conciliación de incapacidades en un solo lugar.</p></div></div>
  <div class="unlock-side"><form id="unlock" class="unlock-form"><span class="empty-icon">${icon('lock', 24)}</span><h2>${configured ? 'Desbloquear Nexo Salud' : 'Crea tu acceso local'}</h2><p>${configured ? 'Ingresa la contraseña de este equipo para abrir los expedientes.' : 'La contraseña cifra los expedientes y soportes en este equipo. Guárdala en un lugar seguro. La aplicación no puede recuperarla.'}</p>
  <label>Contraseña<input autofocus name="password" type="password" autocomplete="${configured ? 'current-password' : 'new-password'}" minlength="10" required></label>
  ${configured ? '' : '<label>Confirmar contraseña<input name="confirmation" type="password" autocomplete="new-password" minlength="10" required></label>'}
  <button class="btn primary" type="submit">${configured ? 'Desbloquear' : 'Crear almacén'} ${icon('arrow', 17)}</button><div class="form-error" role="alert"></div></form></div></main>`;
  document.querySelector('#unlock input').focus();
}

const nav = [['inicio', 'home', 'Vista general'], ['expedientes', 'folder', 'Expedientes'], ['alertas', 'bell', 'Alertas'], ['reportes', 'chart', 'Reportes'], ['analisis', 'spark', 'Análisis'], ['config', 'settings', 'Configuración']];
function render() {
  if (!data) return lockScreen();
  const overdue = allAlerts().filter((item) => item.due && item.due <= D.today()).length;
  const selected = nav.find(([id]) => id === page)?.[2] || 'Detalle del expediente';
  const body = { inicio: dashboard, expedientes, alertas, reportes, analisis, config, detalle }[page]();
  app.innerHTML = `<div class="shell"><aside class="sidebar">${logo()}<div class="nav-label">GESTIÓN HUMANA</div><nav>${nav.map(([id, glyph, label]) =>
    `<button data-action="go:${id}" class="nav-item ${page === id || (page === 'detalle' && id === 'expedientes') ? 'active' : ''}">${icon(glyph, 18)}<span>${label}</span>${id === 'alertas' && overdue ? `<b>${overdue}</b>` : ''}</button>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="local"><i></i><span>Almacén local cifrado</span></div><button class="nav-item" data-action="lock">${icon('lock', 17)}<span>Bloquear sesión</span></button></div>
    </aside><div class="workspace"><div class="topbar"><div>Gestión humana <span class="slash">/</span> <strong>${selected}</strong></div><div class="top-date">${icon('calendar', 16)} ${fmt(D.today())}</div></div><main class="content">${body}</main></div></div>`;
}
function allAlerts() {
  return data.cases.flatMap((c) => D.alerts(c, D.today(), data.holidays).map((a) => ({ ...a, c })))
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
}
function metric(label, value, hint, glyph, color) {
  return `<div class="metric"><div class="metric-top"><span>${label}</span><span class="metric-icon ${color}">${icon(glyph, 19)}</span></div><strong>${value}</strong><small>${hint}</small></div>`;
}
function table(cases, brief = false) {
  if (!cases.length) return empty(brief ? 'Aún no hay expedientes' : 'Sin expedientes para mostrar', brief ? 'Registra una incapacidad o licencia para empezar su seguimiento.' : 'Cambia la búsqueda o registra un expediente.', 'folder', brief ? btn('Registrar expediente', 'new', 'plus') : '');
  return `<div class="table-wrap"><table><thead><tr><th>Colaborador</th><th>Tipo de novedad</th><th>Entidad</th><th>Estado y pendiente</th><th aria-label="Abrir"></th></tr></thead><tbody>${cases.map((c) => `<tr><td><div class="person"><span class="avatar">${esc(initials(c.name))}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.folio)} · ${fmt(c.start)}</small></div></div></td><td>${esc(c.type)}</td><td>${esc(c.entity)}</td><td>${pill(D.status(c))}<small class="case-pending">${esc(D.pendingTask(c) || 'Sin gestiones pendientes')}</small></td><td><button class="icon-btn" data-action="case:${c.id}" aria-label="Abrir ${esc(c.folio)}">${icon('arrow', 17)}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function dashboard() {
  const active = data.cases.filter((c) => !['Archivada', 'Conciliada'].includes(D.status(c))).length;
  const alerts = allAlerts();
  const due = alerts.filter((a) => a.due && a.due <= D.today());
  const pending = data.cases.reduce((sum, c) => sum + D.totals(c).due, 0);
  const closed = data.cases.filter((c) => ['Archivada', 'Conciliada'].includes(D.status(c))).length;
  const attention = alerts.filter((a) => a.due && a.due <= D.add(D.today(), 7)).slice(0, 4);
  return `${heading('Vista general', 'Consulta el estado de las incapacidades y las próximas gestiones.', btn('Nuevo expediente', 'new', 'plus', 'primary'))}
  <section class="hero"><div class="orbit one"></div><div class="orbit two"></div><div class="orbit three"></div><div class="hero-inner"><span class="hero-chip">${icon('file', 15)} Seguimiento de expedientes</span><h2>Gestión de incapacidades</h2><p>Organiza los soportes, controla los plazos y registra los pagos de EPS y ARL.</p>${btn('Ver expedientes', 'go:expedientes', 'arrow', 'hero-btn')}</div>
  <div class="hero-art" aria-hidden="true"><div class="paper paper-back"></div><div class="paper paper-front"><span class="paper-tag">${icon('file', 24)}</span><i></i><i></i><i></i><b>${icon('check', 38)}</b></div><span class="hero-star">${icon('spark', 35)}</span></div></section>
  <section class="metrics">${metric('Expedientes activos', active, 'Abiertos y en seguimiento', 'folder', 'lilac')}${metric('Alertas por atender', due.length, 'Vencidas o para hoy', 'clock', 'peach')}${metric('Saldo pendiente', money(pending), 'Prestaciones aprobadas', 'wallet', 'sky')}${metric('Expedientes cerrados', closed, 'Conciliados o archivados', 'check', 'mint')}</section>
  <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Expedientes recientes</h2><p>Últimos registros del equipo</p></div>${btn('Ver todos', 'go:expedientes', 'arrow', 'quiet')}</div>${table(data.cases.slice(0, 5), true)}</section>
  <section class="panel"><div class="panel-head"><div><h2>Próximas gestiones</h2><p>Vencidas y próximos 7 días</p></div><span class="metric-icon peach">${icon('bell', 18)}</span></div>${attention.length ? `<div class="alert-mini">${attention.map((a) => `<button data-action="case:${a.c.id}"><i></i><span><strong>${esc(a.label)}</strong><small>${esc(a.c.folio)} · ${fmt(a.due)}</small></span>${icon('arrow', 15)}</button>`).join('')}</div>` : empty('Sin fechas próximas', 'Las gestiones con vencimiento aparecerán aquí.', 'calendar')}<div class="panel-foot">${btn('Ver todas las alertas', 'go:alertas', 'arrow', 'quiet')}</div></section></div>`;
}
function matching() {
  const result = data.cases.filter((c) => (!stateFilter || D.status(c) === stateFilter) &&
    [c.name, c.document, c.folio, c.entity, c.type].join(' ').toLowerCase().includes(filter.trim().toLowerCase()));
  if (sortBy) result.sort((a, b) => a.entity.localeCompare(b.entity, 'es') || a.start.localeCompare(b.start));
  return result;
}
function expedientes() {
  const states = [...new Set(data.cases.map(D.status))];
  return `${heading('Expedientes', 'Consulta incapacidades, licencias y su historial de gestión.', btn('Nuevo expediente', 'new', 'plus', 'primary'))}
  <section class="panel"><div class="toolbar"><label class="search">${icon('search', 18)}<input name="filter" placeholder="Buscar por nombre, documento o entidad" aria-label="Buscar expedientes" value="${esc(filter)}"></label><select name="stateFilter" aria-label="Estado">${opt('', 'Todos los estados')}${states.map((s) => opt(s, statusLabel(s), s === stateFilter)).join('')}</select><select name="sortBy" aria-label="Orden del archivo">${opt('', 'Más recientes')}${opt('entity', 'Entidad y fecha de inicio', !!sortBy)}</select></div><div id="case-table">${table(matching())}</div></section>`;
}
function alertas() {
  const items = allAlerts();
  return `${heading('Alertas', 'Consulta plazos documentales, de radicación, cobro y rehabilitación.')}
  <section class="panel">${items.length ? `<div class="table-wrap"><table><thead><tr><th>Gestión</th><th>Expediente</th><th>Vencimiento</th><th>Prioridad</th><th></th></tr></thead><tbody>${items.map((a) => `<tr><td><strong>${esc(a.label)}</strong><small>${esc(a.kind)}</small></td><td>${esc(a.c.folio)}<small>${esc(a.c.name)}</small></td><td>${fmt(a.due)}</td><td>${pill(a.due && a.due < D.today() ? 'Vencida' : a.due === D.today() ? 'Para hoy' : 'Pendiente')}</td><td>${btn('Abrir', 'case:' + a.c.id, 'arrow')}</td></tr>`).join('')}</tbody></table></div>` : empty('Sin alertas activas', 'Los plazos se calculan al registrar expedientes.', 'bell')}</section>`;
}
function detalle() {
  const c = data.cases.find((item) => item.id === currentId);
  const totals = D.totals(c);
  const locked = D.status(c) === 'Archivada';
  const title = `<div class="crumb">${btn('Expedientes', 'go:expedientes', 'back', 'quiet')}<span>${esc(c.folio)}</span></div>` +
    heading(esc(c.name), `${esc(c.folio)} · ${esc(c.type)} · ${esc(c.entity)}`, locked ? '' : btn('Registrar gestión', 'event', 'plus', 'primary'));
  const pairs = (values) => `<dl class="definition">${values.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const est = D.estimate(c);
  let section = '';
  if (detailTab === 'resumen') section = `<div class="dashboard-grid"><section class="panel padded"><h2>Datos del expediente</h2>${pairs([
    ['Documento', c.document], ['Canal de recepción', c.receipt], ['Periodo', fmt(c.start) + ' – ' + fmt(c.end)], ['Días del periodo / acumulados', D.days(c) + ' / ' + (D.days(c) + Number(c.prior || 0))],
    ['Emisión', fmt(c.issued)], ['Recepción', fmt(c.received)], ['Canal de radicación', D.channel(c.entity)], ['Plazo para radicar', D.deadline(c) ? fmt(D.deadline(c)) : 'Confirmar con la entidad'],
    ...(c.birth ? [['Nacimiento', fmt(c.birth)], ['Semanas de gestación', c.gestation || 'Sin registro'], ['Parto múltiple', c.multiple ? 'Sí' : 'No'], ['Duración de referencia', c.type === D.types[4] ? (c.multiple ? '20 semanas' : '18 semanas') : '14 días calendario']] : []),
    ...(c.note ? [['Observaciones', c.note]] : [])
  ])}</section><section class="panel padded"><h2>Valores del expediente</h2>${pairs([['Aprobado', money(totals.approved)], ['Pagado', money(totals.paid)], ['Saldo', money(totals.due)], ...(est ? [['Estimado empleador', money(est.employer)], ['Estimado EPS', money(est.eps)], ['Días desde el 181 para gestionar', est.referred]] : [])])}</section></div>`;
  if (detailTab === 'soportes') section = `<div class="dashboard-grid"><section class="panel padded"><div class="section-title"><h2>Soportes adjuntos</h2>${locked ? '' : btn('Adjuntar', 'attach', 'plus', 'primary')}</div>${c.files.length ? `<div class="item-list">${c.files.map((f) => `<div><span class="metric-icon lilac">${icon('file', 18)}</span><span><strong>${esc(f.kind)}</strong><small>${esc(f.name)}</small></span>${btn('Guardar copia', 'file:' + f.id, 'download')}</div>`).join('')}</div>` : empty('Sin soportes adjuntos', 'Los archivos agregados aparecerán aquí.', 'file')}</section>
  <section class="panel padded"><h2>Documentos requeridos</h2>${locked ? '<p class="muted">Los soportes clínicos se eliminaron al archivar.</p>' : `<ul class="checklist">${D.required(c).map((d) => `<li>${icon(c.files.some((f) => f.kind === d) ? 'check' : 'clock', 18)} ${esc(d)}</li>`).join('')}</ul>`}</section></div>`;
  if (detailTab === 'historial') section = history(c);
  const pending = D.pendingTask(c);
  const required = D.requiredStep(c);
  const missing = locked ? [] : D.missing(c);
  const guidance = {
    fisico: 'Registra esta gestión para poder verificar la documentación.',
    verificacion: 'Registra el resultado de la revisión para habilitar las demás gestiones.'
  };
  const pendingCard = `<section class="panel pending-card" aria-labelledby="pending-heading">
    <span class="metric-icon ${required ? 'peach' : 'lilac'}">${icon(pending ? 'clock' : 'check', 18)}</span>
    <div><h2 id="pending-heading">Siguiente gestión</h2><strong>${esc(pending || 'Sin gestiones pendientes')}</strong>
      ${required ? `<p class="muted">${guidance[required]}</p>` : ''}
      ${missing.length ? `<p class="muted">Soportes faltantes · ${esc(missing.join(', '))}</p>` : ''}
    </div>
  </section>`;
  return `${title}${pendingCard}<div class="detail-bar">${pill(D.status(c))}<div class="tabs">${[['resumen','Resumen'],['soportes','Soportes'],['historial','Historial']].map(([key, label]) => btn(label, 'tab:' + key, '', detailTab === key ? 'tab-active' : 'quiet')).join('')}</div></div>${section}`;
}
function history(c) {
  const files = new Map(c.files.map((file) => [file.id, file]));
  const events = [...c.events].reverse().map((event) => {
    const supports = D.linkedFileIds(event).map((id) => files.get(id)).filter(Boolean);
    const downloadButtons = supports.map((file) => btn(esc(file.kind + ' · ' + file.name), 'file:' + esc(file.id), 'download'));
    const [label, actor] = D.actions[event.type];
    const result = event.type === 'verificacion'
      ? (event.verificationResult === 'observada' ? 'Requiere correcciones' : verifiedLabel)
      : '';
    return `<div>
      <span class="metric-icon lilac">${icon('clock', 17)}</span>
      <span><strong>${esc(label)}</strong>
        <small>${fmt(event.date)} · ${esc(event.actor || actor)}${event.amount ? ' · ' + money(event.amount) : ''}${event.paidDays ? ' · ' + esc(event.paidDays) + ' días pagados' : ''}${event.due ? ' · Promesa ' + fmt(event.due) : ''}</small>
        ${result ? `<small>Resultado · ${esc(result)}</small>` : ''}
        ${event.sentDate || event.submissionChannel ? `<small>Envío · ${[event.sentDate ? fmt(event.sentDate) : '', esc(event.submissionChannel)].filter(Boolean).join(' · ')}</small>` : ''}
        ${event.filingNumber ? `<small>Radicado · ${esc(event.filingNumber)}</small>` : ''}
        ${event.correction ? `<p>Corrección · ${esc(event.correction)}</p>` : ''}
        <p>${esc(event.note)}</p>
        ${downloadButtons.length ? `<span class="history-supports">${downloadButtons.join('')}</span>` : ''}
      </span>
    </div>`;
  });
  return `<section class="panel padded"><h2>Historial de gestiones</h2>${events.length ? `<div class="item-list timeline">${events.join('')}</div>` : empty('Sin gestiones registradas', 'Agrega una gestión para iniciar la trazabilidad.', 'clock')}</section>`;
}
function reportRows() {
  const start = period + '-01';
  const end = D.add(D.months(start, 1), -1);
  if (reportKind === 'Ausentismo') return [['Expediente', 'Colaborador', 'Documento', 'Entidad', 'Tipo', 'Inicio del mes', 'Fin del mes', 'Días del mes'], ...data.cases.filter((c) => c.start <= end && c.end >= start).map((c) => {
    const a = c.start > start ? c.start : start;
    const b = c.end < end ? c.end : end;
    return [c.folio, c.name, c.document, c.entity, c.type, a, b, D.span(a, b)];
  })];
  if (reportKind === 'Monitoreo') return [['Expediente', 'Colaborador', 'Entidad', 'Acumulado al cierre', 'Supera 90', 'Supera 120', 'Supera 150', 'Supera 180'], ...data.cases.filter((c) => c.start <= end && c.end >= start).map((c) => {
    const total = Number(c.prior) + D.span(c.start, c.end < end ? c.end : end);
    return [c.folio, c.name, c.entity, total, ...[90, 120, 150, 180].map((n) => total > n ? 'Sí' : '')];
  }).filter((row) => row[3] > 90)];
  return [['Expediente', 'Colaborador', 'Entidad', 'Inicio incapacidad', 'Fin incapacidad', 'Fecha de pago', 'Días pagados', 'Valor COP', 'Identificación / referencia', 'Conciliado'],
    ...data.cases.flatMap((c) => c.events.filter((e) => e.type === 'pago' && e.date.startsWith(period)).map((e) => [
      c.folio, c.name, c.entity, c.start, c.end, e.date, e.paidDays, e.amount, e.note,
      c.events.some((entry) => entry.type === 'conciliacion' && entry.at >= e.at) ? 'Sí' : 'No'
    ])),
    ...(data.unidentified || []).filter((e) => !e.resolution && e.date.startsWith(period)).map((e) => ['', '', e.entity, '', '', e.date, '', e.amount, 'Saldo sin identificar', 'Pendiente'])];
}
function reportes() {
  const [header, ...rows] = reportRows();
  const log = data.reports.filter((item) => item.kind === reportKind && item.period === period);
  const balances = (data.unidentified || []).filter((item) => item.date.startsWith(period));
  return `${heading('Reportes', 'Consolida ausentismo, pagos y seguimiento de casos prolongados.', btn('Exportar CSV', 'csv', 'download', 'primary'))}
  <div class="tabs report-tabs">${['Ausentismo', 'Conciliación', 'Monitoreo'].map((s) => btn(s, 'report:' + s, '', reportKind === s ? 'tab-active' : 'quiet')).join('')}</div>
  <section class="panel"><div class="toolbar"><label>Periodo <input name="period" type="month" value="${esc(period)}" required></label><span class="muted">${rows.length} registros</span></div>
  ${rows.length ? `<div class="table-wrap"><table><thead><tr>${header.map((v) => '<th>' + esc(v) + '</th>').join('')}</tr></thead><tbody>${rows.map((row) => '<tr>' + row.map((v) => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('')}</tbody></table></div>` : empty('Sin registros del periodo', 'Selecciona otro mes para consultar la información.', 'chart')}</section>
  ${reportKind === 'Conciliación' ? `<section class="panel padded stack"><div class="section-title"><h2>Saldos sin identificar</h2>${btn('Registrar saldo', 'balance', 'plus')}</div><p class="muted">Registra transferencias informadas por Contabilidad y documenta la comunicación con los asesores de la entidad. Consulta manualmente los históricos de cada portal, incluidos los mayores a tres años.</p>${balances.length ? `<div class="item-list">${balances.map((e) => `<div><span class="metric-icon sky">${icon('wallet', 18)}</span><span><strong>${esc(e.entity)} · ${money(e.amount)}</strong><small>${fmt(e.date)} · ${esc(e.note)}</small>${e.resolution ? '<p>' + esc(e.resolution) + '</p>' : ''}</span>${e.resolution ? '' : btn('Identificar', 'resolve:' + e.id, 'check')}</div>`).join('')}</div>` : ''}</section>` : ''}
  <section class="panel padded stack"><div class="section-title"><h2>Constancia de gestión</h2>${btn('Registrar envío', 'reportlog', 'plus')}</div><p class="muted">${reportKind === 'Ausentismo' ? 'Envía el consolidado al SG-SST a más tardar el ' + fmt(D.add(D.months(period + '-01', 1), 2)) + '.' : reportKind === 'Conciliación' ? 'Registra la entrega a Contabilidad y Tesorería.' : 'Registra la revisión mensual de incapacidades prolongadas.'}</p>
  ${log.length ? `<div class="item-list">${log.map((item) => `<div><span class="metric-icon lilac">${icon('check', 18)}</span><span><strong>${fmt(item.date)}</strong><small>${esc(item.note)}</small></span></div>`).join('')}</div>` : ''}</section>`;
}
function analisis() {
  const alerts = allAlerts();
  const due = alerts.filter((a) => a.due && a.due <= D.today());
  const groups = Object.entries(Object.groupBy(due, (a) => a.kind));
  return `${heading('Análisis de gestión', 'Revisa la carga operativa y las prioridades de seguimiento.')}
  <div class="dashboard-grid"><section class="panel padded"><h2>Prioridades por reglas</h2><p class="muted">Gestiones vencidas y para hoy.</p>${groups.length ? `<div class="item-list">${groups.map(([label, records]) => `<div><span class="metric-icon peach">${icon('bell', 18)}</span><span><strong>${esc(label)}</strong><small>${records.length} por atender</small></span></div>`).join('')}</div>` : empty('Sin gestiones vencidas', 'Los plazos de los expedientes alimentan este análisis.', 'check')}</section>
  <section class="panel padded"><h2>Resumen con IA local</h2><p class="muted">Usa Llama 3.2 con Ollama en este equipo. El modelo recibe conteos agregados por estado y tipo de alerta.</p>${btn('Generar resumen', 'ai', 'spark', 'primary')}${aiOutput ? `<div class="ai-output">${esc(aiOutput)}</div>` : ''}</section></div>`;
}
function config() {
  return `${heading('Configuración', 'Administra los festivos usados en el cálculo de días hábiles.')}
  <section class="panel padded"><h2>Calendario de festivos</h2><p class="muted">Los sábados y domingos se excluyen automáticamente. Agrega los festivos aplicables a tu organización.</p><form id="holiday" class="inline-form"><input type="date" name="date" aria-label="Fecha del festivo" required><button class="btn primary" type="submit">${icon('plus', 17)} Agregar fecha</button></form>
  <div class="holiday-list">${data.holidays.map((d) => `<div>${fmt(d)} ${btn('Quitar', 'holiday:' + d, 'close', 'quiet')}</div>`).join('')}</div></section>`;
}
function field(label, html, wide = false) { return `<label${wide ? ' class="wide"' : ''}>${label}${html}</label>`; }
const input = (name, extra = '') => `<input name="${name}" ${extra}>`;
const textArea = (name, placeholder = '') => `<textarea name="${name}" rows="3" maxlength="3000" placeholder="${esc(placeholder)}"></textarea>`;
const select = (name, choices, placeholder, extra = '') => `<select name="${name}" ${extra}>${opt('', placeholder)}${choices.map((s) => Array.isArray(s) ? opt(...s) : opt(s)).join('')}</select>`;
const dateInput = (name, required = true) => input(name, `type="date"${required ? ' required' : ''}`);
function modal(title, subtitle, id, content, label = 'Guardar') {
  dialog.innerHTML = `<div class="dialog-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="icon-btn" data-action="close" aria-label="Cerrar">${icon('close', 20)}</button></div>
  <form id="${id}"><div class="form-grid">${content}</div><div class="form-error" role="alert"></div><div class="dialog-foot">${btn('Cancelar', 'close')}<button type="submit" class="btn primary">${label}</button></div></form>`;
  dialog.showModal();
}
function newCase() {
  modal('Nuevo expediente', 'Registra la información de recepción de la incapacidad o licencia.', 'new-case',
    field('Nombre del colaborador', input('name', 'required maxlength="150"')) + field('Documento de identidad', input('document', 'required maxlength="40"')) +
    field('Tipo de novedad', select('type', D.types, 'Seleccionar tipo', 'required')) +
    field('EPS / ARL', input('entity', 'list="entities" required maxlength="100"') + `<datalist id="entities">${D.entities.map((s) => opt(s)).join('')}</datalist>`) +
    field('Inicio', dateInput('start')) + field('Fin', dateInput('end')) + field('Fecha de emisión', dateInput('issued')) + field('Fecha de recepción', dateInput('received')) +
    field('Canal de recepción', select('receipt', D.receiptChannels, 'Seleccionar canal', 'required')) +
    field('Días acumulados previos de la cadena', input('prior', 'type="number" min="0" step="1" value="0"')) +
    field('IBC mensual (COP)', input('ibc', 'type="number" min="0" step="1"')) +
    field('Ya transcrita por EPS', '<input name="transcribed" type="checkbox">') +
    `<div class="wide form-grid birth-fields" hidden>${field('Nacimiento', dateInput('birth', false))}${field('Semanas de gestación', input('gestation', 'type="number" min="1" max="45"'))}${field('Parto múltiple', '<input name="multiple" type="checkbox">')}</div>` +
    field('Observaciones administrativas', textArea('note', 'Evita registrar diagnósticos o información clínica aquí.'), true), 'Crear expediente');
  dialog.querySelector('[name="received"]').value = D.today();
}
function eventDialog() {
  const c = data.cases.find((item) => item.id === currentId);
  const required = D.requiredStep(c);
  const groups = Object.entries(D.actionGroups).map(([id, { label }]) => [id, label, !!required && id === 'recepcion']);
  const hint = required
    ? 'Siguiente gestión obligatoria · ' + D.actions[required][0]
    : 'Consulta las 25 gestiones por tipo. Las que aparecen en gris se habilitan según el expediente.';
  modal('Registrar gestión', hint, 'event-form',
    field('Tipo de gestión', select('group', groups, 'Seleccionar tipo', 'required'), true) +
    field('Gestión', select('type', [], 'Primero selecciona un tipo de gestión', 'required disabled aria-describedby="event-availability"'), true) +
    '<p id="event-availability" class="muted wide" aria-live="polite" hidden></p>' +
    field('Fecha', dateInput('date')) + field('Responsable', input('actor', 'maxlength="120"')) +
    '<div id="event-extra" class="wide form-grid"></div>' + field('Descripción o referencia', textArea('note'), true));
  const form = dialog.querySelector('#event-form');
  form.elements.date.value = D.today();
  form.elements.note.required = true;
  if (required) updateEventGroup(form, required);
}
function updateEventGroup(form, selected = '') {
  const c = data.cases.find((item) => item.id === currentId);
  const id = form.elements.group.value;
  const group = D.actionGroups[id];
  const allowed = D.availableActionGroups(c)[id]?.actions || {};
  const options = Object.entries(group?.actions || {}).map(([type, [label]]) =>
    opt(type, label, type === selected, !Object.hasOwn(allowed, type)));
  const typeSelect = form.elements.type;
  typeSelect.innerHTML = opt('', group ? 'Seleccionar gestión' : 'Primero selecciona un tipo de gestión') + options.join('');
  typeSelect.disabled = !group;
  const notice = form.querySelector('#event-availability');
  const required = D.requiredStep(c);
  const messages = {
    cartera: 'Cartera y Jurídica se habilitan con un rechazo o cuando corresponda escalar un cobro pendiente.',
    rehabilitacion: 'Estas gestiones se habilitan para incapacidades con 120 días acumulados o más.'
  };
  notice.hidden = !group || Object.keys(allowed).length > 0;
  notice.textContent = required
    ? 'Registra la gestión obligatoria de Recepción y documentos para continuar.'
    : messages[id] || 'Este tipo de gestión todavía no está disponible en el expediente.';
  eventExtra(typeSelect.value);
}
function eventExtra(type) {
  const c = data.cases.find((item) => item.id === currentId);
  const extras = dialog.querySelector('#event-extra');
  dialog.querySelector('[name="actor"]').value = D.actions[type]?.[1] || '';
  const files = type === 'archivo' ? c.files.filter((file) => file.kind !== D.docs[1]) : c.files;
  const proof = `<fieldset class="wide support-picker">
    <legend>Soportes vinculados <span>(opcional)</span></legend>
    ${files.length ? `<div class="support-options">${files.map((file) =>
      `<label class="check-field"><input type="checkbox" name="fileIds" value="${esc(file.id)}"><span>${esc(file.kind)} · ${esc(file.name)}</span></label>`).join('')}</div>` :
      '<p class="muted">No hay soportes disponibles para vincular.</p>'}
  </fieldset>`;
  const checks = {
    archivo: 'Confirmo la destrucción física de epicrisis e historia clínica. La copia clínica cifrada se eliminará del almacén.',
    cartera: 'Confirmo el deterioro crediticio y lo documento en la descripción para el traslado antes de 180 días.',
    juridica: 'Confirmo que la causal de rechazo es improcedente y la documento en la descripción.',
    tutela: 'Confirmo que la entidad no respondió al derecho de petición.'
  };
  const guides = {
    verificacion: 'Indica si la documentación está completa y correcta. Si requiere correcciones, detállalas en la descripción.',
    fisico: 'Anota la ubicación por entidad y fecha de inicio. Confirma la recepción del original y el escaneo del soporte.',
    radicado: 'Registra número de radicado, canal y formato usado. Canal habitual: ' + D.channel(c.entity) + '.',
    pago: 'Registra el valor y los días que corresponden a este expediente. Anota la referencia de la transferencia en la descripción.',
    cobro: 'Anota el contacto con la entidad, el resultado y el próximo compromiso de pago si lo hay.',
    faltantes: 'Indica qué documentos se deben corregir o adjuntar y cómo se notificó al colaborador.',
    archivo: 'Confirma el cotejo con el expediente físico y la entrega a Gestión Documental.',
    concepto: 'Indica si el concepto fue favorable o desfavorable y a quién se comunicó.'
  };
  const hasMissingFiles = type === 'verificacion' && D.missing(c).length > 0;
  const verificationOptions = [
    ['aprobada', verifiedLabel, false, hasMissingFiles],
    ['observada', 'Requiere correcciones o faltan soportes']
  ];
  const resubmission = type === 'radicado' && D.status(c) === 'Rechazada';
  const rejectionIndex = c.events.findLastIndex((event) => event.type === 'rechazo');
  const legacyCorrection = resubmission ? c.events.slice(rejectionIndex + 1).findLast((event) => event.type === 'subsanacion') : undefined;
  extras.innerHTML = (guides[type] ? '<p class="muted wide">' + esc(guides[type]) + '</p>' : '') +
    (type === 'verificacion' ? field('Resultado de la verificación', select('verificationResult', verificationOptions, 'Seleccionar resultado', 'required'), true) : '') +
    (hasMissingFiles ? '<p class="muted wide">Adjunta los soportes requeridos para marcar la verificación como aceptada.</p>' : '') +
    (type === 'fisico' ? field('Canal de envío (opcional)', select('submissionChannel', D.receiptChannels, 'Seleccionar canal')) +
      field('Fecha de envío (opcional)', dateInput('sentDate', false)) : '') +
    (type === 'radicado' ? field(resubmission ? 'Número del nuevo radicado' : 'Número de radicado (opcional)',
      input('filingNumber', 'maxlength="120"' + (resubmission ? ' required' : '')), true) : '') +
    (resubmission ? field('Corrección realizada', '<textarea name="correction" rows="2" maxlength="3000" required>' + esc(legacyCorrection?.note) + '</textarea>', true) : '') +
    (type === 'respuesta' ? field('Resultado de la radicación', select('response', [['aceptacion', 'Aceptada'], ['rechazo', 'Rechazada']], 'Seleccionar resultado', 'required'), true) +
      '<div id="response-details" class="wide form-grid"></div>' : '') +
    (['pago', 'reintegro'].includes(type) ? amountField() : '') +
    (type === 'pago' ? field('Días pagados', input('paidDays', 'type="number" min="1" step="1" required')) : '') +
    (type === 'acuerdo' ? field('Fecha prometida', dateInput('due')) : '') +
    (type ? proof : '') +
    (checks[type] ? `<label class="wide check-field"><input type="checkbox" name="exception"> ${checks[type]}</label>` : '');
  const channel = extras.querySelector('[name="submissionChannel"]');
  if (channel && D.receiptChannels.includes(c.receipt)) channel.value = c.receipt;
}
function amountField() {
  return field('Valor (COP)', input('amount', 'type="number" min="0.01" step="0.01" required'));
}
async function work(fn, form) {
  if (working) return;
  working = true;
  const button = form?.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try { await fn(); }
  catch (error) {
    const message = error.message.replace(/^Error invoking remote method 'nexo': Error: /, '');
    const target = form?.querySelector('.form-error');
    if (target) target.textContent = message; else notice(message, true);
  } finally {
    if (button) button.disabled = false;
    working = false;
  }
}
document.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (!button || working) return;
  const [type, value] = button.dataset.action.split(':');
  if (type === 'go') { page = value; render(); }
  if (type === 'case') { currentId = value; detailTab = 'resumen'; page = 'detalle'; render(); }
  if (type === 'tab') { detailTab = value; render(); }
  if (type === 'report') { reportKind = value; render(); }
  if (type === 'new') newCase();
  if (type === 'event') eventDialog();
  if (type === 'close') dialog.close();
  if (type === 'attach') modal('Adjuntar soporte', 'Selecciona el tipo y el archivo desde tu equipo. Máximo 25 MB.', 'attachment', field('Tipo de documento', select('kind', D.docs, 'Seleccionar documento', 'required'), true), 'Seleccionar archivo');
  if (type === 'reportlog') modal('Registrar envío', reportKind + ' · ' + period, 'report-log', field('Fecha', input('date', 'type="date" required value="' + D.today() + '"')) + field('Destino, responsable y referencia', textArea('note'), true));
  if (type === 'balance') modal('Registrar saldo sin identificar', 'Registra la transferencia recibida y la gestión para identificarla.', 'balance-form',
    field('Entidad', input('entity', 'required maxlength="100"')) + field('Fecha', dateInput('date')) +
    field('Valor (COP)', input('amount', 'type="number" min="0.01" step="0.01" required')) + field('Referencia y comunicación', textArea('note'), true));
  if (type === 'resolve') {
    modal('Identificar saldo', 'Vincula el expediente correspondiente y documenta la identificación.', 'resolve-form',
      field('Expediente', select('caseId', data.cases.map((c) => [c.id, c.folio + ' · ' + c.name]), 'Selecciona un expediente', 'required'), true) +
      field('Detalle de identificación y comunicación', textArea('resolution'), true) + input('id', 'type="hidden" value="' + value + '"'));
  }
  if (type === 'file') work(async () => { if (await desktop.run('exportFile', currentId, value)) notice('Copia guardada.'); });
  if (type === 'csv') work(async () => { if (await desktop.run('csv', 'nexo-' + reportKind.toLowerCase() + '-' + period + '.csv', reportRows())) notice('Reporte exportado.'); });
  if (type === 'holiday') work(async () => { data = await desktop.run('holiday', value); render(); });
  if (type === 'ai') work(async () => {
    const previous = button.innerHTML;
    button.textContent = 'Generando resumen…'; button.disabled = true;
    try { aiOutput = await desktop.run('analysis'); render(); }
    finally { button.disabled = false; button.innerHTML = previous; }
  });
  if (type === 'lock') work(async () => {
    await desktop.run('lock'); data = undefined; aiOutput = ''; currentId = undefined; filter = ''; stateFilter = ''; page = 'inicio'; render();
  });
});
document.addEventListener('input', (e) => {
  if (e.target.name === 'filter') { filter = e.target.value; document.querySelector('#case-table').innerHTML = table(matching()); }
});
document.addEventListener('change', (e) => {
  if (e.target.name === 'sortBy') { sortBy = e.target.value; document.querySelector('#case-table').innerHTML = table(matching()); }
  if (e.target.name === 'stateFilter') { stateFilter = e.target.value; document.querySelector('#case-table').innerHTML = table(matching()); }
  if (e.target.name === 'period' && e.target.value) { period = e.target.value; render(); }
  if (e.target.form?.id === 'event-form') {
    if (e.target.name === 'group') updateEventGroup(e.target.form);
    if (e.target.name === 'type') eventExtra(e.target.value);
    if (e.target.name === 'response') {
      const body = e.target.form.querySelector('#response-details');
      body.innerHTML = {
        aceptacion: amountField() + field('Fecha prometida', dateInput('due')),
        rechazo: '<p class="muted wide">Anota en la descripción la causal que informó la entidad.</p>'
      }[e.target.value] || '';
    }
  }
  if (e.target.name === 'type' && e.target.form?.id === 'new-case') {
    const show = [D.types[4], D.types[5]].includes(e.target.value);
    const fields = e.target.form.querySelector('.birth-fields');
    fields.hidden = !show;
    fields.querySelectorAll('input').forEach((el) => { el.disabled = !show; });
    fields.querySelector('[name="birth"]').required = show;
  }
});
document.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const fields = new FormData(form);
  const values = Object.fromEntries(fields);
  work(async () => {
    if (form.id === 'unlock') {
      if (!configured && values.password !== values.confirmation) throw Error('Las contraseñas deben coincidir.');
      data = await desktop.run('unlock', values.password); configured = true; render(); return;
    }
    if (form.id === 'new-case') {
      if (![D.types[4], D.types[5]].includes(values.type)) { values.birth = ''; values.gestation = ''; delete values.multiple; }
      const result = await desktop.run('create', values);
      data = result.data; currentId = result.id; page = 'detalle'; detailTab = 'resumen';
    }
    if (form.id === 'event-form') {
      const { group, ...event } = values;
      data = await desktop.run('event', currentId, { ...event, fileIds: fields.getAll('fileIds') });
      detailTab = 'historial';
    }
    if (form.id === 'attachment') { data = await desktop.run('attach', currentId, values.kind); detailTab = 'soportes'; }
    if (form.id === 'holiday') {
      if (data.holidays.includes(values.date)) throw Error('El festivo ya está registrado.');
      data = await desktop.run('holiday', values.date);
    }
    if (form.id === 'report-log') data = await desktop.run('report', { ...values, kind: reportKind, period });
    if (['balance-form', 'resolve-form'].includes(form.id)) data = await desktop.run('unidentified', values);
    if (dialog.open) dialog.close();
    render(); notice('Registro actualizado.');
  }, form);
});
desktop.run('configured').then((value) => { configured = value; render(); }).catch((error) => {
  app.textContent = 'No se pudo abrir Nexo Salud.';
  notice(error.message, true);
});
