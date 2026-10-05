"use client";

import QuoteForm from "./quote-form";
  return (
    <form className="quote-form" action="https://formsubmit.co/info@switchfixelectrical.com" method="POST">
      <input type="hidden" name="_cc" value="duanesmith45@gmail.com" />
      <input type="hidden" name="_subject" value="New website inquiry — Switch & Fix" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_autoresponse" value="Thank you for contacting Switch & Fix. We will follow up to discuss your needs and availability. Your inquiry does not confirm an appointment." />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <label>Name<input name="name" autoComplete="name" required placeholder="Your name" /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" required placeholder="Your phone number" /></label>
      <label>Service needed<select name="service" defaultValue="" required><option value="" disabled>Select a service</option><option>Lighting &amp; ceiling fans</option><option>Switches, outlets &amp; smart devices</option><option>Electrical troubleshooting</option><option>Safety detectors</option><option>TV mounting &amp; furniture assembly</option><option>Drywall &amp; small repairs</option><option>Other</option></select></label>
      <label>Tell us about the job<textarea name="details" rows={4} required placeholder="What needs attention?" /></label>
      <button className="button" type="submit">Send Inquiry</button>
      <small>Submitting an inquiry does not confirm an appointment. We’ll contact you to discuss your needs and availability.</small>
      <small>Your details are sent through FormSubmit to Switch &amp; Fix. After submitting, complete the verification to finish sending your inquiry.</small>
    </form>
  );
}
