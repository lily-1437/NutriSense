// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Box, TextField, Typography, Alert, Link, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import { fadeUp } from '../motion/variants';
import AuthLayout from '../components/AuthLayout';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: form.email,
        displayName: form.name,
        conditions: [],
        createdAt: serverTimestamp(),
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Could not create account. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <AuthLayout
      headline="Know what's really in your recipe."
      description="NutriSense breaks down every ingredient so you can eat with confidence."
      title="Get Started"
      subtitle="Create an account to save recipes and track your goals."
    >
      <motion.div variants={fadeUp}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <TextField
          fullWidth
          label="Full Name"
          value={form.name}
          onChange={handleChange('name')}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2.25 }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <TextField
          fullWidth
          type="email"
          label="Email Address"
          value={form.email}
          onChange={handleChange('email')}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2.25 }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={form.password}
          onChange={handleChange('password')}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2.25 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                  {showPassword ? <EyeOff size={18} color="#6B6550" /> : <Eye size={18} color="#6B6550" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          onKeyDown={handleKeyDown}
          sx={{ mb: 3 }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <Box
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            width: '100%',
            py: 1.4,
            border: '1.5px solid #000000',
            borderRadius: '15px',
            bgcolor: '#ffcd28',
            color: '#000000',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: '"Kameron", serif',
            fontSize: { xs: 12, md: 16 },
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            transition: 'background-color 200ms ease, color 200ms ease, border-color 200ms ease',
            '&:hover': {
              bgcolor: loading ? '#ffcd28' : '#d4ad2d',
              color: loading ? '#000000' : '#ffffff',
              borderColor: loading ? '#000000' : 'transparent',
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#F0EADC' }} /> : 'Create Account'}
        </Box>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Typography variant="caption" sx={{ display: 'block', mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Log in
          </Link>
        </Typography>
      </motion.div>
    </AuthLayout>
  );
}
