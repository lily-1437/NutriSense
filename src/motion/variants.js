// src/motion/variants.js
// Shared Framer Motion variant/transition definitions.
// Every animated component imports from here rather than inlining transition
// objects, so the whole app reads as one coherent motion system (roadmap §7.1).

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export const buttonTap = { scale: 0.96 };
export const buttonHover = { scale: 1.03 };

// Card shape-morph (compact/icon-driven cards only — UI guide §0.4 / roadmap §7.6)
export const cardMorphHover = {
  borderRadius: '50%',
  scale: 0.96,
};
export const cardMorphTransition = { type: 'spring', stiffness: 260, damping: 20 };

// Text-heavy / list-style cards — lift only, no shape morph
export const cardLiftHover = { y: -4 };
export const cardLiftTransition = { type: 'spring', stiffness: 300, damping: 24 };

// Risk badge one-shot pulse (§0.5 / §7.7) — fire via a `key` change, repeat: 0
export const riskPulse = {
  animate: { opacity: [1, 0.6, 1] },
  transition: { duration: 0.6, times: [0, 0.5, 1], repeat: 0 },
};
