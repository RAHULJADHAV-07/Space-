import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../lib/store.js';

const EASE = [0.22, 1, 0.36, 1];

const VARIANTS = {
  up:   { hidden: { opacity: 0, y: 50, filter: 'blur(6px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)' } },
  left: { hidden: { opacity: 0, x: -60 },                     show: { opacity: 1, x: 0 } },
  scale:{ hidden: { opacity: 0, scale: .9, y: 30 },           show: { opacity: 1, scale: 1, y: 0 } },
};

/* Drop-in animated wrapper. `as` lets it become any tag; `i` adds stagger delay.
   forwardRef so callers (e.g. tilt cards) can grab the underlying element. */
const Reveal = forwardRef(function Reveal(
  { as = 'div', variant = 'up', i = 0, delay = 0, amount = 0.25, className, children, ...rest },
  ref
) {
  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag ref={ref} className={className} {...rest}>{children}</Tag>;
  }
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={VARIANTS[variant]}
      transition={{ duration: 1, ease: EASE, delay: delay + i * 0.09 }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
});

export default Reveal;
