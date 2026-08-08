// src/components/RateUsDialog.jsx
//
// "Rate and Review" card — triggered from AppDrawer's Rate Us item.
// Built as a custom floating bottom-sheet (not MUI Dialog) so it can slide
// up from the bottom edge like a toast/sheet rather than grow from center,
// per the design brief. Motion is Framer Motion end-to-end here — this is
// a deliberate, scoped exception to the "Dialog stays MUI-native" rule in
// §0.6 of the UI guide, since the brief specifically calls for a bottom-
// sheet entrance MUI's Grow can't produce.
//
// Design system tokens pulled from theme.js: primary.main (Verdigris) for
// the active star fill, accent.main (#ffcd28 Dandelion) for the Post CTA
// per the brief, background.paper card surface, borderRadius 25, and
// Special Gothic / Special Gothic Expanded One typography — no new fonts.

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Star, X } from 'lucide-react';

const MotionCard = motion.create(Box);
const MotionBackdrop = motion.create(Box);
const MotionStar = motion.create('button');

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function RateUsDialog({ open, onClose, onSubmit }) {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [focused, setFocused] = useState(false);

  // Reset to a clean slate each time the sheet is reopened.
  useEffect(() => {
    if (open) {
      setRating(0);
      setHovered(0);
      setReview('');
    }
  }, [open]);

  const displayRating = hovered || rating;

  const handlePost = () => {
    onSubmit?.({ rating, review });
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dims the app but keeps it visible for context */}
          <MotionBackdrop
            key="rateus-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: alpha('#3F4728', 0.4),
              zIndex: theme.zIndex.modal,
            }}
          />

          {/* Bottom-sheet wrapper — centers the card near lower-center */}
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: theme.zIndex.modal + 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pointerEvents: 'none',
              px: 2,
              pb: { xs: 3, sm: 6 },
            }}
          >
            <MotionCard
              key="rateus-card"
              role="dialog"
              aria-modal="true"
              aria-label="Rate and review"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%', opacity: 0, scale: 0.96 }}
              animate={{
                y: [0, -6, 0], // small settle-lift once it arrives
                opacity: 1,
                scale: 1,
              }}
              exit={{ y: '100%', opacity: 0, scale: 0.96 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 26,
                y: { duration: 0.45, times: [0, 0.7, 1], ease: [0.22, 1, 0.36, 1] },
              }}
              sx={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: 420,
                bgcolor: 'background.paper',
                borderRadius: '25px',
                border: '1px solid',
                borderColor: alpha('#3F4728', 0.08),
                boxShadow: '0 20px 45px rgba(63,71,40,0.22)',
                p: { xs: 2.75, sm: 3.5 },
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  mb: 2.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Special Gothic Expanded One", sans-serif',
                    fontSize: { xs: 19, sm: 21 },
                    color: 'text.primary',
                  }}
                >
                  Rate and review
                </Typography>
                <IconButton
                  size="small"
                  onClick={onClose}
                  aria-label="Close"
                  sx={{
                    color: 'text.secondary',
                    mt: -0.5,
                    mr: -0.5,
                    '&:hover': { bgcolor: alpha('#3d4728', 0.06) },
                  }}
                >
                  <X size={18} />
                </IconButton>
              </Box>

              {/* Rating */}
              <Typography
                sx={{
                  fontFamily: '"Kameron", serif',
                  fontSize: 13,
                  color: 'text.secondary',
                  mb: 1,
                }}
              >
                Rating{rating > 0 ? ` (${rating}/5 · ${RATING_LABELS[rating]})` : ''}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const active = i <= displayRating;
                  return (
                    <MotionStar
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(0)}
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.92 }}
                      animate={{ scale: active ? 1.05 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        lineHeight: 0,
                      }}
                      aria-label={`${i} star${i > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={30}
                        strokeWidth={1.5}
                        fill={active ? '#9fe408'  : alpha(theme.palette.primary.main, 0.15)}
                        color={active ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.35)}
                        style={{ transition: 'fill 180ms ease, color 180ms ease' }}
                      />
                    </MotionStar>
                  );
                })}
              </Box>

              {/* Review text area */}
              <Typography
                sx={{
                  fontFamily: '"Kameron", serif',
                  fontSize: 13,
                  color: 'text.secondary',
                  mb: 1,
                }}
              >
                Review
              </Typography>

              <motion.div
                animate={{
                  boxShadow: focused
                    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`
                    : '0 0 0 0px rgba(0,0,0,0)',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ borderRadius: 14 }}
              >
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="Tell us what you think..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      fontFamily: '"Kameron", serif',
                      fontSize: 14.5,
                      bgcolor: 'background.default',
                      transition: 'border-color 180ms ease',
                      '& fieldset': {
                        borderColor: alpha('#3F4728', 0.12),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: '1.5px',
                      },
                    },
                  }}
                />
              </motion.div>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{
                    flex: '0 0 auto',
                    padding: '10px 22px',
                    borderRadius: 15,
                    border: `1.5px solid ${alpha('#3F4728', 0.15)}`,
                    background: 'transparent',
                    color: theme.palette.text.secondary,
                    fontFamily: '"Kameron", serif',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  onClick={handlePost}
                  disabled={rating === 0}
                  whileHover={rating > 0 ? { scale: 1.03 } : {}}
                  whileTap={rating > 0 ? { scale: 0.96 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 22px',
                    borderRadius: 15,
                    border: '1.5px solid #2a2f1b',
                    background: rating > 0 ? '#ffcd28' : alpha('#ffcd28', 0.45),
                    color: '#3F4728',
                    fontFamily: 'kameron, serif',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: rating > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save
                </motion.button>
              </Box>
            </MotionCard>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
}
