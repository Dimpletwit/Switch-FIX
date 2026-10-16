import { teamPage, customerPage } from './tracker-pages.mjs';

const statuses = ['New inquiry', 'Estimate prepared', 'Scheduled', 'On the way', 'Arrived', 'Completed'];
const headers = { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', 'Permissions-Policy': 'geolocation=(self)', 'Cross-Origin-Resource-Policy': 'same-origin' };
const keyCache = new Map();
const reply = (data, status = 200) => Response.json(data, { status, headers });
const error = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const b64 = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
export const tokenHash = async token => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
export async function clearExpiredLocations(env) {
  if (env.JOBS_DB) await env.JOBS_DB.prepare('UPDATE tracker_trips SET active=0,latitude=NULL,longitude=NULL,accuracy=NULL,location_at=NULL WHERE expires_at<=? AND active=1').bind(Date.now()).run();
}

export async function verifyStaff(request, env) {
  const issuer = env.ACCESS_ISSUER;
  const aud = env.ACCESS_AUD;
  const allowed = (env.STAFF_EMAILS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  if (!issuer || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !aud || !allowed.length) error('Staff access has not been configured.', 503);
  const raw = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!raw || raw.length > 16000) error('Sign in through the staff access page.', 401);
  try {
    const parts = raw.split('.');
    if (parts.length !== 3) throw new Error();
    const head = JSON.parse(new TextDecoder().decode(b64(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(b64(parts[1])));
    const now = Math.floor(Date.now() / 1000);
    if (head.alg !== 'RS256' || typeof head.kid !== 'string' || claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(aud) || typeof claims.exp !== 'number' || claims.exp <= now || typeof claims.iat !== 'number' || claims.iat > now + 30 || (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || claims.nbf > now + 30))) throw new Error();
    let cached = keyCache.get(issuer);
    if (!cached || cached.until < Date.now() || !cached.keys.some(k => k.kid === head.kid)) {
      const response = await fetch(issuer + '/cdn-cgi/access/certs');
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!Array.isArray(result.keys)) throw new Error();
      cached = { keys: result.keys, until: Date.now() + 300000 }; keyCache.set(issuer, cached);
    }
    const jwk = cached.keys.find(k => k.kid === head.kid && k.kty === 'RSA');
    if (!jwk) throw new Error();
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]))) throw new Error();
    if (typeof claims.email !== 'string' || !allowed.includes(claims.email.toLowerCase())) throw new Error();
    return claims.email.toLowerCase();
  } catch { error('Staff sign-in is missing, expired, or not permitted.', 401); }
}

