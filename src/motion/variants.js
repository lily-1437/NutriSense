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

// Goal card completion — slide right, scale down, fade (Health Goals redesign).
// Used with AnimatePresence when a goal is marked complete/undone.
export const goalCompleteExit = {
  opacity: 0,
  scale: 0.92,
  x: 60,
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};
export const goalUndoEnter = {
  hidden: { opacity: 0, scale: 0.92, x: 60 },
  visible: {
    opacity: 1, scale: 1, x: 0,
    transition: { type: 'spring', stiffness: 280, damping: 26 },
  },
};

// Workflow-card collapse (State 1/2 form card gracefully folding away
// before the active-goals dashboard expands into place).
export const cardCollapse = {
  hidden: { opacity: 1, scaleY: 1, height: 'auto' },
  visible: { opacity: 1, scaleY: 1, height: 'auto' },
  exit: {
    opacity: 0, scaleY: 0.8, height: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// AI recommendation section sliding/fading in below the description field
export const aiSectionReveal = {
  hidden: { opacity: 0, y: 16, height: 0 },
  visible: {
    opacity: 1, y: 0, height: 'auto',
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};
