import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* Countdown 3 · 2 · 1 · LIFTOFF, then lifts away like a launch tower. */
export default function Preloader({ onDone }) {
  const [label, setLabel] = useState('3');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n > 0) setLabel(String(n));
      else if (n === 0) setLabel('LIFTOFF');
      else {
        clearInterval(id);
        setDone(true);
      }
    }, 600);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!done && (
        <motion.div
          className="preloader"
          initial={false}
          exit={{ y: '-100%' }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="pre-label">AVITA · Launch sequence</div>
          <div className="count" style={label === 'LIFTOFF' ? { fontSize: 'clamp(32px,8vw,80px)' } : undefined}>
            <AnimatePresence mode="wait">
              <motion.span
                key={label}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'inline-block' }}
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="pre-bar">
            <motion.i
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
