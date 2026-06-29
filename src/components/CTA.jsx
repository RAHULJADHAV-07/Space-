import Reveal from './Reveal.jsx';
import Magnetic from './Magnetic.jsx';

export default function CTA() {
  return (
    <section id="contact">
      <Reveal variant="scale" className="cta-wrap">
        <p className="eyebrow" style={{ textAlign: 'center' }}>Comms open</p>
        <h2>Ready for <span className="solar">liftoff?</span></h2>
        <p>Tell us what you want to build. We'll reply within one working day with a clear next step — no forms that disappear into a black hole.</p>
        <Magnetic strength={0.35}>
          <a className="btn btn-solar" href="mailto:hello@avitatechnology.com">hello@avitatechnology.com</a>
        </Magnetic>
      </Reveal>
    </section>
  );
}
