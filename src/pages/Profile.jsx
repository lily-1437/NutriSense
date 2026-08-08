// src/pages/Profile.jsx
//
// Profile Settings page (route: /profile) -- redesigned per the
// mobile-form-inspired spec: single one-column form, Full Name / Height /
// Weight / Age / Gender (all required), optional "About Yourself", a
// Physical Activity Yes/No toggle that reveals an animated exercise-
// frequency selector, account actions (Change Password / Delete Account)
// below a divider, a big Save Changes button, and a bottom-right success
// Snackbar.
//
// DEPARTURES FROM THE PASTED SPEC (flagging explicitly, not silently
// dropping existing app functionality):
// 1. Health Conditions (ConditionSelector) is kept as its own section.
//    The spec's mockup doesn't mention it, but it's core to NutriSense's
//    condition-aware risk-flagging feature and already has a live mount
//    point here -- removing it would break that feature, not just this
//    page's design pass.
// 2. Sign Out is NOT included here (unlike an earlier draft) -- it already
//    lives in AppDrawer.jsx, so a second one here would be redundant.
// 3. Gender options follow the spec exactly: Male / Female / Prefer not to
//    say (no "Non-binary" -- that was in my earlier draft, removed now to
//    match this spec precisely). Say if you want it added back.
// 4. "Save Changes" is not fixed/sticky -- sits directly below the form,
//    which the spec allows as the small-screen fallback ("depending on
//    screen size"); can add sticky positioning on desktop if wanted.
//
// FIRESTORE: all fields below (fullName, heightCm, weightKg, age, gender,
// bio, exercisesRegularly, exerciseFrequency, conditions) now persist on
// the users/{uid} document via src/logic/firestoreUser.js.
//
// ACCOUNT DELETION: handleDeleteAccount now wipes ALL user data -- goals,
// meal plan, recipes, and the user doc itself -- via
// deleteUserAccountData(uid) (src/logic/firestoreUser.js) BEFORE deleting
// the Firebase Auth user. This replaces the previous version which only
// deleted the users/{uid} doc and left goals/mealPlans/recipes orphaned.

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  MenuItem,
  Button,
  Divider,
  Snackbar,
  Alert,
  Slide,
  Skeleton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Trash2, CheckCircle2 } from 'lucide-react';
import {
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { fadeUp, staggerContainer } from '../motion/variants';
import PageCard from '../components/PageCard';
import ConfirmDialog from '../components/ConfirmDialog';
import ConditionSelector from '../components/ConditionSelector';
import {
  getUserConditions,
  updateUserConditions,
  getUserProfile,
  updateUserProfile,
  deleteUserAccountData,
} from '../logic/firestoreUser';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];
const FREQUENCY_OPTIONS = [
  { value: '1-2', label: '1–2 days a week' },
  { value: '3-4', label: '3–4 days a week' },
  { value: '5-6', label: '5–6 days a week' },
  { value: 'daily', label: 'Daily' },
];

const EMPTY_FORM = {
  fullName: '',
  heightCm: '',
  weightKg: '',
  age: '',
  gender: '',
  bio: '',
  exercisesRegularly: false,
  exerciseFrequency: '',
};

function SlideUp(props) {
  return <Slide {...props} direction="up" />;
}

