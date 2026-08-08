// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  Box, TextField, Typography, Alert, Link, InputAdornment, IconButton,
  CircularProgress, Checkbox, FormControlLabel,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { fadeUp } from '../motion/variants';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      // justAuthed triggers the "Logged in successfully" welcome toast on
      // Dashboard (only reads it there, so it's harmless if redirectTo is
      // some other protected route).
      navigate(redirectTo, { replace: true, state: { justAuthed: true } });
    } catch (err) {
      setError('Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
        <AuthLayout
        headline="Welcome back to smarter eating."
        description="Pick up right where you left off with your recipes and goals."
        title="NutriSense"
        titleLinkTo="/"
        subtitle="Log in to continue tracking your nutrition."
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
          sx={{ mb: 1 }}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                size="small"
                sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
              />
            }
            label={<Typography variant="caption" sx={{ color: 'text.secondary' }}>Remember me</Typography>}
          />
          <Link component={RouterLink} to="/forgot-password" sx={{ fontSize: '0.8rem', color: 'primary.main' }}>
            Forgot password?
          </Link>
        </Box>
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
          {loading ? <CircularProgress size={20} sx={{ color: '#F0EADC' }} /> : 'Log In'}
        </Box>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Typography variant="caption" sx={{ display: 'block', mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
          Don't have an account?{' '}
          <Link component={RouterLink} to="/signup" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Sign up
          </Link>
        </Typography>
      </motion.div>
    </AuthLayout>
  );
}
