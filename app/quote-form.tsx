"use client";

import { useState } from "react";

const smsDisclosure = "I agree to receive automated appointment confirmations, scheduling updates, and technician arrival texts with tracking links from Switch & Fix Electrical & Home Services at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is optional and is not a condition of purchasing services.";


export default function QuoteForm() {
  const [smsConsent, setSmsConsent] = useState(false);
  return (
    <form className="quote-form" action="https://formsubmit.co/info@switchfixelectrical.com" method="POST" onSubmit={(event) => {
      const timestamp = event.currentTarget.elements.namedItem("sms_consent_recorded_at") as HTMLInputElement;
      timestamp.value = new Date().toISOString();
    }}>
      <input type="hidden" name="sms_consent" value={smsConsent ? "Yes — explicitly opted in" : "No — do not send SMS"} />
      <input type="hidden" name="sms_consent_recorded_at" defaultValue="" />
      <input type="hidden" name="sms_consent_version" value="2026-10-17" />
      <input type="hidden" name="sms_consent_source" value="https://www.switchfixelectrical.com/#contact" />
      <input type="hidden" name="sms_consent_disclosure" value={smsDisclosure} />
      <input type="hidden" name="_cc" value="duanesmith45@gmail.com" />
      <input type="hidden" name="_subject" value="New website inquiry — Switch & Fix" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_autoresponse" value="Thank you for contacting Switch & Fix. We will follow up to discuss your needs and availability. Your inquiry does not confirm an appointment." />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <label>Name<input name="name" autoComplete="name" required placeholder="Your name" /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" required placeholder="Your phone number" /></label>
      <label>Service needed<select name="service" defaultValue="" required><option value="" disabled>Select a service</option><option>Lighting &amp; ceiling fans</option><option>Switches, outlets &amp; smart devices</option><option>Electrical troubleshooting</option><option>Safety detectors</option><option>TV mounting &amp; furniture assembly</option><option>Drywall &amp; small repairs</option><option>Electrical Rough-Ins</option><option>Electrical Trim-Outs</option><option>Other</option></select></label>
      <label>Tell us about the job<textarea name="details" rows={4} required placeholder="What needs attention?" /></label>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 12, fontWeight: 400, lineHeight: 1.6 }}>
          <input type="checkbox" checked={smsConsent} onChange={(event) => setSmsConsent(event.target.checked)} style={{ width: 20, height: 20, flexShrink: 0, marginTop: 3, padding: 0, accentColor: "var(--orange)" }} />
          <span>{smsDisclosure}</span>
        </label>
        <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
          <a href="/sms-terms" style={{ textDecoration: "underline" }}>SMS Terms</a>{" · "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</a>
        </p>
      </div>
      <button className="button" type="submit" style={{ gridColumn: "1 / -1" }}>Send Inquiry</button>
      <small>Submitting an inquiry does not confirm an appointment. We’ll contact you to discuss your needs and availability.</small>
      <small>Your details are sent through FormSubmit to Switch &amp; Fix. After submitting, complete the verification to finish sending your inquiry.</small>
    </form>
  );
}
