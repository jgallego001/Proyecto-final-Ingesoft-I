const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('../domain');

function caseData(changes = {}) {
  return {
    type: D.types[0], entity: 'Salud Total', start: '2025-01-31', end: '2025-02-10',
    received: '2025-01-31', issued: '2025-01-31', files: [], events: [], ...changes
  };
}
const event = (type, changes = {}) => ({ type, date: '2025-02-10', note: 'Constancia', ...changes });
function append(c, e, holidays) {
  assert.equal(D.validateEvent(c, e, holidays), '', e.type);
  c.events.push(e);
}

test('calcula los plazos por entidad, licencias y fin de mes', () => {
  assert.equal(D.months('2024-02-29', 36), '2027-02-28');
  assert.equal(D.deadline(caseData()), '2026-01-31');
  assert.equal(D.deadline(caseData({ type: D.types[3] })), '2025-02-15');
  assert.equal(D.deadline(caseData({ type: D.types[5], birth: '2025-02-04' })), '2025-03-06');
  assert.equal(D.deadline(caseData({ entity: 'SURA EPS' })), '2025-06-30');
  assert.equal(D.deadline(caseData({ entity: 'Famisanar' })), '');
  assert.match(D.channel('Sanitas'), /Correo/);
});

test('aplica la lista documental por origen y duración', () => {
  assert.deepEqual(D.required(caseData({ end: '2025-02-01' })), [D.docs[0]]);
  assert.deepEqual(D.required(caseData({ type: D.types[2], transcribed: true })), [D.docs[0]]);
  assert.deepEqual(D.required(caseData({ type: D.types[3], transcribed: true })), D.docs.slice(0, 3));
  assert.deepEqual(D.required(caseData({ type: D.types[4] })), [0, 1, 3, 4, 5].map((i) => D.docs[i]));
  assert.deepEqual(D.required(caseData({ type: D.types[5] })), [0, 1, 3, 4, 6].map((i) => D.docs[i]));
});

test('omite fin de semana y festivos para el segundo llamado', () => {
  const c = caseData();
  append(c, event('faltantes', { date: '2025-01-31' }));
  const holidays = ['2025-02-03'];
  assert.equal(D.businessDays('2025-01-31', 3, holidays), '2025-02-06');
  assert.match(D.validateEvent(c, event('llamado', { date: '2025-02-05' }), holidays), /tres días/);
  append(c, event('llamado', { date: '2025-02-06' }), holidays);
  append(c, event('citacion'));
});

test('verifica, radica, subsana, cobra, concilia y archiva', () => {
  const c = caseData({ files: [0, 1, 8].map((i) => ({ id: String(i), kind: D.docs[i] })) });
  assert.match(D.validateEvent(c, event('radicado', { fileId: '8' })), /recepción física/);
  for (const kind of ['fisico', 'verificacion', 'radicado', 'rechazo']) append(c, event(kind, { fileId: '8' }));
  assert.equal(D.status(c), 'Rechazada');
  assert.match(D.validateEvent(c, event('radicado', { fileId: '8' })), /subsanación/);
  append(c, event('subsanacion'));
  append(c, event('radicado', { fileId: '8' }));
  append(c, event('aceptacion', { amount: 0.3, due: '2025-03-10' }));
  append(c, event('cobro', { fileIds: [] }));
  append(c, event('seguimiento', { fileIds: ['0', '8'] }));
  append(c, event('pago', { amount: 0.1, paidDays: 1 }));
  assert.equal(D.status(c), 'Pago parcial');
  append(c, event('pago', { amount: 0.2, paidDays: 2 }));
  assert.deepEqual(D.totals(c), { paid: 0.3, approved: 0.3, due: 0 });
  assert.match(D.validateEvent(c, event('conciliacion')), /detalle/);
  append(c, event('identificacion'));
  append(c, event('conciliacion'));
  assert.match(D.validateEvent(c, event('archivo')), /confirma/);
  append(c, event('archivo', { exception: true }));
  assert.equal(D.status(c), 'Archivada');
});

test('requiere dos solicitudes, justificación para el traslado temprano y confirmación para la tutela', () => {
  const c = caseData();
  append(c, event('persuasivo', { date: '2025-02-01', fileIds: [] }));
  assert.match(D.validateEvent(c, event('cartera')), /dos requerimientos/);
  append(c, event('persuasivo', { fileIds: [] }));
  assert.match(D.validateEvent(c, event('cartera')), /180 días/);
  append(c, event('cartera', { exception: true, fileIds: [] }));
  append(c, event('agotamiento'));
  append(c, event('juridica'));
  append(c, event('peticion', { fileIds: [] }));
  assert.match(D.validateEvent(c, event('tutela', { fileIds: [] })), /sin respuesta/);
  append(c, event('tutela', { fileIds: [], exception: true }));
});

test('permite cero o varios soportes del expediente y admite enlaces antiguos', () => {
  const c = caseData({ files: [{ id: 'one' }, { id: 'two' }] });
  assert.deepEqual(D.linkedFileIds(event('aviso', { fileId: 'one' })), ['one']);
  assert.deepEqual(D.linkedFileIds(event('aviso', { fileIds: [] })), []);
  assert.equal(D.validateEvent(c, event('aviso', { fileIds: ['one', 'two'] })), '');
  assert.match(D.validateEvent(c, event('aviso', { fileIds: ['one', 'other-case'] })), /este expediente/);
  assert.match(D.validateEvent(c, event('aviso', { fileIds: 'one' })), /no es válida/);
});

test('estima tramos y genera alertas de rehabilitación', () => {
  const c = caseData({ start: '2025-01-01', end: '2025-07-19', ibc: 3000000 });
  assert.deepEqual(D.estimate(c), { employer: 200000, eps: 10396000, referred: 20 });
  const alerts = D.alerts(c, '2025-07-01');
  assert.equal(alerts.find((a) => a.label.includes('Solicitar concepto')).due, '2025-04-29');
  assert.equal(alerts.find((a) => a.label.includes('Enviar concepto')).due, '2025-05-29');
  assert.ok(alerts.some((a) => a.label.includes('suspensión')));
});
