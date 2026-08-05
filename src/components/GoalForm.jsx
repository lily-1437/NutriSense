// src/components/GoalForm.jsx
// Two-state progressive workflow (per redesign brief):
//   State 1 "create"    — Target Name, Start Date, End Date, Description.
//                          "Create" triggers AI inference, does NOT save yet.
//   State 2 "recommend" — AI-generated milestone checklist slides/fades in
//                          below the description. "Set Goal" persists +
//                          notifies the parent (which shows the toast and
//                          transitions to the Active Goals dashboard).
//
// inferGoalFromText() never writes to Firestore — createGoal() only fires
// from handleSetGoal(), after the user has seen and can edit the milestones.

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, TextField, Button, Box, Typography, Alert,
  CircularProgress, InputAdornment, Grid,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, CalendarDays, FileText, Flame, Droplet, Utensils,
  Activity, Moon, TrendingDown, Heart, Sparkles,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { createGoal } from '../logic/firestoreGoals';
import { selectGoalTemplate } from '../logic/goalTemplateSelector';
import { fadeUp, staggerContainer, aiSectionReveal, buttonHover, buttonTap } from '../motion/variants';

const MotionButton = motion(Button);

const ICONS = { Flame, Droplet, Utensils, Activity, Moon, TrendingDown, Heart };

const emptyForm = { targetName: '', startDate: '', endDate: '', description: '' };

export default function GoalForm({ open, onClose, onSetGoal }) {
  const { user } = useAuth();
  const [stage, setStage] = useState('create'); // 'create' | 'recommend'
  const [form, setForm] = useState(emptyForm);
  const [conditions, setConditions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [templateKey, setTemplateKey] = useState(null);
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState('');
  const [inferring, setInferring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setStage('create');
    setForm(emptyForm);
    setMilestones([]);
    setTemplateKey(null);
    setRationale('');
    setError('');

    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      setConditions(snap.exists() ? snap.data().conditions || [] : []);
    })();
  }, [open, user]);

  const handleField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleMilestoneValueChange = (id) => (e) => {
    const v = e.target.value;
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, value: v } : m)));
  };

  const handleCreate = async () => {
    setError('');
    if (!form.targetName.trim()) {
      setError('Give your goal a name.');
      return;
    }
    if (!form.description.trim()) {
      setError('Describe your health objective so we can suggest milestones.');
      return;
    }
    setInferring(true);
    const result = await selectGoalTemplate(form.description, conditions);
    setInferring(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMilestones(result.milestones);
    setRationale(result.rationale);
    setTemplateKey(result.templateKey);
    setStage('recommend');
  };

  const handleClear = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleSetGoal = async () => {
    setSaving(true);
    await createGoal(user.uid, {
      targetName: form.targetName,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      description: form.description,
      milestones,
      templateKey,
      rationale,
      sourceText: form.description,
      conditionsConsidered: conditions,
    });
    setSaving(false);
    onSetGoal?.(); // parent: show "Target has been set." toast + transition to dashboard
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: '25px', overflow: 'hidden' } } }}
    >
      <DialogContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: '14px', bgcolor: 'background.default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Target size={20} color="#637239" />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '1.25rem', color: 'text.primary' }}>
              {stage === 'create' ? 'New Health Goal' : form.targetName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {stage === 'create'
                ? 'Tell us what you\u2019re working toward'
                : 'Review your AI-recommended plan'}
            </Typography>
          </Box>
        </Box>

        <AnimatePresence mode="wait">
          {stage === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Target Name"
                    value={form.targetName}
                    onChange={handleField('targetName')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Target size={18} color="#6B6550" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={form.startDate}
                    onChange={handleField('startDate')}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarDays size={16} color="#6B6550" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={form.endDate}
                    onChange={handleField('endDate')}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarDays size={16} color="#6B6550" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Target Description"
                    placeholder='e.g. "I want to reduce my blood pressure by improving my eating habits over the next three months."'
                    value={form.description}
                    onChange={handleField('description')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                            <FileText size={18} color="#6B6550" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                {conditions.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Your saved conditions ({conditions.join(', ')}) will be factored into your milestones.
                    </Typography>
                  </Grid>
                )}
                {error && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  sx={{ borderRadius: '25px', borderColor: 'text.secondary', color: 'text.secondary', px: 3 }}
                >
                  Clear
                </Button>
                <MotionButton
                  variant="contained"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={handleCreate}
                  disabled={inferring}
                  sx={{ borderRadius: '25px', bgcolor: 'primary.main', px: 4, '&:hover': { bgcolor: 'secondary.main' } }}
                >
                  {inferring ? <CircularProgress size={18} sx={{ color: '#F0EADC' }} /> : 'Create'}
                </MotionButton>
              </Box>
            </motion.div>
          )}

          {stage === 'recommend' && (
            <motion.div
              key="recommend"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ bgcolor: 'background.default', borderRadius: '16px', p: 2, mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {form.description}
                </Typography>
              </Box>

              <motion.div variants={aiSectionReveal} initial="hidden" animate="visible">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, mb: 1.5 }}>
                  <Sparkles size={16} color="#ffcd28" />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Suggested milestones
                  </Typography>
                </Box>

                {rationale && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                    {rationale}
                  </Typography>
                )}

                <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {milestones.map((m) => {
                      const Icon = ICONS[m.icon] || Heart;
                      return (
                        <motion.div key={m.id} variants={fadeUp}>
                          <Box
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1.5,
                              p: 1.75, borderRadius: '16px', bgcolor: 'background.paper',
                              border: '1px solid', borderColor: 'background.default',
                            }}
                          >
                            <Box
                              sx={{
                                width: 36, height: 36, borderRadius: '12px', flexShrink: 0,
                                bgcolor: 'background.default', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Icon size={17} color="#637239" />
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {m.label}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {m.detail}
                              </Typography>
                            </Box>
                            <TextField
                              size="small"
                              type="number"
                              value={m.value}
                              onChange={handleMilestoneValueChange(m.id)}
                              slotProps={{
                                input: {
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {m.unit}
                                      </Typography>
                                    </InputAdornment>
                                  ),
                                },
                              }}
                              sx={{ width: 132, flexShrink: 0 }}
                            />
                          </Box>
                        </motion.div>
                      );
                    })}
                  </Box>
                </motion.div>
              </motion.div>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => setStage('create')}
                  sx={{ borderRadius: '25px', borderColor: 'text.secondary', color: 'text.secondary', px: 3 }}
                >
                  Back
                </Button>
                <MotionButton
                  variant="contained"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={handleSetGoal}
                  disabled={saving}
                  sx={{ borderRadius: '25px', bgcolor: 'primary.main', px: 4, '&:hover': { bgcolor: 'secondary.main' } }}
                >
                  {saving ? <CircularProgress size={18} sx={{ color: '#F0EADC' }} /> : 'Set Goal'}
                </MotionButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
