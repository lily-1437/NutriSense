import { useState } from 'react';
import {
  Box, Button, Typography, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Settings } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Analyze', path: '/analyze' },
  { label: 'Meal Plans', path: '/meal-plans' },
  { label: 'Goals', path: '/goals' },
  { label: 'About', path: '/about' },
];

// Fixed navbar height + top offset, used both here and as a spacer in
// PublicLayout so the floating pill doesn't overlap page content (previous
// bug: position:fixed took the navbar out of flow with no spacer).
export const NAVBAR_HEIGHT = 64;
export const NAVBAR_TOP_OFFSET = 16;

// motion.create() replaces the deprecated motion() wrapper syntax
const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);

// Entrance: fade + slide down from above, per the reference brief
// (opacity 0 -> 1, translateY: -20px -> 0, ease-out).
const navContainerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

export default function AppNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:900px)');

  const goTo = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      <MotionBox
        variants={navContainerVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2 }}
        sx={{
          position: 'fixed',
          top: NAVBAR_TOP_OFFSET,
          left: 16,
          right: 16,
          maxWidth: 1400,
          width: 'auto',
          margin: '0 auto',
          height: NAVBAR_HEIGHT,
          zIndex: theme.zIndex.appBar,
          bgcolor: 'rgba(44, 65, 38, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
        }}
      >
        {/* Logo */}
        <MotionButton
          variants={navItemVariants}
          onClick={() => goTo('/')}
          disableRipple
          sx={{
            fontFamily: '"Special Gothic Expanded One", sans-serif',
            color: 'background.default', // Ecru White
            fontSize: 20,
            textTransform: 'none',
            px: 1,
          }}
        >
          NutriSense
        </MotionButton>

        {/* Center nav links -- desktop only */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {NAV_LINKS.map((link) => (
              <MotionButton
                key={link.path}
                variants={navItemVariants}
                onClick={() => goTo(link.path)}
                disableRipple
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
                sx={{
                  color: 'background.default',
                  textTransform: 'none',
                  fontFamily: '"Kameron", serif',
                  fontWeight: 400,
                  fontSize: 19,
                  px: 1.5,
                  bgcolor: 'transparent',
                  transition: 'color 200ms ease',
                  '&:hover': { color: 'accent.main', bgcolor: 'transparent' }, // Dandelion
                }}
              >
                {link.label}
              </MotionButton>
            ))}
          </Box>
        )}

        {/* Right side: auth actions -- desktop only */}
        {!isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MotionButton
              variants={navItemVariants}
              onClick={() => goTo('/login')}
              disableRipple
              whileHover={{ y: -1 }}
              sx={{
                color: 'background.default',
                textTransform: 'none',
                fontFamily: '"Kameron", serif',
                fontSize: 15,
              }}
            >
              Login
            </MotionButton>

            <MotionButton
              variants={navItemVariants}
              onClick={() => goTo('/signup')}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              sx={{
                bgcolor: 'background.default', // Ecru White, light pill -- reference's "Sign Up"
                color: 'primary.dark',
                textTransform: 'none',
                fontFamily: '"Kameron", serif',
                borderRadius: '15px',
                px: 2.5,
                py: 0.75,
                '&:hover': { bgcolor: 'background.default' },
              }}
            >
              Sign Up
            </MotionButton>

            {/* Go Pro -- visual placeholder only for now, no route yet */}
            <MotionButton
              variants={navItemVariants}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              sx={{
                bgcolor: 'accent.main', // Dandelion
                color: 'accent.contrastText',
                textTransform: 'none',
                fontFamily: '"Kameron", serif',
                borderRadius: '15px',
                px: 2.5,
                py: 0.75,
                '&:hover': { bgcolor: 'accent.dark' },
              }}
            >
              Go Pro
            </MotionButton>

            {/* Settings icon -- placeholder until /profile exists (Increment 2) */}
            <motion.div
              variants={navItemVariants}
              whileHover={{ rotate: 45, scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <IconButton
                aria-label="Settings"
                sx={{
                  color: 'background.default',
                  '&:hover': { bgcolor: 'rgba(240, 234, 220, 0.12)' },
                }}
              >
                <Settings size={20} />
              </IconButton>
            </motion.div>
          </Box>
        ) : (
          <motion.div variants={navItemVariants}>
            <IconButton
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ color: 'background.default' }}
            >
              <Menu size={22} />
            </IconButton>
          </motion.div>
        )}
      </MotionBox>

      {/* Mobile drawer -- MUI-native Slide (§0.6), same visual language */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { bgcolor: 'primary.dark', color: 'background.default', width: 260, p: 2 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'background.default' }} aria-label="Close menu">
            <X size={20} />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton onClick={() => goTo(link.path)}>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontFamily: '"Special Gothic", sans-serif' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ borderColor: 'rgba(240, 234, 220, 0.2)', my: 1 }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => goTo('/login')}>
              <ListItemText primary="Login" primaryTypographyProps={{ fontFamily: '"Special Gothic", sans-serif' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => goTo('/signup')}>
              <ListItemText primary="Sign Up" primaryTypographyProps={{ fontFamily: '"Special Gothic", sans-serif' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
