"use client";

import { FormEvent, useState } from "react";

export default function QuoteForm() {
  const [ready, setReady] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setReady(true); }
  return ready ? (
    <div className="form-success" role="status"><span aria-hidden="true">✓</span><h3>Your request is ready.</h3><p>Thanks for sharing the details. Call Switch &amp; Fix to discuss the job and schedule your service.</p><a className="button" href="tel:+18432140641">Call 843-214-0641</a><button type="button" onClick={() => setReady(false)}>Edit request</button></div>
  ) : (
    <form className="quote-form" onSubmit={submit}>
      <label>Name<input name="name" autoComplete="name" required placeholder="Your name" /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
      <label>Service needed<select name="service" defaultValue="" required><option value="" disabled>Select a service</option><option>Lighting &amp; ceiling fans</option><option>Switches, outlets &amp; smart devices</option><option>Electrical troubleshooting</option><option>Safety detectors</option><option>TV mounting &amp; furniture assembly</option><option>Drywall &amp; small repairs</option><option>Other</option></select></label>
      <label>Tell us about the job<textarea name="details" rows={4} required placeholder="What needs attention?" /></label>
      <button className="button" type="submit">Prepare request</button><small>Your information stays on this device. Call 843-214-0641 to send your request.</small>
    </form>
  );
}
