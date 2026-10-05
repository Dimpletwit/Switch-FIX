"use client";

export default function QuoteForm() {
  return (
    <form
      className="quote-form"
      action="https://formsubmit.co/info@switchfixelectrical.com"
      method="POST"
    >
      <input type="hidden" name="_cc" value="duanesmith45@gmail.com" />
      <input type="hidden" name="_subject" value="New Switch & Fix inquiry" />
      <input type="hidden" name="_template" value="table" />

      <label>
        Name
        <input name="name" autoComplete="name" required />
      </label>

      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>

      <label>
        Phone
        <input name="phone" type="tel" autoComplete="tel" required />
      </label>

      <label>
        Service needed
        <select name="service" defaultValue="" required>
          <option value="" disabled>Select a service</option>
          <option>Lighting & ceiling fans</option>
          <option>Switches, outlets & smart devices</option>
          <option>Electrical troubleshooting</option>
          <option>Safety detectors</option>
          <option>TV mounting & furniture assembly</option>
          <option>Drywall & small repairs</option>
          <option>Other</option>
        </select>
      </label>

      <label>
        Tell us about the job
        <textarea name="details" rows={4} required />
      </label>

      <button className="button" type="submit">Send Inquiry</button>

      <small>
        Submitting an inquiry does not confirm an appointment.
        We’ll contact you to discuss your needs and availability.
      </small>

      <small>
        After your estimate is approved, a 50% deposit is required.
        We’ll send a secure Square invoice for payment.
        The remaining 50% is due when the work is completed.
      </small>
    </form>
  );
}
