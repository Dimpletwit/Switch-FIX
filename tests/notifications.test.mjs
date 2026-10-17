import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { notificationReadiness, notifyEvent, messageText, normalizePhone } from '../worker/notifications.mjs';
function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_job_tracker.sql', import.meta.url), 'utf8'));
  db.exec(readFileSync(new URL('../migrations/0002_notifications.sql', import.meta.url), 'utf8'));
  db.prepare('INSERT INTO tracker_jobs(id,data,created_at,updated_at) VALUES(?,?,?,?)').run('test-job','{}','test','test');
  return { db, prepare(sql) { return { bind(...args) { return { run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }) }; } }; } };
}
const job = { id:'test-job', phone:'843-555-0123', email:'customer@example.com', smsConsent:true, smsConsentEvidence:'Test website inquiry consent record', emailConsent:true, appointment:'Oct 20, 2–4 PM ET', technician:'Duane' };
const ready = () => ({ SMS_NOTIFICATIONS_ENABLED:'true', TWILIO_CAMPAIGN_APPROVED:'true', NOTIFICATIONS_TESTED:'true', TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32), TWILIO_API_KEY:'SK'+'b'.repeat(32), TWILIO_API_SECRET:'test-only-not-a-real-secret', TWILIO_MESSAGING_SERVICE_SID:'MG'+'c'.repeat(32) });
test('disabled channels never call a provider or require the new database table', async () => {
  assert.notEqual(notificationReadiness({}).sms,'Ready');
  assert.deepEqual(await notifyEvent({},job,'event','scheduled'),{sms:'disabled',email:'disabled'});
  assert.notEqual(notificationReadiness({...ready(),TWILIO_CAMPAIGN_APPROVED:'false'}).sms,'Ready');
  assert.notEqual(notificationReadiness({...ready(),NOTIFICATIONS_TESTED:'false'}).sms,'Ready');
});
test('no consent and invalid contacts never attempt sending', async () => {
  const env=ready();
  assert.equal((await notifyEvent(env,{...job,smsConsent:false},'one','scheduled')).sms,'no consent or contact');
  assert.equal((await notifyEvent(env,{...job,smsConsentEvidence:''},'two','scheduled')).sms,'no consent or contact');
  assert.equal((await notifyEvent(env,{...job,phone:'abc'},'three','scheduled')).sms,'no consent or contact');
  assert.equal(normalizePhone('(217) 776-8663'),'+12177768663');
});
test('a repeated event makes one provider attempt; tokens and recipients are not saved in the ledger', async () => {
  const original=globalThis.fetch, store=database(); let count=0;
  const env={...ready(),JOBS_DB:store};
  globalThis.fetch=async (url,options)=>{count++;assert.match(url,/^https:\/\/api.twilio.com/);assert.equal(options.body.get('To'),'+18435550123');assert.equal(options.body.get('MessagingServiceSid'),env.TWILIO_MESSAGING_SERVICE_SID);assert.match(options.body.get('Body'),/\/track#/);return new Response(null,{status:201});};
  try {
    const link='https://www.switchfixelectrical.com/track#'+'x'.repeat(43);
    const results=await Promise.all([notifyEvent(env,job,'one','on-the-way',link),notifyEvent(env,job,'one','on-the-way',link)]);
    assert.equal(count,1);assert.deepEqual(results.map(x=>x.sms).sort(),['accepted','already attempted']);
    const record=store.db.prepare('SELECT * FROM tracker_notifications').get();
    assert.equal(record.status,'accepted');assert.doesNotMatch(JSON.stringify(record),/customer@example|843|track#/);
  } finally {globalThis.fetch=original;store.db.close();}
});
test('ambiguous failures are recorded without retrying or exposing provider errors', async () => {
  const original=globalThis.fetch,store=database();let calls=0;
  globalThis.fetch=async()=>{calls++;throw new Error('sensitive provider response');};
  try {
    const env={...ready(),JOBS_DB:store};
    assert.equal((await notifyEvent(env,job,'one','scheduled')).sms,'unknown');
    assert.equal((await notifyEvent(env,job,'one','scheduled')).sms,'already attempted');assert.equal(calls,1);
  } finally {globalThis.fetch=original;store.db.close();}
});
test('email uses the verified binding and escapes customer-supplied text',async()=>{
  const store=database();let sent;
  try {
    const env={EMAIL_NOTIFICATIONS_ENABLED:'true',NOTIFICATIONS_TESTED:'true',EMAIL_SENDER_VERIFIED:'true',EMAIL:{send:async data=>{sent=data;return {messageId:'test'};}},JOBS_DB:store};
    assert.equal((await notifyEvent(env,{...job,appointment:'<img onerror=bad>'},'one','scheduled')).email,'accepted');
    assert.equal(sent.to,job.email);assert.doesNotMatch(sent.html,/<img/);assert.match(sent.html,/&lt;img/);
  }finally{store.db.close();}
});
test('only branded private tracking URLs are accepted',()=>{
  assert.throws(()=>messageText('on-the-way',job,'https://attacker.example/track#'+'x'.repeat(43)));
  assert.throws(()=>messageText('scheduled',{...job,appointment:''}));
});
