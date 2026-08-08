// src/pages/BMI.jsx
//
// BMI Calculator page (suggested route: /bmi -- NOT wired into router.jsx
// or AppDrawer.jsx yet, since this wasn't one of the original 11 routes;
// add both once you confirm where this should live in nav).
//
// COLOR SYSTEM NOTE: the reference images use a 6-hue gradient (blue,
// green, orange, red-orange, red, dark red) for the BMI categories. That
// breaks NutriSense's strict 4-color rule (Verdigris/Shadow/Dandelion/Ecru
// White), so categories are mapped onto the existing 3 semantic tones
// instead, same pattern as MedicalRiskBadge:
//   Underweight   -> Dandelion (caution)
//   Normal Weight -> Verdigris (safe)
//   Overweight    -> Dandelion (caution)
//   Obesity I     -> Shadow, thin border
//   Obesity II    -> Shadow, 2px border
//   Obesity III   -> Shadow, 2px border + bold Expanded One label (highest
//                    severity treatment, matching the one exception already
//                    carved out for MedicalRiskBadge)
// Say the word if you'd rather break the 4-color rule for this page
// specifically and use the original gradient.
//
// FIELDS: age/weight/height/gender are calculator-only state here, NOT
// persisted to Firestore -- Profile.jsx already owns the persisted
// height/weight/age/gender fields. This page could optionally pre-fill
// from getUserProfile() if you want it to default to the user's saved
// stats; not wired that way yet, flag if you want that added.

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Drawer,
  Button,
  useMediaQuery,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  Plus,
  Minus,
  FileSpreadsheet,
  X,
  TrendingDown,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

import PageCard from '../components/PageCard';
import { fadeUp, staggerContainer } from '../motion/variants';

// --- BMI category logic -----------------------------------------------

const CATEGORIES = [
  {
    key: 'underweight',
    label: 'Underweight',
    range: 'Under 18.5',
    min: -Infinity,
    max: 18.5,
    tone: 'accent',
    icon: TrendingDown,
    description: 'Your BMI suggests you may be underweight. Consider adding nutrient-dense meals and speaking with a professional about a healthy weight-gain plan.',
  },
  {
    key: 'normal',
    label: 'Normal Weight',
    range: '18.5 – 24.9',
    min: 18.5,
    max: 24.9,
    tone: 'primary',
    icon: CheckCircle2,
    description: "You're in the healthy weight range for your height. Keep up balanced meals and regular activity to maintain it.",
  },
  {
    key: 'overweight',
    label: 'Overweight',
    range: '25.0 – 29.9',
    min: 25.0,
    max: 29.9,
    tone: 'accent',
    icon: TrendingUp,
    description: 'Your BMI is above the typical range. Small, sustainable changes to diet and activity can help bring it back down over time.',
  },
  {
    key: 'obese1',
    label: 'Obesity (Class I)',
    range: '30.0 – 34.9',
    min: 30.0,
    max: 34.9,
    tone: 'secondary',
    borderWeight: 1,
    icon: AlertTriangle,
    description: 'This range is associated with higher health risk. A conversation with a healthcare provider about a personalized plan is worth having.',
  },
  {
    key: 'obese2',
    label: 'Obesity (Class II)',
    range: '35.0 – 39.9',
    min: 35.0,
    max: 39.9,
    tone: 'third',
    borderWeight: 2,
    icon: AlertTriangle,
    description: 'This range carries a notably higher health risk. Professional guidance is strongly recommended for a safe, sustainable path forward.',
  },
  {
    key: 'obese3',
    label: 'Obesity (Class III)',
    range: '40.0+',
    min: 40.0,
    max: Infinity,
    tone: 'fourth',
    borderWeight: 2,
    bold: true,
    icon: AlertTriangle,
    description: 'This range carries the highest health risk category. Please consult a healthcare professional for personalized support.',
  },
];

function getCategory(bmi) {
  return CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) || CATEGORIES[CATEGORIES.length - 1];
}

function toneColor(tone, variant = 'main') {
  const map = {
    primary: variant === 'main' ? '#C1F40B' : '#597005',
    secondary: variant === 'main' ? '#7C9C07' : '#597005',
    accent: variant === 'main' ? '#9EC809' : '#9EC809',
    third: variant === 'main' ? '#597005' : '#7C9C07',
    fourth: variant === 'main' ? '#364403' : '#C1F40B',
  };
  return map[tone];
}

// --- Small building blocks ----------------------------------------------