// Wraps a field so it gently scales/brightens on focus -- a real Framer
// state-driven animation (focus event -> local state -> animate), not a
// CSS pseudo-class, per the spec's "use Framer Motion for focus feedback."
function FocusField({ children }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      animate={{ scale: focused ? 1.015 : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </motion.div>
  );
}

const MotionButton = motion.create(Button);

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [conditions, setConditions] = useState([]);
  const [loadingConditions, setLoadingConditions] = useState(true);
  const [savingConditions, setSavingConditions] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadingConditions(true);
      try {
        const [profile, existingConditions] = await Promise.all([
          getUserProfile(user.uid),
          getUserConditions(user.uid),
        ]);
        if (!cancelled) {
          setForm({
            ...EMPTY_FORM,
            ...(profile || {}),
            fullName: profile?.fullName || user.displayName || '',
          });
          setConditions(existingConditions || []);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingConditions(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setField = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleActivityToggle = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      exercisesRegularly: checked,
      exerciseFrequency: checked ? prev.exerciseFrequency : '',
    }));
  };

  const handleConditionsChange = async (newConditions) => {
    setConditions(newConditions);
    setSavingConditions(true);
    try {
      await updateUserConditions(user.uid, newConditions);
    } catch (err) {
      console.error('Failed to save conditions:', err);
    } finally {
      setSavingConditions(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.heightCm) next.heightCm = 'Height is required.';
    if (!form.weightKg) next.weightKg = 'Weight is required.';
    if (!form.age) next.age = 'Age is required.';
    if (!form.gender) next.gender = 'Please select a gender.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, form);
      if (form.fullName.trim() !== (user.displayName || '')) {
        await updateProfile(auth.currentUser, { displayName: form.fullName.trim() });
      }
      setSnackbar({ open: true, severity: 'success', message: 'Successfully saved.' });
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSnackbar({ open: true, severity: 'error', message: 'Could not save changes. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSnackbar({
        open: true,
        severity: 'success',
        message: `Password reset link sent to ${user.email}.`,
      });
    } catch (err) {
      console.error('Failed to send reset email:', err);
      setSnackbar({ open: true, severity: 'error', message: 'Could not send reset email.' });
    }
  };

  // Wipes goals, meal plan, recipes, and the user doc (via
  // deleteUserAccountData), THEN deletes the Firebase Auth user. Order
  // matters: Firestore security rules require an authenticated matching
  // uid, so all Firestore deletes must happen before the auth user is gone.
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteUserAccountData(user.uid);
      await deleteUser(auth.currentUser);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      const message =
        err.code === 'auth/requires-recent-login'
          ? 'For security, please sign out and back in, then try again.'
          : 'Could not delete account. Please try again.';
      setSnackbar({ open: true, severity: 'error', message });
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (!user) return null; // ProtectedRoute handles the redirect

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', py: { xs: 3, md: 5 }, px: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 640, margin: '0 auto' }}
      >
        <Typography variant="h3" sx={{ mb: 0.5 }}>
          Profile Settings
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Keep your personal information up to date to receive more personalized nutrition
          recommendations.
        </Typography>

        <PageCard sx={{ p: { xs: 2.5, sm: 4 } }}>
          {loading ? (
            <Skeleton variant="rounded" height={420} />
          ) : (
            <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <motion.div variants={fadeUp}>
                  <FocusField>
                    <TextField
                      label="Full Name"
                      value={form.fullName}
                      onChange={setField('fullName')}
                      error={!!errors.fullName}
                      helperText={errors.fullName}
                      fullWidth
                      required
                    />
                  </FocusField>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <FocusField>
                    <TextField
                      label="Height (cm)"
                      type="number"
                      value={form.heightCm}
                      onChange={setField('heightCm')}
                      error={!!errors.heightCm}
                      helperText={errors.heightCm}
                      fullWidth
                      required
                    />
                  </FocusField>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <FocusField>
                    <TextField
                      label="Weight (kg)"
                      type="number"
                      value={form.weightKg}
                      onChange={setField('weightKg')}
                      error={!!errors.weightKg}
                      helperText={errors.weightKg}
                      fullWidth
                      required
                    />
                  </FocusField>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <FocusField>
                    <TextField
                      label="Age"
                      type="number"
                      value={form.age}
                      onChange={setField('age')}
                      error={!!errors.age}
                      helperText={errors.age}
                      fullWidth
                      required
                    />
                  </FocusField>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <FormControl component="fieldset" error={!!errors.gender} required>
                    <FormLabel component="legend" sx={{ color: 'text.primary', fontWeight: 500, mb: 0.5 }}>
                      Gender
                    </FormLabel>
                    <RadioGroup
                      row
                      value={form.gender}
                      onChange={setField('gender')}
                      sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <FormControlLabel
                          key={g}
                          value={g}
                          control={<Radio sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }} />}
                          label={g}
                        />
                      ))}
                    </RadioGroup>
                    {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                  </FormControl>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <FocusField>
                    <TextField
                      label="About Yourself (optional)"
                      placeholder="What do you enjoy doing in your free time? Any hobbies, interests, or lifestyle notes?"
                      value={form.bio}
                      onChange={setField('bio')}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  </FocusField>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Divider sx={{ my: 0.5, borderColor: 'background.default' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Physical Activity
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Do you exercise regularly?
                      </Typography>
                    </Box>
                    <Switch
                      checked={form.exercisesRegularly}
                      onChange={handleActivityToggle}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          bgcolor: 'primary.main',
                        },
                      }}
                    />
                  </Box>

                  <AnimatePresence initial={false}>
                    {form.exercisesRegularly && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Box sx={{ pt: 2 }}>
                          <FocusField>
                            <TextField
                              select
                              label="How often?"
                              value={form.exerciseFrequency}
                              onChange={setField('exerciseFrequency')}
                              fullWidth
                            >
                              {FREQUENCY_OPTIONS.map((f) => (
                                <MenuItem key={f.value} value={f.value}>
                                  {f.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </FocusField>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Divider sx={{ my: 0.5, borderColor: 'background.default' }} />
                  <Typography variant="body1" sx={{ fontWeight: 500, pt: 1, mb: 1.5 }}>
                    Health Conditions
                  </Typography>
                  {loadingConditions ? (
                    <Skeleton variant="rounded" height={56} />
                  ) : (
                    <ConditionSelector
                      value={conditions}
                      onChange={handleConditionsChange}
                      disabled={savingConditions}
                    />
                  )}
                </motion.div>

                <motion.div variants={fadeUp}>
                  <MotionButton
                    onClick={handleSave}
                    disabled={saving}
                    fullWidth
                    variant="contained"
                    whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(99, 114, 57, 0.28)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                    sx={{
                      mt: 1,
                      py: 1.4,
                      borderRadius: '16px',
                      bgcolor: 'primary.main',
                      color: '#F0EADC',
                      fontSize: 16,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'primary.main' }, // color handled by shadow/lift, not hue flip here
                    }}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </MotionButton>
                </motion.div>
              </Box>
            </motion.div>
          )}
        </PageCard>

        {/* --- Account actions, visually separated below the main form card --- */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <PageCard sx={{ p: { xs: 2.5, sm: 3 }, mt: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Account
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
              <Button
                onClick={handleSendPasswordReset}
                startIcon={<KeyRound size={18} />}
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  borderColor: 'text.secondary',
                  color: 'text.primary',
                  textTransform: 'none',
                  flex: 1,
                }}
              >
                Change Password
              </Button>
              <Button
                onClick={() => setDeleteConfirmOpen(true)}
                startIcon={<Trash2 size={18} />}
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  textTransform: 'none',
                  flex: 1,
                }}
              >
                Delete Account
              </Button>
            </Box>
          </PageCard>
        </motion.div>
      </motion.div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={SlideUp}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle2 size={20} /> : undefined}
          sx={{ borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete your account?"
        message="This permanently deletes your account, health goals, meal plans, recipe history, and all saved data. This can't be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete Account'}
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}
