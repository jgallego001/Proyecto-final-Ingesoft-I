const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const rules = require('./domain');
const derive = promisify(crypto.scrypt);
const limit = 25 * 1024 * 1024;
let vault;
let key;
let salt;
let data;
let queue = Promise.resolve();

function seal(buffer, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}
function open(buffer, secret) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', secret, buffer.subarray(0, 12));
  decipher.setAuthTag(buffer.subarray(12, 28));
  return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]);
}
async function exists(file) {
  try { await fs.access(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
const index = () => path.join(vault, 'expedientes.bin');
const filePath = (id) => path.join(vault, id + '.bin');
async function persist(next, secret = key, prefix = salt) {
  const tmp = index() + '.tmp';
  await fs.writeFile(tmp, Buffer.concat([prefix, seal(Buffer.from(JSON.stringify(next)), secret)]), { mode: 0o600 });
  await fs.rename(tmp, index());
  data = next;
}
async function purge(next) {
  for (const id of next.pendingPurge || []) await fs.rm(filePath(id), { force: true });
  if (next.pendingPurge?.length) await persist({ ...next, pendingPurge: [] });
}
function find(id, source = data) {
  const c = source.cases.find((item) => item.id === id);
  if (!c) throw Error('No se encontró el expediente.');
  return c;
}
function validDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
}
function requiredText(v) { return typeof v === 'string' && v.trim() && v.length <= 3000; }

const handlers = {
  configured: () => exists(index()),
  async unlock(password) {
    if (key) return data;
    const present = await exists(index());
    if (typeof password !== 'string' || password.length < 10 || password.length > 512) throw Error('La contraseña debe tener entre 10 y 512 caracteres.');
    const blob = present ? await fs.readFile(index()) : null;
    const prefix = blob ? blob.subarray(0, 16) : crypto.randomBytes(16);
    const secret = await derive(password, prefix, 32);
    if (blob) {
      try { data = JSON.parse(open(blob.subarray(16), secret).toString()); }
      catch { throw Error('La contraseña es incorrecta o el almacén está dañado.'); }
    } else {
      await persist({ cases: [], holidays: [], reports: [], unidentified: [] }, secret, prefix);
    }
    key = secret;
    salt = prefix;
    try { await purge(data); }
    catch (error) {
      handlers.lock();
      throw error;
    }
    return data;
  },
  lock() { key.fill(0); key = undefined; salt = undefined; data = undefined; },
  async create(input) {
    const { name, document, entity, type, start, end, issued, received, birth, receipt, ibc, prior, gestation, multiple, transcribed, note } = input;
    if (![name, document, entity, receipt].every(requiredText) || !rules.types.includes(type)) throw Error('Completa la identificación, la entidad, el tipo y el canal.');
    if (![start, end, issued, received].every(validDate) || end < start || received < issued) throw Error('Revisa las fechas del expediente.');
    if (['Licencia de maternidad', 'Licencia de paternidad'].includes(type) && !validDate(birth)) throw Error('Indica la fecha de nacimiento.');
    if (!Number.isFinite(Number(ibc)) || Number(ibc) < 0 || !Number.isSafeInteger(Number(prior)) || Number(prior) < 0) throw Error('Revisa el IBC y los días previos.');
    const created = { id: crypto.randomUUID(), folio: 'NX-' + String(data.cases.length + 1).padStart(5, '0'),
      name: name.trim(), document: document.trim(), entity: rules.entities.find((value) => value.toLowerCase() === entity.trim().toLowerCase()) || entity.trim(), type, start, end, issued, received,
      birth, receipt, ibc, prior, gestation, multiple: !!multiple, transcribed: !!transcribed, note, files: [], events: [] };
    if (data.cases.some((item) => ['document', 'type', 'start', 'end'].every((field) => item[field] === created[field]))) throw Error('Ya existe un expediente con el mismo documento, tipo y periodo.');
    await persist({ ...data, cases: [created, ...data.cases] });
    return { data, id: created.id };
  },
  async attach(id, kind) {
    const c = find(id);
    if (rules.status(c) === 'Archivada' || !rules.docs.includes(kind)) throw Error('El expediente o el tipo de soporte no está disponible.');
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Soportes', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'csv'] }] });
    if (result.canceled) return data;
    const source = result.filePaths[0];
    const stat = await fs.stat(source);
    if (!stat.isFile() || stat.size === 0 || stat.size > limit) throw Error('Selecciona un archivo de hasta 25 MB.');
    const buffer = await fs.readFile(source);
    if (buffer.length > limit) throw Error('El archivo supera 25 MB.');
    const next = structuredClone(data);
    const file = { id: crypto.randomUUID(), name: path.basename(source), kind, date: rules.today() };
    await fs.writeFile(filePath(file.id), seal(buffer, key), { mode: 0o600, flag: 'wx' });
    find(id, next).files.push(file);
    try { await persist(next); }
    catch (error) { await fs.rm(filePath(file.id), { force: true }); throw error; }
    return data;
  },
  async exportFile(id, fileId) {
    const file = find(id).files.find((item) => item.id === fileId);
    if (!file) throw Error('El soporte ya no está disponible.');
    const result = await dialog.showSaveDialog({ defaultPath: file.name });
    if (!result.canceled) await fs.writeFile(result.filePath, open(await fs.readFile(filePath(file.id)), key), { mode: 0o600 });
    return !result.canceled;
  },
  async event(id, event) {
    const next = structuredClone(data);
    const c = find(id, next);
    if (!validDate(event.date) || (event.due && !validDate(event.due)) || !requiredText(event.note)) throw Error('Revisa la fecha y la descripción.');
    const error = rules.validateEvent(c, event, data.holidays);
    if (error) throw Error(error);
    const clinical = c.files.filter((f) => f.kind === rules.docs[1]);
    c.events.push({ ...event, id: crypto.randomUUID(), at: new Date().toISOString() });
    if (event.type === 'archivo') {
      next.pendingPurge = [...(next.pendingPurge || []), ...clinical.map((f) => f.id)];
      c.files = c.files.filter((f) => f.kind !== rules.docs[1]);
      for (const e of c.events) if (clinical.some((f) => f.id === e.fileId)) e.fileId = '';
    }
    await persist(next);
    if (event.type === 'archivo') await purge(data);
    return data;
  },
  async holiday(value) {
    if (!validDate(value)) throw Error('Selecciona una fecha válida.');
    const holidays = data.holidays.includes(value) ? data.holidays.filter((d) => d !== value) : [...data.holidays, value].sort();
    await persist({ ...data, holidays });
    return data;
  },
  async report(item) {
    if (!['Ausentismo', 'Conciliación', 'Monitoreo'].includes(item.kind) || !/^\d{4}-\d{2}$/.test(item.period) || !validDate(item.date) || !requiredText(item.note)) throw Error('Completa el periodo, fecha y constancia del envío.');
    await persist({ ...data, reports: [...data.reports, item] });
    return data;
  },
  async unidentified(item) {
    const next = structuredClone(data);
    next.unidentified ||= [];
    if (item.id) {
      const entry = next.unidentified.find((record) => record.id === item.id);
      if (!entry || entry.resolution || !requiredText(item.resolution)) throw Error('Revisa la referencia del expediente y el detalle de la identificación.');
      entry.resolution = item.resolution;
      if (item.caseId) entry.caseId = find(item.caseId).id;
      entry.resolvedAt = rules.today();
    } else {
      if (![item.entity, item.note].every(requiredText) || !validDate(item.date) || !(Number(item.amount) > 0 && Number.isFinite(Number(item.amount)))) throw Error('Completa los datos del saldo.');
      next.unidentified.push({ ...item, id: crypto.randomUUID() });
    }
    await persist(next);
    return data;
  },
  async csv(name, rows) {
    if (!Array.isArray(rows) || !name.endsWith('.csv')) throw Error('El reporte no tiene un formato válido.');
    const result = await dialog.showSaveDialog({ defaultPath: name, filters: [{ name: 'CSV', extensions: ['csv'] }] });
    if (result.canceled) return false;
    const quoted = (value) => {
      const s = String(value ?? '');
      return '"' + (/^[\s]*[=+@-]|^[\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    };
    await fs.writeFile(result.filePath, '\uFEFF' + rows.map((row) => row.map(quoted).join(';')).join('\r\n'), { mode: 0o600 });
    return true;
  },
  async analysis() {
    const groups = {};
    const upcoming = {};
    for (const c of data.cases) {
      const s = rules.status(c);
      groups[s] = (groups[s] || 0) + 1;
      for (const a of rules.alerts(c, rules.today(), data.holidays)) {
        if (a.due && a.due <= rules.add(rules.today(), 7)) upcoming[a.kind] = (upcoming[a.kind] || 0) + 1;
      }
    }
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(90000),
      body: JSON.stringify({ model: 'llama3.2:3b', stream: false, messages: [
        { role: 'system', content: 'Eres asistente administrativo. En español resume y prioriza este conteo agregado en hasta cinco puntos. No inventes datos, diagnósticos ni plazos.' },
        { role: 'user', content: JSON.stringify({ expedientesPorEstado: groups, alertasVencidasYProximos7Dias: upcoming }) }
      ] })
    }).catch(() => { throw Error('Ollama no respondió. Inicia Ollama localmente y descarga llama3.2:3b.'); });
    if (!response.ok) throw Error('Ollama devolvió un error. Verifica que llama3.2:3b esté instalado.');
    const result = await response.json();
    if (!result.message?.content?.trim()) throw Error('El modelo no devolvió un análisis.');
    return result.message.content;
  }
};

app.setName('Nexo Salud');
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(async () => {
  vault = path.join(app.getPath('userData'), 'vault');
  await fs.mkdir(vault, { recursive: true, mode: 0o700 });
  ipcMain.handle('nexo', (sender, method, ...args) => {
    const task = queue.then(() => {
      if (sender.senderFrame?.url !== window.webContents.getURL() || !Object.hasOwn(handlers, method)) throw Error('Operación no disponible.');
      if (!key && !['configured', 'unlock'].includes(method)) throw Error('Desbloquea el almacén.');
      return handlers[method](...args);
    });
    queue = task.catch(() => {});
    return task;
  });
  const window = new BrowserWindow({
    width: 1420, height: 920, minWidth: 900, minHeight: 650, title: 'Nexo Salud', backgroundColor: '#f3f6fa',
    autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await window.loadFile('index.html');
});
app.on('window-all-closed', () => app.quit());