function NumberStepper({ label, value, onChange, min = 0, max = 200, step = 1 }) {
  const MotionIconButton = motion.create(IconButton);
  return (
    <PageCard sx={{ p: 2.5, flex: 1, textAlign: 'center' }}>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h2" sx={{ fontSize: '2.25rem', mb: 1.5 }}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <MotionIconButton
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => onChange(Math.max(min, value - step))}
          sx={{ bgcolor: 'background.default', color: 'text.primary' }}
        >
          <Minus size={18} />
        </MotionIconButton>
        <MotionIconButton
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => onChange(Math.min(max, value + step))}
          sx={{ bgcolor: 'primary.main', color: '#F0EADC' }}
        >
          <Plus size={18} />
        </MotionIconButton>
      </Box>
    </PageCard>
  );
}

function GenderToggle({ value, onChange }) {
  return (
    <PageCard sx={{ p: 2.5 }}>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
        Gender
      </Typography>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          borderRadius: '14px',
          bgcolor: 'background.default',
          p: 0.5,
        }}
      >
        {['Male', 'Female'].map((g) => (
          <Box
            key={g}
            onClick={() => onChange(g)}
            sx={{
              position: 'relative',
              flex: 1,
              textAlign: 'center',
              py: 1,
              borderRadius: '11px',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            {value === g && (
              <motion.div
                layoutId="genderIndicator"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 11,
                  background: '#637239',
                  zIndex: -1,
                }}
              />
            )}
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: value === g ? '#F0EADC' : 'text.primary',
                position: 'relative',
              }}
            >
              {g}
            </Typography>
          </Box>
        ))}
      </Box>
    </PageCard>
  );
}

function CountUpNumber({ value, decimals = 1 }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState('0.0');

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

// --- Main page ------------------------------------------------------------

export default function BMI() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [gender, setGender] = useState('Male');

  const [result, setResult] = useState(null); // { bmi, category, age, weight, height, gender }
  const [badgeReady, setBadgeReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const badgeTimer = useRef(null);

  const handleCalculate = () => {
    const bmi = weight / (height / 100) ** 2;
    const category = getCategory(bmi);
    setBadgeReady(false);
    setResult({ bmi, category, age, weight, height, gender });
    clearTimeout(badgeTimer.current);
    badgeTimer.current = setTimeout(() => setBadgeReady(true), 950); // after count-up finishes
  };

  useEffect(() => () => clearTimeout(badgeTimer.current), []);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', py: { xs: 3, md: 5 }, px: 2, position: 'relative' }}>
      {/* Reference chart trigger, top-right */}
      <IconButton
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'absolute',
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 32 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: alpha('#3F4728', 0.1),
          '&:hover': { bgcolor: alpha('#637239', 0.08) },
        }}
      >
        <FileSpreadsheet size={20} color="#3F4728" />
      </IconButton>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: 3,
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          {/* Calculator card -- animates position via layout when result mounts */}
          <motion.div layout transition={{ type: 'spring', stiffness: 260, damping: 28 }} style={{ flex: '1 1 380px', maxWidth: 420 }}>
            <PageCard sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ textAlign: 'center', mb: 2.5, fontSize: '1.5rem' }}>
                BMI Calculator
              </Typography>

              <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <motion.div variants={fadeUp}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <NumberStepper label="Age" value={age} onChange={setAge} min={1} max={120} />
                      <NumberStepper label="Weight (kg)" value={weight} onChange={setWeight} min={20} max={300} />
                    </Box>
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <PageCard sx={{ p: 2.5 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Height (cm)
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '2.25rem', textAlign: 'center', my: 1 }}>
                        {height}
                      </Typography>
                      <Slider
                        value={height}
                        onChange={(_, v) => setHeight(v)}
                        min={50}
                        max={300}
                        sx={{
                          color: 'primary.main',
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20,
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: '0 0 0 8px rgba(99, 114, 57, 0.16)',
                            },
                          },
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>50 cm</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>300 cm</Typography>
                      </Box>
                    </PageCard>
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <GenderToggle value={gender} onChange={setGender} />
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <motion.button
                      onClick={handleCalculate}
                      whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(99, 114, 57, 0.28)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                      style={{
                        width: '100%',
                        padding: '14px 0',
                        borderRadius: 16,
                        border: '1.5px solid #161714',
                        background: '#ffcd28',
                        color: '#040404',
                        fontSize: 16,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      Calculate BMI
                    </motion.button>
                  </motion.div>
                </Box>
              </motion.div>
            </PageCard>
          </motion.div>

          {/* Result card */}
          <AnimatePresence mode="popLayout">
            {result && (
              <motion.div
                key="result"
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                style={{ flex: '1 1 380px', maxWidth: 420 }}
              >
                <PageCard sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 2 }}>
                    Body Mass Index
                  </Typography>

                  <Typography variant="h1" sx={{ fontSize: '3.5rem', color: 'primary.dark', lineHeight: 1 }}>
                    <CountUpNumber value={result.bmi} />
                  </Typography>

                  <Box sx={{ minHeight: 40, display: 'flex', justifyContent: 'center', mt: 1.5, mb: 2 }}>
                    <AnimatePresence>
                      {badgeReady && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        >
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 2,
                              py: 0.75,
                              borderRadius: '999px',
                              bgcolor: alpha(toneColor(result.category.tone), result.category.tone === 'secondary' ? 0.12 : 0.18),
                              border: result.category.borderWeight ? `${result.category.borderWeight}px solid` : 'none',
                              borderColor: toneColor(result.category.tone),
                            }}
                          >
                            <result.category.icon
                              size={result.category.borderWeight === 2 ? 22 : 18}
                              color={toneColor(result.category.tone)}
                              fill={result.category.tone === 'secondary' ? toneColor(result.category.tone) : 'none'}
                              stroke={result.category.tone === 'secondary' ? '#F0EADC' : toneColor(result.category.tone)}
                            />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 700,
                                color: result.category.tone === 'accent' ? '#3F4728' : toneColor(result.category.tone, 'dark'),
                                fontFamily: result.category.bold
                                  ? '"Special Gothic Expanded One", sans-serif'
                                  : 'inherit',
                              }}
                            >
                              {result.category.label}
                            </Typography>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>

                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2.5 }}>
                    {result.category.description}
                  </Typography>

                  <PageCard sx={{ p: 2, bgcolor: 'background.default', mb: 2.5, textAlign: 'left' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                      <SummaryRow label="Age" value={result.age} />
                      <SummaryRow label="Height" value={`${result.height} cm`} />
                      <SummaryRow label="Weight" value={`${result.weight} kg`} />
                      <SummaryRow label="Gender" value={result.gender} />
                    </Box>
                  </PageCard>

                  <Button
                    onClick={handleCalculate}
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderRadius: '14px',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      textTransform: 'none',
                      py: 1.2,
                    }}
                  >
                    Recalculate
                  </Button>
                </PageCard>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>

      <BMIReferenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentCategoryKey={result?.category.key}
      />
    </Box>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

