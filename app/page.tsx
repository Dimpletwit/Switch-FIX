export default function QuoteForm() {

const services = [
  ["01", "Lighting & fans", "Light fixtures, ceiling fans, and thoughtful upgrades that brighten your space."],
  ["02", "Switches & smart devices", "Outlets, dimmers, switches, and smart-home devices installed with care."],
  ["03", "Troubleshooting", "Practical diagnosis for electrical issues, flickering lights, and faulty connections."],
  ["04", "Safety detectors", "Smoke and carbon-monoxide detector installation and replacement."],
  ["05", "Mounting & assembly", "TV mounting and furniture assembly for homes and workplaces."],
  ["06", "Drywall touch-ups", "Minor drywall repair following electrical work or small installations."],
  ["07", "Everyday repairs", "Door hardware, shelving, and the small fixes that keep a space working well."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Switch and Fix home"><img src="/switch-fix-logo.png" alt="Switch & Fix Electrical & Home Services" /></a>
        <nav aria-label="Primary navigation"><a href="#services">Services</a><a href="#why-us">Why us</a><a href="#process">Process</a></nav>
        <div className="header-actions"><a className="phone-link" href="tel:+18432140641">843-214-0641</a><a className="button button-small" href="#contact">Request a quote</a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Residential &amp; commercial</p>
          <h1>One call.<br /><span>Every fix.</span></h1>
          <p className="hero-lede">Reliable electrical work and practical repairs, handled with care from the first switch to the final detail.</p>
          <div className="hero-actions"><a className="button" href="#contact">Book your service</a><a className="text-link" href="#services">Explore services <span aria-hidden="true">→</span></a></div>
          <div className="trust-line" aria-label="Service qualities"><span>Clear communication</span><span>Respectful service</span><span>Quality workmanship</span></div>
        </div>
        <div className="hero-visual"><img src="/technician-hero-black.webp" alt="Home-service technician in a bright residential interior with a tool belt" width={1122} height={1402} fetchPriority="high" /><div className="service-badge"><strong>Electrical + repairs</strong><span>For home and business</span></div></div>
      </section>

      <section className="intro section-pad" id="services">
        <div className="section-heading"><p className="eyebrow">What we handle</p><h2>Skilled help for the jobs on your list.</h2></div>
        <p className="section-intro">From electrical updates to everyday repairs, Switch &amp; Fix gives homeowners and businesses one dependable place to start.</p>
      </section>
      <section className="services-grid">
        {services.map(([number, title, copy]) => <article className="service-card" key={number}><span className="service-number">{number}</span><h3>{title}</h3><p>{copy}</p><a href="#contact" aria-label={`Request a quote for ${title}`}>Get help <span aria-hidden="true">↗</span></a></article>)}
      </section>

      <section className="why section-pad" id="why-us">
        <div className="why-visual"><img src="/campaign.png" alt="Professional Switch & Fix technician" /><div className="why-frame" aria-hidden="true" /></div>
        <div className="why-copy"><p className="eyebrow">Why Switch &amp; Fix</p><h2>The details matter. So does your time.</h2><p>We bring electrical know-how and practical repair skills together, so you can move through your list with less coordinating and more confidence.</p>
          <div className="reason"><span>01</span><div><h3>One trusted point of contact</h3><p>A simpler way to coordinate a mix of electrical and small repair needs.</p></div></div>
          <div className="reason"><span>02</span><div><h3>Professional in your space</h3><p>Thoughtful communication, tidy work, and respect for homes and workplaces.</p></div></div>
          <div className="reason"><span>03</span><div><h3>Focused on the right fix</h3><p>Clear recommendations shaped around the job in front of us.</p></div></div>
        </div>
      </section>

      <section className="process section-pad" id="process"><div className="process-head"><p className="eyebrow light">How it works</p><h2>From to-do<br />to taken care of.</h2></div><div className="steps">
        <article><span>01</span><h3>Tell us what you need</h3><p>Share the space, the issue, and the kind of help you’re looking for.</p></article>
        <article><span>02</span><h3>Review the scope</h3><p>We’ll clarify the work and make sure expectations are aligned.</p></article>
        <article><span>03</span><h3>Get it fixed</h3><p>Your service is completed with care and attention to the finishing details.</p></article>
      </div></section>

      <section className="contact section-pad" id="contact"><div className="contact-copy"><p className="eyebrow">Start a request</p><h2>What can we fix for you?</h2><p>Give us a few details about the job, or call to speak with Switch &amp; Fix directly.</p><a className="contact-phone" href="tel:+18432140641"><small>Call Switch &amp; Fix</small><strong>843-214-0641</strong></a><div className="contact-note"><strong>Homes. Businesses. Small jobs that matter.</strong><span>Electrical and practical repair services in one place.</span></div></div><QuoteForm /></section>

      <footer><a className="brand footer-brand" href="#top"><img src="/switch-fix-logo.png" alt="Switch & Fix" /></a><p>Electrical &amp; home services for residential and commercial spaces.<br /><a className="footer-phone" href="tel:+18432140641">843-214-0641</a></p><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
