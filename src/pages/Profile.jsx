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
//
// RE-AUTH FIX (this version): Firebase's deleteUser() throws
// 'auth/requires-recent-login' if the user's session isn't fresh, which
// previously forced a full sign-out -> sign-in -> retry round trip just to
// delete an account. That's a bad flow to force on someone who's already
// decided to leave. The delete confirmation now asks for the account
// password directly in the dialog and calls reauthenticateWithCredential()
// silently right before the delete -- one click, no navigation, no
// separate login screen. This only works because the app is email/password
// auth only (see Login.jsx/Signup.jsx) -- if a social provider is ever
// added, this dialog would need a provider-specific re-auth flow instead.

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Trash2, CheckCircle2, Eye, EyeClosed } from 'lucide-react';
import {
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { fadeUp, staggerContainer } from '../motion/variants';
import PageCard from '../components/PageCard';
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

  // Delete-account dialog now owns its own password field + error state,
  // since re-auth happens inline here rather than via a generic
  // yes/no ConfirmDialog.
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState('');

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

  const openDeleteDialog = () => {
    setDeletePassword('');
    setDeletePasswordError('');
    setShowDeletePassword(false);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return; // don't allow closing mid-delete
    setDeleteConfirmOpen(false);
    setDeletePassword('');
    setDeletePasswordError('');
  };

  // Re-authenticates with the password entered in the dialog, THEN wipes
  // goals/recipes/reviews/tasks/logs/mealCompletions/mealPlan/user-doc (via
  // deleteUserAccountData), THEN deletes the Firebase Auth user -- all in
  // one confirmation, no sign-out/sign-in round trip. Order matters:
  // Firestore security rules require an authenticated matching uid, so all
  // Firestore deletes must happen before the auth user is gone; and the
  // re-auth must happen before THAT, since it's what makes deleteUser()
  // stop throwing 'auth/requires-recent-login' in the first place.
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeletePasswordError('Enter your password to confirm.');
      return;
    }

    setDeleting(true);
    setDeletePasswordError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await deleteUserAccountData(user.uid);
      await deleteUser(auth.currentUser);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        // Wrong password -- keep the dialog open, let them retry without
        // starting over or losing their place.
        setDeletePasswordError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setDeletePasswordError('Too many attempts. Please wait a moment and try again.');
      } else {
        setSnackbar({ open: true, severity: 'error', message: 'Could not delete account. Please try again.' });
        setDeleteConfirmOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 0 }, py: 4 }}>
      <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible">
        <PageCard sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h3" sx={{ mb: 3 }}>
            Profile Settings
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={56} />
              ))}
            </Box>
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
                onClick={openDeleteDialog}
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

      {/*
        Delete-account confirmation, now with an inline password field for
        re-authentication. Replaces the previous generic ConfirmDialog for
        this specific action, since re-auth needs a form field the plain
        yes/no dialog didn't have. One click, one dialog, no sign-out
        round trip -- entering the correct password here both confirms
        intent AND satisfies Firebase's "recent login" requirement for
        deleteUser() in the same step.
      */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: (t) => t.typography.h3.fontFamily, color: 'secondary.main' }}>
          Delete your account?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14, color: 'text.secondary', mb: 2.5 }}>
            This permanently deletes your account, health goals, meal plans, recipe history, and
            all saved data. This can't be undone. Enter your password to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            type={showDeletePassword ? 'text' : 'password'}
            label="Password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
              if (deletePasswordError) setDeletePasswordError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !deleting) handleDeleteAccount();
            }}
            error={!!deletePasswordError}
            helperText={deletePasswordError}
            disabled={deleting}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowDeletePassword((s) => !s)} edge="end" size="small">
                      {showDeletePassword ? <EyeClosed size={18} color="#6B6550" /> : <Eye size={18} color="#6B6550" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeleteDialog} disabled={deleting} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={deleting}
            variant="contained"
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
            sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
