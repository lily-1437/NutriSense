// src/components/GoProModal.jsx
//
// Subscription overlay triggered by the "Go Pro" navbar action. Renders a
// dimmed backdrop + a centered card that enters with a y + opacity motion
// (no scale, anywhere — per the brief, all interaction feedback below uses
// shadow/color/position only).
//
// USAGE (wire into AppNavbar.jsx):
//   const [goProOpen, setGoProOpen] = useState(false);
//   ...
//   <Button onClick={() => setGoProOpen(true)}>Go Pro</Button>
//   <GoProModal open={goProOpen} onClose={() => setGoProOpen(false)} />
//
// The four Pro-tier accent hexes below are specific to this feature (not
// added to the shared theme) — everything else (card background, borders,
// text colors) pulls from the existing theme tokens, same as the rest of
// the app, so this reads as a distinct "Pro" moment within the existing
// system rather than a second visual language.

import { AnimatePresence, motion } from 'framer-motion';
import { Box, Typography, IconButton } from '@mui/material';
import { X, Check } from 'lucide-react';

const PRO_ACCENT = {
  lime: '#BEF527',
  blue: '#1698F0',
  skyBlue: '#6FC3F7',
  paleLime: '#E8FF94',
};

const BENEFITS = ['Unlimited Recipe Paste', 'Unlimited Meal Generate', 'Get Task Reminder'];

const CARD_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export default function GoProModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — de-emphasizes the rest of the app without hiding it */}
          <Box
            component={motion.div}
            key="go-pro-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              bgcolor: 'rgba(20, 22, 14, 0.55)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Centering layer — pointerEvents none so only the card itself is clickable, letting backdrop clicks through everywhere else */}
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 1301,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              pointerEvents: 'none',
            }}
          >
            <Box
              component={motion.div}
              key="go-pro-card"
              role="dialog"
              aria-modal="true"
              aria-label="Go Pro subscription"
              initial={{ y: 64, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={CARD_TRANSITION}
              onClick={(e) => e.stopPropagation()}
              sx={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: 400,
                borderRadius: '24px',
                bgcolor: 'background.paper',
                border: '1px solid rgba(63,71,40,0.10)',
                boxShadow: '0 24px 60px rgba(20,22,14,0.22)',
                overflow: 'hidden',
              }}
            >
              {/* Header — price + description on the accent wash */}
              <Box
                sx={{
                  position: 'relative',
                  px: { xs: 2.75, sm: 3.5 },
                  pt: 3.5,
                  pb: 3,
                  background: `linear-gradient(135deg, ${PRO_ACCENT.paleLime} 0%, ${PRO_ACCENT.skyBlue} 100%)`,
                }}
              >
                <IconButton
                  onClick={onClose}
                  size="small"
                  aria-label="Close"
                  sx={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    bgcolor: 'rgba(255,255,255,0.55)',
                    transition: 'background-color 160ms ease',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
                  }}
                >
                  <X size={16} color="#1D2612" />
                </IconButton>

                <Typography
                  sx={{
                    fontFamily: '"Special Gothic Expanded One", sans-serif',
                    fontSize: 22,
                    color: '#1D2612',
                  }}
                >
                  Go Pro
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 1.5 }}>
                  <Typography sx={{ fontSize: 40, fontWeight: 800, color: PRO_ACCENT.blue, lineHeight: 1 }}>
                    $1
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'rgba(29,38,18,0.65)' }}>
                    /monthly
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 13, color: 'rgba(29,38,18,0.75)', mt: 1, lineHeight: 1.5 }}>
                  Go Pro unlocks additional NutriSense capabilities — more recipe analysis, richer
                  meal planning, and reminders that keep you on track.
                </Typography>
              </Box>

              {/* Body — upgrade action + benefits list */}
              <Box sx={{ px: { xs: 2.75, sm: 3.5 }, pt: 3, pb: 3.5 }}>
                <Box
                  component="button"
                  sx={{
                    width: '100%',
                    py: 1.5,
                    border: 'none',
                    borderRadius: '14px',
                    bgcolor: 'background.paper',
                    color: PRO_ACCENT.blue,
                    fontFamily: 'inherit',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    // Neomorphism — the ONLY element in this card using this
                    // effect, per the brief. Soft raised look from a light
                    // shadow (top-left) paired with a darker one (bottom-right).
                    // Hover/active only ever adjust shadow depth or invert to
                    // a pressed/inset look — no scale, no size change.
                    boxShadow:
                      '6px 6px 14px rgba(22,152,240,0.16), -6px -6px 14px rgba(255,255,255,0.9)',
                    transition: 'box-shadow 200ms ease, color 200ms ease',
                    '&:hover': {
                      boxShadow:
                        '3px 3px 8px rgba(22,152,240,0.18), -3px -3px 8px rgba(255,255,255,0.85)',
                    },
                    '&:active': {
                      boxShadow:
                        'inset 4px 4px 10px rgba(22,152,240,0.18), inset -4px -4px 10px rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  Upgrade to Go
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>
                  {BENEFITS.map((label) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(190,245,39,0.22)', // PRO_ACCENT.lime, low-opacity wash
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} color="#5C8A00" strokeWidth={3} />
                      </Box>
                      <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 500 }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
}
