// src/components/ConditionSelector.jsx
//
// Shared multi-select for health conditions, used in both HealthGoals.jsx
// and Profile.jsx (same component, two entry points -- per the UI guide's
// "Reused across specific pages" convention).
//
// Controlled component: the parent page owns loading (getUserConditions)
// and saving (updateUserConditions) via src/logic/firestoreUser.js, so this
// component itself has no Firestore calls -- keeps it reusable and testable
// without needing auth/DB context.
//
// CONDITION_OPTIONS is exported so Increment 3's risk-flagging rules engine
// (riskFlagging.js) can key its condition -> ingredient-conflict rules off
// the exact same set of values, rather than two lists silently drifting.

import { Autocomplete, TextField, Chip, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const CONDITION_OPTIONS = [
  'Diabetes (Type 1)',
  'Diabetes (Type 2)',
  'Hypertension',
  'High Cholesterol',
  'Heart Disease',
  'Kidney Disease',
  'Celiac Disease / Gluten Intolerance',
  'Lactose Intolerance',
  'IBS',
  'Obesity / Weight Management',
  'Nut Allergy',
  'Shellfish Allergy',
  'Pregnancy',
];

export default function ConditionSelector({ value, onChange, disabled = false }) {
  const handleRemove = (condition) => {
    onChange(value.filter((c) => c !== condition));
  };

  return (
    <Box>
      <Autocomplete
        multiple
        disabled={disabled}
        options={CONDITION_OPTIONS}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        disableCloseOnSelect
        // Suppress MUI's default inline tag rendering -- chips are rendered
        // manually below via AnimatePresence so add/remove gets a real
        // fade+scale transition instead of an instant swap.
        renderTags={() => null}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Health conditions"
            placeholder={value.length ? '' : 'Search conditions…'}
            helperText="Used to flag risky ingredients and suggest safer substitutions."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
              },
            }}
          />
        )}
        sx={{ width: '100%' }}
      />

      {value.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          <AnimatePresence initial={false}>
            {value.map((condition) => (
              <motion.div
                key={condition}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <Chip
                  label={condition}
                  onDelete={disabled ? undefined : () => handleRemove(condition)}
                  deleteIcon={<X size={14} />}
                  sx={{
                    bgcolor: 'accent.main',
                    color: 'accent.contrastText',
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': {
                      color: 'accent.contrastText',
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                    },
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}
