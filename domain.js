(function (root) {
  const types = ['Enfermedad general', 'Enfermedad laboral', 'Accidente laboral', 'Accidente de tránsito', 'Licencia de maternidad', 'Licencia de paternidad', 'Otra licencia'];
  const entities = ['Salud Total', 'Nueva EPS', 'SOS', 'Sanitas', 'SURA EPS', 'Asmet Salud', 'ARL SURA', 'Famisanar'];
  const receiptChannels = ['Recepción', 'Oficinas principales', 'Líder comercial', 'Correo electrónico', 'Gestión Humana'];
  const docs = ['Certificado original', 'Epicrisis / soporte médico', 'FURIPS', 'Certificado de nacido vivo', 'Registro civil', 'Documento de identidad', 'Documento de identidad de la madre', 'Liquidación', 'Evidencia de gestión'];
  const actionGroups = {
    recepcion: {
      label: 'Recepción y documentos',
      actions: {
        fisico: ['Recepción física y ubicación del archivo', 'Administración de Personal'],
        citacion: ['Citación con Coordinación', 'Coordinación'],
        verificacion: ['Verificación documental', 'Administración de Personal']
      }
    },
    radicacion: {
      label: 'Radicación y respuesta de EPS / ARL',
      actions: {
        radicado: ['Radicación', 'Administración de Personal'],
        respuesta: ['Respuesta de EPS / ARL', 'EPS / ARL'],
        directo: ['Traslado del trámite al colaborador', 'Administración de Personal'],
      }
    },
    cobro: {
      label: 'Cobro y seguimiento',
      actions: {
        cobro: ['Gestión de cobro', 'Administración de Personal'],
        acuerdo: ['Comunicación y acuerdo de pago', 'Coordinación']
      }
    },
    pagos: {
      label: 'Pagos y conciliación',
      actions: {
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
  const registerable = Object.assign({}, ...Object.values(actionGroups).map((group) => group.actions));
  const actions = {
    ...registerable,
    aviso: ['Aviso inmediato al jefe y a Administración de Personal', 'Colaborador'],
    reemplazo: ['Asignación de reemplazo', 'Líder'],
    entrega: ['Remisión de soportes', 'Colaborador'],
    llamado: ['Segundo llamado por faltantes', 'Administración de Personal'],
    rechazo: ['Rechazo y causal', 'EPS / ARL'],
    subsanacion: ['Subsanación del rechazo', 'Administración de Personal'],
    nomina: ['Entrega o devolución de soportes de nómina', 'Nómina'],
    revision: ['Revisión diaria de entidad', 'Administración de Personal'],
    aceptacion: ['Aceptación y fecha prometida de pago', 'EPS / ARL'],
    seguimiento: ['Seguimiento semanal de cobro', 'Administración de Personal'],
    identificacion: ['Identificación del detalle de pago', 'Administración de Personal'],
    saldo: ['Saldo sin identificar / aviso a Contabilidad y entidad', 'Administración de Personal'],
    faltantes: ['Primera notificación de faltantes', 'Administración de Personal'],
    radicado: ['Transcripción / radicación', 'Administración de Personal'],
    cobro: ['Solicitud semanal de pago', 'Administración de Personal']
  };
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
  function intake(c, through) {
    let reception;
    let verification;
    for (const event of c.events) {
      if (through && event.date > through) continue;
      if (event.type === 'fisico' && (!reception || event.date < reception.date)) reception = event;
      if (event.type === 'verificacion' && reception && event.date >= reception.date) verification = event;
    }
    return { reception, verification };
  }
  function requiredStep(c) {
    if (last(c, 'archivo')) return '';
    const { reception, verification } = intake(c);
    if (!reception) return 'fisico';
    return verification ? '' : 'verificacion';
  }
  function needsCorrection(c, verification = intake(c).verification) {
    return verification?.verificationResult === 'observada' || missing(c).length > 0;
  }
  function coordinationDate(c, holidays = []) {
    const after = c.events.findLastIndex((event) => event.type === 'verificacion' && event.verificationResult !== 'observada') + 1;
    const events = c.events.slice(after);
    if (events.some((event) => event.type === 'citacion')) return '';
    const secondNotice = events.find((event) => event.type === 'llamado');
    if (secondNotice) return secondNotice.date;
    const firstNotice = events.find((event) => event.type === 'faltantes');
    const review = events.find((event) => event.type === 'verificacion' && event.verificationResult === 'observada');
    const reference = firstNotice || review;
    return reference ? businessDays(reference.date, 3, holidays) : '';
  }
  function collection(c) {
    const after = c.events.indexOf(last(c, 'aceptacion')) + 1;
    return c.events.slice(after).findLast((event) => ['cobro', 'seguimiento'].includes(event.type));
  }
  function paymentPromise(c) {
    const accepted = last(c, 'aceptacion');
    const agreement = last(c, 'acuerdo');
    return c.events.indexOf(agreement) > c.events.indexOf(accepted) ? agreement.due : accepted?.due;
  }
  const paymentPending = (state) => ['Cobrada', 'Pago parcial'].includes(state);
  function availableActionGroups(c, now = today()) {
    const state = status(c);
    const step = requiredStep(c);
    const promise = paymentPromise(c);
    const showCollection = paymentPending(state);
    const showLegal = state === 'Rechazada' || (showCollection && (collection(c) || (promise && promise < now)));
    return Object.fromEntries(Object.entries(actionGroups).flatMap(([id, group]) => {
      if (state === 'Archivada' || (id === 'cartera' && !showLegal) ||
          (id === 'rehabilitacion' && Number(c.prior || 0) + days(c) < 120)) return [];
      const options = Object.entries(group.actions).filter(([type]) => {
        if (step) return type === step;
        if (type === 'respuesta') return state === 'Transcrita';
        if (type === 'cobro') return showCollection;
        if (type === 'citacion') return needsCorrection(c) && !!coordinationDate(c);
        return true;
      });
      return options.length ? [[id, { label: group.label, actions: Object.fromEntries(options) }]] : [];
    }));
  }
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
    if (latest) return { pago: totals(c).due > 0 ? 'Pago parcial' : 'Pagada', aceptacion: 'Cobrada', rechazo: 'Rechazada', radicado: 'Transcrita' }[latest.type];
    if (needsCorrection(c)) return 'Por completar';
    return intake(c).verification ? 'Verificada' : 'Recibida';
  }
  function pendingTask(c) {
    const step = requiredStep(c);
    if (step) return actions[step][0];
    const state = status(c);
    switch (state) {
      case 'Archivada': return '';
      case 'Conciliada': return 'Archivar el expediente';
      case 'Pagada': return 'Conciliar el pago';
      case 'Cobrada':
      case 'Pago parcial': return collection(c) ? 'Dar seguimiento al pago pendiente' : 'Solicitar el pago a la entidad';
      case 'Transcrita': return 'Registrar la respuesta de la EPS / ARL';
      case 'Rechazada': return 'Corregir el rechazo y registrar la nueva radicación';
      case 'Por completar': return 'Recibir correcciones y volver a verificar';
      default: return 'Transcribir y radicar ante la EPS / ARL';
    }
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
    if (!last(c, 'entrega') && !last(c, 'fisico')) push('Remitir soportes al líder o a Personal', add(c.issued, 2), 'Recepción');
    const step = requiredStep(c);
    if (step) push(actions[step][0], '', 'Recepción y documentos');
    if (!step && needsCorrection(c)) {
      const due = coordinationDate(c, holidays);
      if (due) push('Revisar citación con Coordinación', due, 'Documentación');
    }
    const state = status(c);
    if (state === 'Transcrita') push('Respuesta de EPS / ARL pendiente', '', 'Radicación');
    if (paymentPending(state)) {
      const followup = collection(c);
      push(followup ? 'Seguimiento semanal de cobro' : 'Solicitar pago a la entidad',
        followup ? add(followup.date, 7) : last(c, 'aceptacion').date, 'Cobro');
      const promise = paymentPromise(c);
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
  function linkedFileIds(event) {
    if (Array.isArray(event.fileIds)) return event.fileIds;
    return event.fileId ? [event.fileId] : [];
  }
  function prepareEvent(c, input, holidays = []) {
    const { type, response, ...fields } = input;
    const step = requiredStep(c);
    if (step && type !== step) throw Error('La siguiente gestión obligatoria es: ' + actions[step][0] + '.');
    if (!Object.hasOwn(registerable, type)) throw Error('Elige una de las gestiones disponibles.');
    let recordType = type;
    if (type === 'respuesta') {
      if (!['aceptacion', 'rechazo'].includes(response)) throw Error('Selecciona si la entidad aceptó o rechazó la radicación.');
      if (status(c) !== 'Transcrita') throw Error('Registra una radicación pendiente de respuesta.');
      recordType = response;
    }
    if (type === 'cobro' && collection(c)) recordType = 'seguimiento';
    const event = { ...fields, type: recordType };
    const error = validateEvent(c, event, holidays);
    if (error) throw Error(error);
    const available = Object.values(availableActionGroups(c)).some((group) => Object.hasOwn(group.actions, type));
    if (!available) throw Error('Esta gestión no está disponible en la etapa actual del expediente.');
    return event;
  }
  function validateEvent(c, e, holidays = []) {
    const previous = (type) => c.events.some((item) => item.type === type && item.date <= e.date);
    if (last(c, 'archivo')) return 'El expediente ya está archivado.';
    if (!actions[e.type] || !e.date || !e.note.trim()) return 'Completa la gestión, fecha y descripción.';
    const step = requiredStep(c);
    if (step && e.type !== step) return 'La siguiente gestión obligatoria es: ' + actions[step][0] + '.';
    const { reception, verification } = intake(c, e.date);
    if (e.type !== 'fisico' && !reception) return 'La fecha de la gestión debe ser igual o posterior a la recepción física.';
    if (e.type !== 'fisico' && e.type !== 'verificacion' && !verification) return 'La fecha de la gestión debe ser igual o posterior a una verificación documental.';
    if (e.type === 'verificacion') {
      if (!['aprobada', 'observada'].includes(e.verificationResult)) return 'Selecciona el resultado de la verificación documental.';
      if (e.verificationResult === 'aprobada' && missing(c).length) return 'Adjunta los soportes requeridos antes de aprobar la documentación.';
    }
    if (e.type === 'radicado' && (needsCorrection(c, verification) || needsCorrection(c))) return 'Corrige los documentos y registra una verificación aprobada antes de radicar.';
    if (e.fileIds !== undefined && !Array.isArray(e.fileIds)) return 'La selección de soportes no es válida.';
    const available = new Set(c.files.map((file) => file.id));
    if (linkedFileIds(e).some((id) => !available.has(id))) return 'Selecciona soportes de este expediente.';
    if (e.type === 'citacion') {
      const due = coordinationDate(c, holidays);
      if (!needsCorrection(c) || !due) return 'La citación requiere correcciones pendientes y que aún no se haya registrado para esta revisión.';
      if (e.date < due) return 'La citación se puede registrar a partir de ' + due + '.';
    }
    if (e.type === 'radicado' && status(c) === 'Rechazada') {
      if (last(c, 'rechazo').date > e.date) return 'La nueva radicación debe ser igual o posterior al rechazo.';
      if (!e.correction?.trim() || !e.filingNumber?.trim()) return 'Indica la corrección realizada y el número del nuevo radicado.';
    }
    if (['aceptacion', 'rechazo'].includes(e.type) && !(last(c, 'radicado')?.date <= e.date)) return 'Registra primero la radicación.';
    if (['cobro', 'seguimiento'].includes(e.type) && (!paymentPending(status(c)) || !(last(c, 'aceptacion')?.date <= e.date))) return 'Registra la aceptación de la entidad y verifica que haya un saldo pendiente.';
    if (e.type === 'seguimiento' && collection(c)?.date > e.date) return 'La fecha de seguimiento debe ser igual o posterior a la última gestión de cobro.';
    if (['aceptacion', 'pago', 'reintegro'].includes(e.type) && !(Number(e.amount) > 0 && Number.isFinite(Number(e.amount)))) return 'Ingresa un valor positivo en COP.';
    if (['aceptacion', 'acuerdo'].includes(e.type) && (!e.due || e.due < e.date)) return 'Registra una fecha prometida válida.';
    if (e.type === 'pago' && !previous('aceptacion')) return 'Registra primero la aceptación de la entidad.';
    if (e.type === 'pago' && (!(Number(e.paidDays) > 0) || !Number.isInteger(Number(e.paidDays)))) return 'Indica los días pagados.';
    if (e.type === 'conciliacion' && !previous('pago')) return 'Registra el pago antes de conciliar.';
    if (e.type === 'cartera') {
      const requests = c.events.filter((item) => item.type === 'persuasivo' && item.date <= e.date).sort((a, b) => a.date.localeCompare(b.date));
      if (requests.length < 2) return 'Registra al menos dos requerimientos persuasivos.';
      if (e.date < add(requests[0].date, 180) && !e.exception) return 'Espera 180 días o confirma y documenta el deterioro crediticio en la descripción.';
    }
    if (e.type === 'agotamiento' && !previous('cartera')) return 'Registra el traslado a Cartera.';
    if (e.type === 'juridica') {
      const promised = paymentPromise(c);
      const denial = status(c) === 'Rechazada' && e.exception;
      const brokenPromise = totals(c).due > 0 && promised && e.date > promised;
      if (!previous('agotamiento') && !denial && !brokenPromise) return 'Registra el agotamiento de Cartera, documenta el rechazo improcedente o verifica que haya vencido la promesa de pago.';
    }
    if (['peticion', 'decision'].includes(e.type) && !previous('juridica')) return 'Registra el traslado a Jurídica.';
    if (e.type === 'tutela' && (!previous('peticion') || !e.exception)) return 'Registra el derecho de petición y confirma que quedó sin respuesta.';
    if (e.type === 'envio' && !previous('concepto')) return 'Registra primero el concepto de rehabilitación.';
    if (e.type === 'archivo' && (!previous('conciliacion') || status(c) !== 'Conciliada' || !e.exception)) return 'Concilia el pago total y confirma la destrucción del soporte clínico físico.';
    return '';
  }
  const api = { types, entities, receiptChannels, docs, actionGroups, actions, availableActionGroups, today, add, months, span, businessDays, days, deadline, channel, required, missing, requiredStep, pendingTask, totals, status, estimate, alerts, linkedFileIds, prepareEvent, validateEvent };
  if (typeof module !== 'undefined') module.exports = api; else root.Nexo = api;
})(globalThis);
