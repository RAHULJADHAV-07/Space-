import { useEffect, useState } from 'react';
import useSmoothScroll from './hooks/useSmoothScroll.js';
import { prefersReducedMotion } from './lib/store.js';

import Scene from './components/Scene.jsx';
import SceneBoundary from './components/SceneBoundary.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import HUD from './components/HUD.jsx';
import Nav from './components/Nav.jsx';
import OrbContact from './components/OrbContact.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import Services from './components/Services.jsx';
import Flight from './components/Flight.jsx';
import Stats from './components/Stats.jsx';
import Crew from './components/Crew.jsx';
import CTA from './components/CTA.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [ready, setReady] = useState(prefersReducedMotion);
  useSmoothScroll();

  // lock scroll while the preloader is up
  useEffect(() => {
    document.body.style.overflow = ready ? '' : 'hidden';
  }, [ready]);

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <SceneBoundary><Scene /></SceneBoundary>
      <div className="vignette" aria-hidden="true" />
      {!prefersReducedMotion && <div className="grain" aria-hidden="true" />}

      <ProgressBar />
      <Cursor />
      <HUD />

      {!prefersReducedMotion && <Preloader onDone={() => setReady(true)} />}

      <Nav ready={ready} />
      <OrbContact />

      <main>
        <Hero ready={ready} />
        <Marquee />
        <Services />
        <Flight />
        <Stats />
        <Crew />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
