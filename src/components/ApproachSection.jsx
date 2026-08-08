import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink } from '@mui/material';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

const FOOTER_LINKS = [
  { label: 'Analyze', href: '/analyze' },
  { label: 'Meal Plans', href: '/meal-plans' },
  { label: 'Goals', href: '/goals' },
  { label: 'About', href: '/about' },
];

/**
 * Animated count-up number. Starts at 0, springs up to `value` once the
 * parent enters the viewport (controlled via the `start` prop so all three
 * stats can be triggered together).
 */
function CountUpNumber({ value, start, suffix = '+' }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 20, mass: 1 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (start) motionValue.set(value);
  }, [start, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [springValue]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * ApproachSection — merged "the nutrisense approach" content + stats
 * footer into a single continuous section.
 *
 * Structure (top to bottom, one shared background):
 *   1. Rolling-hills wave divider (unchanged shape/fill from the original
 *      ApproachSection) — this is the ONLY wave divider in this section.
 *   2. "the nutrisense approach" heading + 3 pillar icons.
 *   3. Stats block (Reviews / Recipes Analyzed / Ingredients in Database)
 *      with animated count-up, sitting on the SAME background-image layer
 *      as the approach content above — so the image is visually "cut" by
 *      the wave shape at the very top, exactly like the reference request.
 *   4. Bottom footer bar: brand, nav links, copyright.
 *
 * Pass real values via props once wired to Firestore, e.g.:
 *   <ApproachSection reviewsCount={reviews} recipesCount={recipes} ingredientsCount={ingredients} />
 */
export default function ApproachSection({
  reviewsCount = 450,
  recipesCount = 1200,
  ingredientsCount = 3800,
}) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const stats = [
    {
      value: reviewsCount,
      suffix: '+',
      label: 'Reviews',
      description: 'Real feedback from people using NutriSense to eat with more confidence every day.',
    },
    {
      value: recipesCount,
      suffix: '+',
      label: 'Recipes Analyzed',
      description: 'Recipes pasted and broken down into clear, per-serving nutritional detail.',
    },
    {
      value: ingredientsCount,
      suffix: '+',
      label: 'Ingredients in Database',
      description: 'A growing database of ingredients powering accurate, reliable nutrition analysis.',
    },
  ];

  return (
    <Box component="footer" sx={{ position: 'relative' }}>
      <Box
        ref={sectionRef}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* Background image, shared by BOTH the approach content and the
            stats below — the wave svg (drawn on top, fill matching the
            page background above) is what visually "cuts" the image into
            the rolling-hills shape at the top of the section. */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'url(../assets/footer.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Subtle dark-green overlay (existing palette) so text/stats stay readable */}
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#4a3e1f', opacity: 0.72 }} />

        {/* Rolling-hills wave divider — unchanged shape, sits above the image+overlay */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', lineHeight: 2, zIndex: 1 }}>
          <svg
            viewBox="0 0 1440 130"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 90 }}
          >
            <path
              d="
                M0,50
                C80,25 100,25 180,50
                C260,75 280,75 360,50
                C440,25 460,25 540,50
                C620,75 640,75 720,50
                C800,25 820,25 900,50
                C980,75 1000,75 1080,50
                C1160,25 1180,25 1260,50
                C1340,75 1360,75 1440,50
                L1440,-5
                L0,-5
                Z
              "
              fill="#DDEB8C"
            />
          </svg>
        </Box>

        {/* Stats block — same background-image layer as the wave above, no seam */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, pt: { xs: 12, md: 14 }, pb: { xs: 8, md: 10 } }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Grid
              container
              spacing={{ xs: 5, md: 4 }}
              wrap="nowrap"
              sx={{ flexDirection: { xs: 'column', md: 'row' }, textAlign: { xs: 'center', md: 'left' } }}
            >
              {stats.map((stat, i) => (
                <Grid item xs={12} md={4} key={stat.label} sx={{ flex: { md: 1 }, maxWidth: { md: '100%' } }}>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.6,
                      delay: 0.15 + i * 0.18,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -4, scale: 1.015 }}
                    style={{ willChange: 'transform' }}
                  >
                    <Box>
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : {}}
                        transition={{
                          duration: 0.8,
                          delay: 0.2 + i * 0.18,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: '"Special Gothic Expanded One", sans-serif',
                            color: '#F0EADC',
                            fontSize: { xs: 34, md: 40 },
                            lineHeight: 1,
                          }}
                        >
                          <CountUpNumber value={stat.value} start={isInView} suffix={stat.suffix} />
                        </Typography>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.18 }}
                        style={{
                          transformOrigin: 'left',
                          height: 1,
                          background: 'rgba(240, 234, 220, 0.35)',
                          margin: '12px 0 10px',
                        }}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.18 }}
                      >
                        <Typography
                          sx={{
                            fontFamily: '"Kameron", serif',
                            fontWeight: 700,
                            color: '#F0EADC',
                            fontSize: 15,
                            mb: 1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {stat.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: '"Kameron", serif',
                            color: '#F0EADC',
                            opacity: 0.8,
                            fontSize: 14,
                            lineHeight: 1.7,
                          }}
                        >
                          {stat.description}
                        </Typography>
                      </motion.div>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Bottom footer bar: brand, nav links, copyright — unchanged */}
      <Box sx={{ bgcolor: '#4a3e1f', color: '#F0EADC', py: 4, borderTop: '1px solid rgba(240,234,220,0.12)' }}>
        <Container
          maxWidth="md"
          sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
        >
          <Typography sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif' }}>
            NutriSense
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {FOOTER_LINKS.map((link) => (
              <MuiLink
                key={link.href}
                href={link.href}
                underline="none"
                sx={{
                  color: '#F0EADC',
                  fontFamily: '"Kameron", serif',
                  fontSize: 14,
                  opacity: 0.85,
                  '&:hover': { color: '#FFD95E' },
                }}
              >
                {link.label}
              </MuiLink>
            ))}
          </Box>
          <Typography variant="caption" sx={{ fontFamily: '"Special Gothic", sans-serif', opacity: 0.6 }}>
            © {new Date().getFullYear()} NutriSense. Academic capstone project.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
