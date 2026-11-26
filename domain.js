(function (root) {
  const types = ['Enfermedad general', 'Enfermedad laboral', 'Accidente laboral', 'Accidente de tránsito', 'Licencia de maternidad', 'Licencia de paternidad', 'Otra licencia'];
  const entities = ['Salud Total', 'Nueva EPS', 'SOS', 'Sanitas', 'SURA EPS', 'Asmet Salud', 'ARL SURA', 'Famisanar'];
  const docs = ['Certificado original', 'Epicrisis / soporte médico', 'FURIPS', 'Certificado de nacido vivo', 'Registro civil', 'Documento de identidad', 'Documento de identidad de la madre', 'Liquidación', 'Evidencia de gestión'];
  const actionGroups = {
    recepcion: {
      label: 'Recepción y documentos',
      actions: {
        aviso: ['Aviso inmediato al jefe y a Administración de Personal', 'Colaborador'],
        reemplazo: ['Asignación de reemplazo', 'Líder'],
        entrega: ['Remisión de soportes', 'Colaborador'],
        fisico: ['Recepción física y ubicación del archivo', 'Administración de Personal'],
        faltantes: ['Primera notificación de faltantes', 'Administración de Personal'],
        llamado: ['Segundo llamado por faltantes', 'Administración de Personal'],
        citacion: ['Citación con Coordinación', 'Coordinación'],
        verificacion: ['Verificación documental', 'Administración de Personal']
      }
    },
    radicacion: {
      label: 'Radicación, rechazos y nómina',
      actions: {
        radicado: ['Transcripción / radicación', 'Administración de Personal'],
        directo: ['Traslado del trámite al colaborador', 'Administración de Personal'],
        rechazo: ['Rechazo y causal', 'EPS / ARL'],
        subsanacion: ['Subsanación del rechazo', 'Administración de Personal'],
        nomina: ['Entrega o devolución de soportes de nómina', 'Nómina']
      }
    },
    cobro: {
      label: 'Cobro y seguimiento',
      actions: {
        revision: ['Revisión diaria de entidad', 'Administración de Personal'],
        aceptacion: ['Aceptación y fecha prometida de pago', 'EPS / ARL'],
        cobro: ['Solicitud semanal de pago', 'Administración de Personal'],
        seguimiento: ['Seguimiento semanal de cobro', 'Administración de Personal'],
        acuerdo: ['Comunicación y acuerdo de pago', 'Coordinación']
      }
    },
    pagos: {
      label: 'Pagos y conciliación',
      actions: {
        identificacion: ['Identificación del detalle de pago', 'Administración de Personal'],
        saldo: ['Saldo sin identificar / aviso a Contabilidad y entidad', 'Administración de Personal'],
        pago: ['Pago de EPS / ARL', 'Tesorería'],
        conciliacion: ['Conciliación contable', 'Contabilidad']
      }
    },
    cartera: {
      label: 'Cartera y gestión jurídica',
      actions: {
        persuasivo: ['Requerimiento persuasivo', 'Administración de Personal'],
        cartera: ['Traslado a Cartera', 'Cartera'],
        agotamiento: ['Agotamiento de la gestión de Cartera', 'Cartera'],
        juridica: ['Traslado a Jurídica', 'Jurídica'],
        peticion: ['Derecho de petición', 'Jurídica'],
        tutela: ['Acción de tutela por falta de respuesta', 'Jurídica'],
        decision: ['Decisión jurídica de recuperación o baja', 'Jurídica']
      }
    },
    rehabilitacion: {
      label: 'Rehabilitación e incapacidades prolongadas',
      actions: {
        solicitud: ['Solicitud de concepto de rehabilitación a EPS', 'Administración de Personal'],
        envio: ['Envío del concepto a AFP', 'Administración de Personal'],
        aviso_concepto: ['Aviso de concepto pendiente a EPS, ARL, AFP y trabajador', 'Administración de Personal'],
        concepto: ['Comunicación de concepto favorable o desfavorable', 'Administración de Personal'],
        suspension: ['Notificación de suspensión por nómina y gestión ante AFP', 'Nómina'],
        reintegro: ['Reintegro posterior al día 180', 'Tesorería']
      }
    },
    archivo: {
      label: 'Archivo documental',
      actions: {
        archivo: ['Entrega a Gestión Documental y destrucción de soportes clínicos', 'Gestión Documental']
      }
    }
  };
  const actions = Object.assign({}, ...Object.values(actionGroups).map((group) => group.actions));
  const date = (s) => new Date(s + 'T00:00:00Z');
  const iso = (d) => d.toISOString().slice(0, 10);
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const add = (s, n) => { const d = date(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const months = (s, n) => {
    const d = date(s); const day = d.getUTCDate();
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last)); return iso(d);
  };
  const span = (a, b) => Math.round((date(b) - date(a)) / 86400000) + 1;
  function businessDays(s, n, holidays = []) {
    while (n > 0) {
      s = add(s, 1);
      if (![0, 6].includes(date(s).getUTCDay()) && !holidays.includes(s)) n--;
    }
    return s;
  }
  const days = (c) => span(c.start, c.end);
  const last = (c, type) => c.events.findLast((e) => e.type === type);
  const channel = (entity) => ['SOS', 'Sanitas', 'Famisanar'].includes(entity) ? 'Correo / contacto con la entidad' : 'Portal / oficina de la entidad';
  function deadline(c) {
    if (c.type === types[5]) return c.birth && add(c.birth, 30);
    if (c.entity === 'Salud Total' && c.type === types[3]) return add(c.start, 15);
    if (c.entity === 'Sanitas') return months(c.start, 36);
    if (c.entity === 'SURA EPS') return add(c.start, 150);
    return entities.includes(c.entity) && c.entity !== 'Famisanar' ? months(c.start, 12) : '';
  }
  function required(c) {
    const list = [docs[0]];
    const birth = [types[4], types[5]].includes(c.type);
    const exception = c.transcribed && [types[0], types[2]].includes(c.type);
    if (birth || c.type === types[3] || (!exception && (days(c) > 2 || c.type === types[2]))) list.push(docs[1]);
    if (c.type === types[3]) list.push(docs[2]);
    if (birth) list.push(docs[3], docs[4], c.type === types[5] ? docs[6] : docs[5]);
    return list;
  }
  const missing = (c) => required(c).filter((kind) => !c.files.some((f) => f.kind === kind));
  function totals(c) {
    const cents = (amount) => Math.round(Number(amount || 0) * 100);
    const paid = c.events.filter((e) => e.type === 'pago').reduce((sum, e) => sum + cents(e.amount), 0);
    const approved = cents(last(c, 'aceptacion')?.amount);
    return { paid: paid / 100, approved: approved / 100, due: Math.max(0, approved - paid) / 100 };
  }
  function status(c) {
    if (last(c, 'archivo')) return 'Archivada';
    if (last(c, 'conciliacion') && c.events.indexOf(last(c, 'conciliacion')) > c.events.indexOf(last(c, 'pago')) && totals(c).due === 0) return 'Conciliada';
    const latest = c.events.findLast((e) => ['pago', 'aceptacion', 'rechazo', 'radicado'].includes(e.type));
    return { pago: totals(c).due > 0 ? 'Pago parcial' : 'Pagada', aceptacion: 'Cobrada', rechazo: 'Rechazada', radicado: 'Transcrita' }[latest?.type] ||
      (last(c, 'verificacion') && !missing(c).length ? 'Verificada' : missing(c).length ? 'Por completar' : 'Recibida');
  }
  function estimate(c) {
    if (c.type !== types[0] || !Number(c.ibc)) return null;
    const offset = Number(c.prior || 0);
    const end = offset + days(c);
    const daily = Number(c.ibc) / 30;
    const count = (from, to) => Math.max(0, Math.min(to, end) - Math.max(from, offset + 1) + 1);
    return { employer: count(1, 2) * daily, eps: (count(3, 90) * 0.67 + count(91, 180) * 0.5) * daily, referred: count(181, Infinity) };
  }
  function alerts(c, now = today(), holidays = []) {
    if (last(c, 'archivo')) return [];
    const out = [];
    const push = (label, due, kind) => out.push({ label, due, kind });
    const filing = deadline(c);
    if (!last(c, 'radicado')) push(filing ? 'Plazo de radicación' : 'Confirmar plazo con entidad', filing, 'Radicación');
    if (!last(c, 'entrega')) push('Remitir soportes al líder o a Personal', add(c.issued, 2), 'Recepción');
    if (missing(c).length) {
      const notice = last(c, 'faltantes');
      if (!notice) push('Notificar soportes faltantes', c.received, 'Documentación');
      else if (!last(c, 'llamado')) push('Segundo llamado por faltantes', businessDays(notice.date, 3, holidays), 'Documentación');
      else if (!last(c, 'citacion')) push('Revisar citación con Coordinación', '', 'Documentación');
    }
    const state = status(c);
    if (['Transcrita', 'Cobrada', 'Pago parcial', 'Rechazada'].includes(state)) {
      push('Verificación diaria en la entidad', last(c, 'revision') ? add(last(c, 'revision').date, 1) : last(c, 'radicado')?.date, 'Cobro');
      const collect = last(c, 'cobro');
      push(collect ? 'Seguimiento semanal de cobro' : 'Solicitar pago a la entidad', collect ? add(last(c, 'seguimiento')?.date || collect.date, 7) : last(c, 'aceptacion')?.date, 'Cobro');
    }
    if (['Cobrada', 'Pago parcial'].includes(state)) {
      const promise = last(c, 'acuerdo')?.due || last(c, 'aceptacion')?.due;
      if (promise) push('Fecha prometida de pago', promise, 'Cobro');
      push('Límite de pago según procedimiento', months(last(c, 'aceptacion').date, 36), 'Cobro');
    }
    const first = c.events.find((e) => e.type === 'persuasivo');
    if (first && !last(c, 'cartera') && (totals(c).due > 0 || state === 'Rechazada')) {
      push('Evaluar traslado a Cartera', add(first.date, 180), 'Cobro');
    }
    const prior = Number(c.prior || 0);
    const accumulated = prior + Math.max(0, span(c.start, c.end < now ? c.end : now));
    if (prior + days(c) >= 120 && !last(c, 'solicitud')) push('Solicitar concepto de rehabilitación', add(c.start, Math.max(0, 118 - prior)), 'Rehabilitación');
    if (prior + days(c) >= 150 && !last(c, 'envio')) push('Enviar concepto a AFP', add(c.start, Math.max(0, 148 - prior)), 'Rehabilitación');
    if (accumulated >= 120 && !last(c, 'concepto') && !last(c, 'aviso_concepto')) push('Notificar concepto pendiente a las partes', now, 'Rehabilitación');
    if (accumulated > 180 && !last(c, 'suspension')) push('Comunicar suspensión y trámite ante AFP', now, 'Rehabilitación');
    return out;
  }
  function validateEvent(c, e, holidays = []) {
    const previous = (type) => c.events.some((item) => item.type === type && item.date <= e.date);
    const evidence = c.files.some((f) => f.id === e.fileId);
    if (last(c, 'archivo')) return 'El expediente ya está archivado.';
    if (!actions[e.type] || !e.date || !e.note.trim()) return 'Completa la gestión, fecha y descripción.';
    if (['radicado', 'cobro', 'seguimiento', 'persuasivo', 'peticion', 'tutela'].includes(e.type) && !evidence) return 'Vincula un soporte como evidencia.';
    if (e.type === 'faltantes' && !missing(c).length) return 'La lista de soportes está completa.';
    if (e.type === 'llamado' && (!previous('faltantes') || !missing(c).length || e.date < businessDays(last(c, 'faltantes').date, 3, holidays))) return 'El segundo llamado requiere faltantes y que se cumplan los tres días hábiles.';
    if (e.type === 'citacion' && !previous('llamado')) return 'Registra primero el segundo llamado.';
    if (['verificacion', 'radicado'].includes(e.type) && (missing(c).length || !previous('fisico'))) return 'Completa los soportes y registra la recepción física.';
    if (e.type === 'radicado' && status(c) === 'Rechazada' && !(last(c, 'subsanacion')?.date >= last(c, 'rechazo').date)) return 'Registra primero la subsanación del rechazo.';
    if (['aceptacion', 'revision', 'rechazo', 'nomina', 'cobro'].includes(e.type) && !previous('radicado')) return 'Registra primero la radicación.';
    if (e.type === 'seguimiento' && !previous('cobro')) return 'Registra primero la solicitud de pago.';
    if (['aceptacion', 'pago', 'reintegro'].includes(e.type) && !(Number(e.amount) > 0 && Number.isFinite(Number(e.amount)))) return 'Ingresa un valor positivo en COP.';
    if (['aceptacion', 'acuerdo'].includes(e.type) && (!e.due || e.due < e.date)) return 'Registra una fecha prometida válida.';
    if (e.type === 'pago' && !previous('aceptacion')) return 'Registra primero la aceptación de la entidad.';
    if (e.type === 'pago' && (!(Number(e.paidDays) > 0) || !Number.isInteger(Number(e.paidDays)))) return 'Indica los días pagados.';
    if (e.type === 'conciliacion' && (!previous('pago') || !previous('identificacion'))) return 'Identifica el detalle y registra el pago antes de conciliar.';
    if (e.type === 'cartera') {
      const requests = c.events.filter((item) => item.type === 'persuasivo' && item.date <= e.date).sort((a, b) => a.date.localeCompare(b.date));
      if (requests.length < 2) return 'Registra al menos dos requerimientos persuasivos.';
      if (e.date < add(requests[0].date, 180) && !(e.exception && evidence)) return 'Espera 180 días o vincula evidencia de deterioro crediticio.';
    }
    if (e.type === 'agotamiento' && !previous('cartera')) return 'Registra el traslado a Cartera.';
    if (e.type === 'juridica') {
      const promised = last(c, 'acuerdo')?.due || last(c, 'aceptacion')?.due;
      const denial = status(c) === 'Rechazada' && e.exception && evidence;
      const brokenPromise = totals(c).due > 0 && promised && e.date > promised;
      if (!previous('agotamiento') && !denial && !brokenPromise) return 'Registra el agotamiento de Cartera, documenta el rechazo improcedente o verifica que haya vencido la promesa de pago.';
    }
    if (['peticion', 'decision'].includes(e.type) && !previous('juridica')) return 'Registra el traslado a Jurídica.';
    if (e.type === 'tutela' && (!previous('peticion') || !e.exception)) return 'Registra el derecho de petición y confirma que quedó sin respuesta.';
    if (e.type === 'envio' && !previous('concepto')) return 'Registra primero el concepto de rehabilitación.';
    if (e.type === 'archivo' && (!previous('conciliacion') || status(c) !== 'Conciliada' || !e.exception)) return 'Concilia el pago total y confirma la destrucción del soporte clínico físico.';
    return '';
  }
  const api = { types, entities, docs, actionGroups, actions, today, add, months, span, businessDays, days, deadline, channel, required, missing, totals, status, estimate, alerts, validateEvent };
  if (typeof module !== 'undefined') module.exports = api; else root.Nexo = api;
})(globalThis);