async function jsonBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) error('Use JSON for this request.', 415);
  if (Number(request.headers.get('content-length') || 0) > 700000) error('Request too large.', 413);
  const reader = request.body?.getReader(); if (!reader) error('Request body is required.');
  let size = 0; const chunks = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 700000) { await reader.cancel(); error('Request too large.', 413); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const data = JSON.parse(new TextDecoder().decode(bytes)); if (!data || typeof data !== 'object' || Array.isArray(data)) error('Invalid request.'); return data; } catch { error('Invalid JSON.'); }
}
function cleanJob(input) {
  const fields = { customer: 120, email: 180, phone: 40, address: 350, service: 100, appointment: 60, technician: 80, notes: 4000 };
  const job = {};
  for (const [name, max] of Object.entries(fields)) { if (typeof input[name] !== 'string' || input[name].length > max) error('Invalid ' + name + '.'); job[name] = input[name].trim(); }
  if (!job.customer || !job.service) error('Customer and service are required.');
  if (job.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.email)) error('Invalid email.');
  if (!statuses.includes(input.status)) error('Invalid job status.'); job.status = input.status;
  for (const name of ['estimateCents', 'paidCents']) { if (!Number.isSafeInteger(input[name]) || input[name] < 0 || input[name] > 100000000) error('Invalid payment amount.'); job[name] = input[name]; }
  if (job.paidCents > job.estimateCents) error('Payments cannot exceed the estimate.');
  return job;
}
async function jobRow(db, id) { const row = await db.prepare('SELECT * FROM tracker_jobs WHERE id = ?').bind(id).first(); if (!row) error('Job not found.', 404); return row; }
const unpack = row => ({ id: row.id, ...JSON.parse(row.data), version: row.version, updatedAt: row.updated_at });
const html = page => new Response(page, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" } });

export async function handleTracker(request, env) {
  const url = new URL(request.url); const path = url.pathname;
  const staff = path === '/team' || path.startsWith('/team/') || path === '/api/team' || path.startsWith('/api/team/');
  const publicRoute = path === '/track' || path === '/api/tracking';
  if (!staff && !publicRoute) return null;
  try {
    if (staff) await verifyStaff(request, env);
    if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) error('Request origin not permitted.', 403);
    if ((path === '/team' || path === '/team/') && request.method === 'GET') return html(teamPage);
    if (path === '/track' && request.method === 'GET') return html(customerPage);
    const db = env.JOBS_DB; if (!db) error('Job storage has not been connected.', 503);
    await clearExpiredLocations(env);
    if (path === '/api/tracking' && request.method === 'GET') {
      const token = request.headers.get('X-Tracking-Token') || '';
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) error('Tracking link is unavailable or expired.', 404);
      const trip = await db.prepare('SELECT * FROM tracker_trips WHERE token_hash = ?').bind(await tokenHash(token)).first();
      const now = Date.now();
      if (!trip || trip.expires_at <= now) error('Tracking link is unavailable or expired.', 404);
      const job = unpack(await jobRow(db, trip.job_id));
      const live = Boolean(trip.active && job.status === 'On the way');
      const fresh = live && typeof trip.location_at === 'number' && now - trip.location_at < 120000;
      return reply({ status: job.status, technician: job.technician || 'Your technician', service: job.service, appointment: job.appointment, sharing: live, stale: live && !fresh, location: fresh ? { latitude: trip.latitude, longitude: trip.longitude, accuracy: trip.accuracy, updatedAt: trip.location_at } : null });
    }
    if (path === '/api/team/jobs' && request.method === 'GET') {
      const rows = await db.prepare('SELECT * FROM tracker_jobs ORDER BY updated_at DESC LIMIT 500').all(); return reply({ jobs: rows.results.map(unpack) });
    }
    if (path === '/api/team/jobs' && request.method === 'POST') {
      const job = cleanJob(await jsonBody(request)); if (['On the way', 'Arrived'].includes(job.status)) error('Create the job before starting a trip.');
      const id = crypto.randomUUID(); const date = new Date().toISOString();
      await db.prepare('INSERT INTO tracker_jobs(id,data,created_at,updated_at) VALUES (?,?,?,?)').bind(id, JSON.stringify(job), date, date).run();
      return reply({ job: unpack(await jobRow(db, id)) }, 201);
    }
    const match = path.match(/^\/api\/team\/jobs\/([a-f0-9-]{36})(?:\/(trip|location|photos))?$/);
    if (!match) error('Not found.', 404);
    const [, id, action] = match; const row = await jobRow(db, id); const job = unpack(row);
    if (!action && request.method === 'PATCH') {
      const data = await jsonBody(request); if (data.version !== row.version) error('This job changed. Reload before saving.', 409);
      const next = cleanJob(data); if (next.status === 'On the way' && job.status !== 'On the way') error('Use On My Way to start sharing.');
      const result = await db.prepare('UPDATE tracker_jobs SET data=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(next), new Date().toISOString(), id, row.version).run();
      if (result.meta.changes !== 1) error('This job changed. Reload before saving.', 409);
      if (next.status !== 'On the way') await db.prepare('UPDATE tracker_trips SET active=0,latitude=NULL,longitude=NULL,accuracy=NULL,location_at=NULL WHERE job_id=?').bind(id).run();
      return reply({ job: unpack(await jobRow(db, id)) });
    }
    if (action === 'trip' && request.method === 'POST') {
      const data = await jsonBody(request); if (data.consent !== true) error('Technician location consent is required.');
      if (job.status === 'Completed') error('Completed jobs cannot start a trip.');
      const token = base64url(crypto.getRandomValues(new Uint8Array(32))); const expires = Date.now() + 8 * 3600000;
      const next = cleanJob({ ...job, status: 'On the way' });
      await db.batch([
        db.prepare('UPDATE tracker_trips SET active=0,latitude=NULL,longitude=NULL,accuracy=NULL,location_at=NULL WHERE job_id=?').bind(id),
        db.prepare('INSERT INTO tracker_trips(token_hash,job_id,expires_at) VALUES(?,?,?)').bind(await tokenHash(token), id, expires),
        db.prepare('UPDATE tracker_jobs SET data=?,version=version+1,updated_at=? WHERE id=?').bind(JSON.stringify(next), new Date().toISOString(), id),
      ]);
      return reply({ trackingUrl: url.origin + '/track#' + token, expiresAt: expires, job: unpack(await jobRow(db, id)) });
    }
    if (action === 'trip' && request.method === 'DELETE') {
      const next = cleanJob({ ...job, status: job.status === 'On the way' ? 'Scheduled' : job.status });
      await db.batch([db.prepare('UPDATE tracker_trips SET active=0,latitude=NULL,longitude=NULL,accuracy=NULL,location_at=NULL WHERE job_id=?').bind(id), db.prepare('UPDATE tracker_jobs SET data=?,version=version+1,updated_at=? WHERE id=?').bind(JSON.stringify(next), new Date().toISOString(), id)]);
      return reply({ job: unpack(await jobRow(db, id)) });
    }
    if (action === 'location' && request.method === 'POST') {
      const data = await jsonBody(request);
      if (!Number.isFinite(data.latitude) || Math.abs(data.latitude) > 90 || !Number.isFinite(data.longitude) || Math.abs(data.longitude) > 180 || !Number.isFinite(data.accuracy) || data.accuracy < 0 || data.accuracy > 3000) error('Location is invalid or too imprecise.');
      if (job.status !== 'On the way') error('This trip is not active.', 409);
      const result = await db.prepare('UPDATE tracker_trips SET latitude=?,longitude=?,accuracy=?,location_at=? WHERE job_id=? AND active=1 AND expires_at>?').bind(data.latitude, data.longitude, data.accuracy, Date.now(), id, Date.now()).run();
      if (!result.meta.changes) error('This trip has ended.', 409); return reply({ ok: true });
    }
    if (action === 'photos' && request.method === 'GET') { const photos = await db.prepare('SELECT id,mime,image,created_at FROM tracker_photos WHERE job_id=? ORDER BY created_at DESC').bind(id).all(); return reply({ photos: photos.results }); }
    if (action === 'photos' && request.method === 'POST') {
      const data = await jsonBody(request); const count = await db.prepare('SELECT COUNT(*) AS total FROM tracker_photos WHERE job_id=?').bind(id).first();
      if (count.total >= 5) error('Maximum five photos per job.');
      if (!['image/jpeg','image/png','image/webp'].includes(data.mime) || typeof data.image !== 'string' || data.image.length > 550000 || !/^[A-Za-z0-9+/]+=*$/.test(data.image)) error('Upload a JPEG, PNG or WebP smaller than 400 KB.');
      let bytes; try { bytes = b64(data.image); } catch { error('Invalid image.'); }
      const valid = data.mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : data.mime === 'image/png' ? [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v) : new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
      if (!valid || bytes.length > 409600) error('Invalid image.');
      await db.prepare('INSERT INTO tracker_photos(id,job_id,mime,image,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(), id, data.mime, data.image, new Date().toISOString()).run(); return reply({ ok: true }, 201);
    }
    error('Method not allowed.', 405);
  } catch (err) { return reply({ error: err.status ? err.message : 'The job service is temporarily unavailable.' }, err.status || 503); }
}
