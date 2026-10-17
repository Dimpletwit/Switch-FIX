// Sending stays disabled until an operator configures and verifies each channel.
const brand = 'Switch & Fix Electrical & Home Services';
export const publicOrigin = 'https://www.switchfixelectrical.com';
export function normalizePhone(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  return /^[2-9][0-9]{9}$/.test(digits) ? '+1' + digits : /^1[2-9][0-9]{9}$/.test(digits) ? '+' + digits : null;
}
export function notificationReadiness(env) {
  return {
    sms: env.SMS_NOTIFICATIONS_ENABLED !== 'true' ? 'Off — awaiting campaign approval and a verified connection' :
      env.TWILIO_CAMPAIGN_APPROVED !== 'true' || env.NOTIFICATIONS_TESTED !== 'true' ? 'Off — approval and connection test required' :
      !/^AC[0-9a-f]{32}$/i.test(env.TWILIO_ACCOUNT_SID || '') || !/^SK[0-9a-f]{32}$/i.test(env.TWILIO_API_KEY || '') || !env.TWILIO_API_SECRET || !/^MG[0-9a-f]{32}$/i.test(env.TWILIO_MESSAGING_SERVICE_SID || '') ? 'Off — secure Twilio credentials required' : 'Ready',
    email: env.EMAIL_NOTIFICATIONS_ENABLED !== 'true' ? 'Off — email sending is not connected' :
      env.NOTIFICATIONS_TESTED !== 'true' || typeof env.EMAIL?.send !== 'function' || env.EMAIL_SENDER_VERIFIED !== 'true' ? 'Off — verified email sender and connection test required' : 'Ready',
  };
}
export function messageText(kind, job, trackingUrl) {
  if (kind === 'opt-in') return brand + ': You’re subscribed to appointment confirmations, scheduling updates, and technician arrival texts with tracking links. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. Call 843-214-0641 for assistance.';
  if (kind === 'scheduled') {
    if (!job.appointment?.trim()) throw new Error('An appointment window is required.');
    return 'Switch & Fix: Your appointment is scheduled for ' + job.appointment + '. Questions? Call 843-214-0641. Reply STOP to unsubscribe or HELP for help.';
  }
  if (kind !== 'on-the-way' || !new RegExp('^https://www\\.switchfixelectrical\\.com/track#[A-Za-z0-9_-]{43}$').test(trackingUrl || '')) throw new Error('A valid private tracking link is required.');
  return 'Switch & Fix: ' + (job.technician || 'Your technician') + ' is on the way! Track your visit: ' + trackingUrl + '. Reply STOP to unsubscribe or HELP for help.';
}
const escapeHtml = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function sendSms(env, job, text) {
  const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + env.TWILIO_ACCOUNT_SID + '/Messages.json', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: { Authorization: 'Basic ' + btoa(env.TWILIO_API_KEY + ':' + env.TWILIO_API_SECRET), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: normalizePhone(job.phone), MessagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID, Body: text }),
  });
  // Never expose provider responses, which may contain customer details or the trip link.
  if (!response.ok) { await response.body?.cancel(); return { status: 'rejected' }; }
  await response.body?.cancel();
  return { status: 'accepted' };
}
async function sendEmail(env, job, text, kind) {
  await env.EMAIL.send({ to: job.email, from: { email: 'info@switchfixelectrical.com', name: brand }, replyTo: 'info@switchfixelectrical.com', subject: kind === 'scheduled' ? 'Your Switch & Fix appointment' : 'Your Switch & Fix technician is on the way', text, html: '<p>' + escapeHtml(text) + '</p>' });
  return { status: 'accepted' };
}
// At most one provider attempt per job event/channel. Ambiguous network outcomes
// remain "unknown" and are not retried automatically, to avoid duplicate texts.
export async function notifyEvent(env, job, eventKey, kind, trackingUrl) {
  const readiness = notificationReadiness(env); const results = {};
  for (const channel of ['sms', 'email']) {
    if (kind === 'opt-in' && channel === 'email') continue;
    if (readiness[channel] !== 'Ready') { results[channel] = 'disabled'; continue; }
    if (channel === 'sms' ? !job.smsConsent || !job.smsConsentEvidence || !normalizePhone(job.phone) : !job.emailConsent || !job.email) { results[channel] = 'no consent or contact'; continue; }
    try {
      const text = messageText(kind, job, trackingUrl);
      const key = eventKey + ':' + channel;
      const claim = await env.JOBS_DB.prepare('INSERT OR IGNORE INTO tracker_notifications(event_key,job_id,channel,kind,status,created_at) VALUES(?,?,?,?,?,?)').bind(key, job.id, channel, kind, 'sending', new Date().toISOString()).run();
      if (claim.meta.changes !== 1) { results[channel] = 'already attempted'; continue; }
      let status;
      try { status = (await (channel === 'sms' ? sendSms(env, job, text) : sendEmail(env, job, text, kind))).status; }
      catch { status = 'unknown'; }
      await env.JOBS_DB.prepare('UPDATE tracker_notifications SET status=? WHERE event_key=?').bind(status, key).run();
      results[channel] = status;
    } catch { results[channel] = 'unavailable'; }
  }
  return results;
}
