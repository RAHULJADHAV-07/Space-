import { motion } from 'framer-motion';
import Magnetic from './Magnetic.jsx';

const LINKS = [
  ['Services', '#services'],
  ['Process', '#flight'],
  ['Telemetry', '#stats'],
  ['Crew', '#crew'],
  ['Contact', '#contact'],
];

export default function Nav({ ready }) {
  return (
    <nav>
      <motion.div
        className="nav-pill"
        initial={{ y: -80, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <a className="logo" href="#top">AVITA<span>.</span>TECH</a>
        <ul className="nav-links">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <Magnetic strength={0.25}><a href={href}>{label}</a></Magnetic>
            </li>
          ))}
        </ul>
      </motion.div>
    </nav>
  );
}
