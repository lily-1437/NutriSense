import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * SplitFeatureSection — floating card shell (image overlaps card, no button).
 * reverse=false: image left, content right (odd cards: 1st, 3rd, 5th...)
 * reverse=true:  image right, content left (even cards: 2nd, 4th, 6th...)
 */
export default function SplitFeatureSection({ image, heading, body, reverse = false, bgColor = '#DDEB8C' }) {
  return (
    <Box sx={{ bgcolor: bgColor, py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14, mass: 0.7 }}
          whileHover={{ y: -6, scale: 1.025 }}
          style={{ willChange: 'transform' }}
        >
          <Box
            sx={{
              minHeight: { xs: 260, md: 300 },
              position: 'relative',
              display: 'flex',
              flexDirection: { xs: 'column', md: reverse ? 'row-reverse' : 'row' },
              alignItems: 'center',
              bgcolor: 'bgColor',
              border: '1.5px solid',
              borderColor: 'rgba(78, 41, 37, 0.96)',
              borderRadius: '22px',
              px: { xs: 3, md: 6 },
              py: { xs: 4, md: 5 },
              mx: { xs: 1, sm: 3, md: 4 },
              gap: { xs: 4, md: 6 },
            }}
          >
            {/* Overlapping image placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: 'spring', stiffness: 140, damping: 15, delay: 0.1 }}
              whileHover={{ y: -4, x: reverse ? 4 : -4 }}
              style={{
                flexShrink: 0,
                marginTop: 0,
                marginBottom: 0,
                zIndex: 2,
                willChange: 'transform',
              }}
            >
              <Box
                sx={{
                  width: { xs: 180, sm: 220, md: 270 },
                  height: { xs: 150, sm: 180, md: 210 },
                  borderRadius: '20px',
                  bgcolor: '#F4F4EC',
                  boxShadow: '0 12px 28px rgba(62, 74, 31, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8a8a7a',
                  fontSize: 14,
                  mt: { md: reverse ? '-56px' : '-56px' },
                  mb: { md: reverse ? '-56px' : '-56px' },
                  ml: { md: reverse ? 0 : '-56px' },
                  mr: { md: reverse ? '-56px' : 0 },
                }}
              >
                {image ?? 'Image placeholder'}
              </Box>
            </motion.div>

            {/* Content */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h3"
                sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: '#3E4A1F', fontSize: 34, mb: 2 }}
              >
                {heading}
              </Typography>
              <Typography sx={{ fontFamily: '"Kameron", serif', color: '#4A4530', fontSize: 20, lineHeight: 1.7 }}>
                {body}
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
