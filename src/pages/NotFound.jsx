// src/pages/NotFound.jsx
// 404 catch-all page. Two-column split (illustration + message) on desktop,
// stacks on mobile, per the reference layout — but built entirely from
// existing tokens: Verdigris/Shadow/Dandelion/Ecru palette, Special Gothic
// Expanded One display type, 25px radius, and the shared fadeUp/scaleIn
// variants from src/motion/variants.js. No new colors or motion primitives.

import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { scaleIn, fadeUp, staggerContainer } from '../motion/variants';

const MotionBox = motion.create(Box);
const MotionButton = motion.button;

// Reusable illustration placeholder — swap `src` for an actual SVG/PNG/Lottie
// later without touching layout. Built as its own component so NotFound and
// any future empty/error states can share it.
function ErrorIllustration({ src }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: '100%', maxWidth: 280, display: 'flex', justifyContent: 'center' }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: 'auto' }} />
      ) : (
        <svg viewBox="0 0 200 200" width="220" height="220" role="img" aria-label="Broken plate illustration">
          <circle cx="100" cy="100" r="90" fill="#F0EADC" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="#8D844D" strokeWidth="3" strokeDasharray="6 6" />
          <path
            d="M70 70 L95 100 L72 118 M128 72 L104 102 L130 122"
            stroke="#576238"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="100" cy="140" r="6" fill="#FFD95E" />
        </svg>
      )}
    </motion.div>
  );
}

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <MotionBox
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        sx={{
          width: '100%',
          maxWidth: 900,
          bgcolor: 'background.paper',
          borderRadius: '25px',
          boxShadow: '0 20px 60px rgba(63, 71, 40, 0.15)',
          p: { xs: 4, md: 6 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 4, md: 6 },
        }}
      >
        {/* Left — illustration */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ErrorIllustration />
        </Box>

        {/* Right — message */}
        <motion.div
          variants={staggerContainer(0.08, 0.15)}
          initial="hidden"
          animate="visible"
          style={{ flex: 1, width: '100%' }}
        >
          <motion.div variants={fadeUp}>
            <Typography
              sx={{
                fontFamily: '"Special Gothic Expanded One", sans-serif',
                fontSize: { xs: '3.5rem', md: '5rem' },
                lineHeight: 1,
                color: 'primary.main',
                mb: 1,
              }}
            >
              404
            </Typography>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Special Gothic Expanded One", sans-serif',
                fontSize: { xs: '1.4rem', md: '1.75rem' },
                color: 'text.primary',
                mb: 1,
              }}
            >
              Looks like you're lost
            </Typography>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 380 }}>
              The page you're looking for doesn't exist, may have moved, or the URL isn't quite right.
            </Typography>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <MotionButton
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={() => navigate('/')}
                style={{
                  background: '#576238',
                  color: '#F0EADC',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '12px 26px',
                  fontFamily: '"Kameron", serif',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Go to Home
                <motion.span
                  style={{ display: 'flex' }}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <ArrowRight size={18} />
                </motion.span>
              </MotionButton>

            </Box>
          </motion.div>
        </motion.div>
      </MotionBox>
    </Box>
  );
}
