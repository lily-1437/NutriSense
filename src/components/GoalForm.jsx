// src/components/GoalForm.jsx
// Two-step flow:
//   1. "describe" — user types a free-text goal, we call inferGoalFromText()
//   2. "review"   — inferred targets shown as editable fields + rationale;
//                   user must press "Save Goal" to actually persist anything.
// inferGoalFromText() never writes to Firestore itself — this component is
// the only place createGoal() gets called, and only after explicit confirm.

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Button, Box, Typography, Alert, CircularProgress,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { createGoal } from '../logic/firestoreGoals';
import { inferGoalFromText } from '../logic/goalInference';

const emptyTargets = {
  targetCalories: '', targetProtein: '', targetFat: '', targetCarbs: '', timeframe: 'weekly',
};

export default function GoalForm({ open, onClose, onSaved }) {
  const { user } = useAuth();
  const [stage, setStage] = useState('describe'); // 'describe' | 'review'
  const [goalText, setGoalText] = useState('');
  const [conditions, setConditions] = useState([]);
  const [targets, setTargets] = useState(emptyTargets);
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState('');
  const [inferring, setInferring] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state each time the dialog opens, and load the user's saved conditions
  useEffect(() => {
    if (!open || !user) return;
    setStage('describe');
    setGoalText('');
    setTargets(emptyTargets);
    setRationale('');
    setError('');

    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      setConditions(snap.exists() ? snap.data().conditions || [] : []);
    })();
  }, [open, user]);

  const handleSuggest = async () => {
    setError('');
    setInferring(true);
    const result = await inferGoalFromText(goalText, conditions);
    setInferring(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setTargets({
      targetCalories: result.targetCalories,
      targetProtein: result.targetProtein,
      targetFat: result.targetFat,
      targetCarbs: result.targetCarbs,
      timeframe: result.timeframe,
    });
    setRationale(result.rationale);
    setStage('review');
  };

  const handleFieldChange = (field) => (e) => setTargets({ ...targets, [field]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    await createGoal(user.uid, {
      targetCalories: Number(targets.targetCalories),
      targetProtein: Number(targets.targetProtein),
      targetFat: Number(targets.targetFat),
      targetCarbs: Number(targets.targetCarbs),
      timeframe: targets.timeframe,
      sourceText: goalText,
      rationale,
      conditionsConsidered: conditions,
    });
    setSaving(false);
    onSaved?.();
    onClose();
  };

  const handleBack = () => setStage('describe');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif' }}>
        {stage === 'describe' ? 'New Goal' : 'Review your goal'}
      </DialogTitle>

      {stage === 'describe' && (
        <>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Describe your goal in your own words — for example, "I want to lose 2kg" or
              "help me eat better for my condition."
            </Typography>
            <TextField
              multiline
              minRows={3}
              placeholder="I want to lose 2kg over the next month"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
            />
            {conditions.length > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Your saved conditions ({conditions.join(', ')}) will be factored in.
              </Typography>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSuggest}
              disabled={inferring || !goalText.trim()}
              sx={{ bgcolor: 'primary.main' }}
            >
              {inferring ? <CircularProgress size={18} sx={{ color: '#F0EADC' }} /> : 'Suggest goal'}
            </Button>
          </DialogActions>
        </>
      )}

      {stage === 'review' && (
        <>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {rationale && (
              <Box sx={{ bgcolor: 'background.default', borderRadius: '12px', p: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>{rationale}</Typography>
              </Box>
            )}
            <TextField
              label="Target Calories"
              type="number"
              value={targets.targetCalories}
              onChange={handleFieldChange('targetCalories')}
            />
            <TextField
              label="Target Protein (g)"
              type="number"
              value={targets.targetProtein}
              onChange={handleFieldChange('targetProtein')}
            />
            <TextField
              label="Target Fat (g)"
              type="number"
              value={targets.targetFat}
              onChange={handleFieldChange('targetFat')}
            />
            <TextField
              label="Target Carbs (g)"
              type="number"
              value={targets.targetCarbs}
              onChange={handleFieldChange('targetCarbs')}
            />
            <TextField select label="Timeframe" value={targets.timeframe} onChange={handleFieldChange('timeframe')}>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBack}>Back</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ bgcolor: 'primary.main' }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: '#F0EADC' }} /> : 'Save Goal'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