function BMIReferenceDrawer({ open, onClose, currentCategoryKey }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          // A4 portrait proportion (1 : 1.414), capped so it never
          // overflows the viewport width on smaller screens.
          width: { xs: '100%', sm: 'min(90vw, 640px)' },
          bgcolor: 'background.paper',
          overflowX: 'visible', // don't clip the rounded card corners below
        },
      }}
    >
      {/* Padding lives on this inner Box, not PaperProps -- Drawer's own
          scroll container can otherwise swallow padding set directly on
          the Paper root, which is what was causing cards to sit flush
          against the drawer edge with their rounded corner clipped. */}
      <Box sx={{ p: { xs: 3, sm: 5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h3" sx={{ fontSize: '1.4rem' }}>
            BMI Ranges
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} color="#3F4728" />
          </IconButton>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          What your number actually means.
        </Typography>

        <motion.div
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate={open ? 'visible' : 'hidden'}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {CATEGORIES.map((cat) => {
            const isCurrent = cat.key === currentCategoryKey;
            const Icon = cat.icon;
            // Rough fill % for the progress bar, scaled within a 0-45 display range
            const fillPct = Math.min(100, (Math.min(cat.max === Infinity ? 45 : cat.max, 45) / 45) * 100);
            return (
              <motion.div key={cat.key} variants={fadeUp} whileHover={{ y: -2 }}>
                <PageCard
                  sx={{
                    p: 2.5,
                    bgcolor: 'background.default',
                    borderLeft: '4px solid',
                    borderLeftColor: toneColor(cat.tone),
                    ...(isCurrent && {
                      boxShadow: `0 0 0 2px ${toneColor(cat.tone)}`,
                    }),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Icon size={16} color={toneColor(cat.tone)} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {cat.label}
                    </Typography>
                    {isCurrent && (
                      <Typography variant="caption" sx={{ color: toneColor(cat.tone, 'dark'), ml: 'auto', fontWeight: 600 }}>
                        You are here
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {cat.range}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5, mb: 1.5 }}>
                    {cat.description}
                  </Typography>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'background.paper', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ height: '100%', background: toneColor(cat.tone) }}
                    />
                  </Box>
                </PageCard>
              </motion.div>
            );
          })}
        </motion.div>
      </Box>
    </Drawer>
  );
}
