// src/components/AuthLayout.jsx
// Shared split-card shell for Login + Signup.
// Left: reusable gradient/pattern placeholder panel (swap for a real image later
// via the `imageSrc` prop — same layout, no structural change needed).
// Right: form content, passed in as children.
//
// Built entirely from existing tokens — no new colors, radii, or fonts introduced.
// Palette: Verdigris (#576238) -> Shadow (#8D844D) diagonal gradient, Dandelion
// (#FFD95E) as a single soft accent glow (echoes ConfidenceChip/MedicalRiskBadge's
// "one warm accent against two cool tones" language elsewhere in the app).

import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { scaleIn, fadeUp, staggerContainer } from '../motion/variants';

const MotionBox = motion(Box);

export default function AuthLayout({ headline, description, title, titleLinkTo, subtitle, children, imageSrc }) {
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
          maxWidth: 960,
          bgcolor: 'background.paper',
          borderRadius: '25px',
          boxShadow: '0 20px 60px rgba(63, 71, 40, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Left — visual panel */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: { xs: 220, md: 560 },
            m: { xs: 2, md: 3 },
            mr: { md: 1.5 },
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundImage: imageSrc
              ? `url(${imageSrc})`
              : `radial-gradient(circle at 18% 15%, rgba(229, 178, 12, 0.39), transparent 45%),
         radial-gradient(circle at 82% 18%, rgba(195, 230, 90, 0.35), transparent 40%),
         radial-gradient(circle at 55% 85%, rgba(255, 215, 105, 0.34), transparent 50%),
         radial-gradient(circle at 65% 45%, rgba(120, 160, 55, 0.27), transparent 35%),
         linear-gradient(135deg, #5e7a12 0%, #394918 55%, #59501e 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* dark overlay for text readability */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(63, 71, 40, 0.25)',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Typography
              variant="h3"
              sx={{
                color: '#F0EADC',
                fontFamily: '"Special Gothic Expanded One", sans-serif',
                fontSize: { xs: '1.75rem', md: '2.1rem' },
                lineHeight: 1.15,
                mb: 1.5,
              }}
            >
              {headline}
            </Typography>
            {description && (
              <Typography
                variant="body1"
                sx={{ color: 'rgba(240, 234, 220, 0.85)', maxWidth: 320 }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right — form panel */}
        <MotionBox
          variants={staggerContainer(0.08, 0.15)}
          initial="hidden"
          animate="visible"
          sx={{
            flex: 1,
            p: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <motion.div variants={fadeUp}>
            {titleLinkTo ? (
              <Link
                component={RouterLink}
                to={titleLinkTo}
                underline="none"
                sx={{
                  display: 'inline-block',
                  fontFamily: '"Special Gothic Expanded One", sans-serif',
                  fontSize: '2.125rem', // matches Typography variant="h3" default size
                  color: 'text.primary',
                  mb: 0.5,
                  transition: 'color 200ms ease',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {title}
              </Link>
            ) : (
              <Typography
                variant="h3"
                sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: 'text.primary', mb: 0.5 }}
              >
                {title}
              </Typography>
            )}
          </motion.div>
          {subtitle && (
            <motion.div variants={fadeUp}>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                {subtitle}
              </Typography>
            </motion.div>
          )}
          {children}
        </MotionBox>
      </MotionBox>
    </Box>
  );
}
