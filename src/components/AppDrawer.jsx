// src/components/AppDrawer.jsx
//
// Permanent (desktop) / temporary (mobile) app navigation drawer.
// Replaces the need for AppNavbar on drawer-shell pages (e.g. Dashboard),
// since this component now owns primary navigation for logged-in users.
//
// NOTE ON NAV ITEMS: the dashboard reference design used generic items
// (Progress / Schedule / Billing / Blog & Articles) that don't map to real
// NutriSense routes yet. These have been swapped for the app's actual pages
// per the established nav order (see Page Navigation Map):
//   Dashboard, Analyze Recipe, Meal Planner, Simulator, Health Goals,
//   — divider —
//   History, Profile
// "Home" is intentionally left off this drawer (it's a logged-out marketing
// route); Dashboard is the logged-in landing point instead.

import { NavLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  SlidersHorizontal,
  Target,
  History as HistoryIcon,
  UserCircle,
  LogOut,
  Leaf,
} from 'lucide-react';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';

const DRAWER_WIDTH = 248;

const primaryNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Analyze Recipe', to: '/analyze', icon: UtensilsCrossed },
  { label: 'Meal Planner', to: '/meal-planner', icon: CalendarDays },
  { label: 'Simulator', to: '/simulator', icon: SlidersHorizontal },
  { label: 'Health Goals', to: '/goals', icon: Target },
];

const secondaryNav = [
  { label: 'History', to: '/history', icon: HistoryIcon },
  { label: 'Profile', to: '/profile', icon: UserCircle },
];

const MotionListItemButton = motion.create(ListItemButton);

function NavRow({ item }) {
  const Icon = item.icon;
  return (
    <ListItemButton
      component={NavLink}
      to={item.to}
      end
      sx={{
        mx: 1.5,
        mb: 0.5,
        borderRadius: '14px',
        color: 'text.primary',
        transition: 'background-color 160ms ease, color 160ms ease',
        '&:hover': {
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
        },
        '&.active': {
          bgcolor: 'primary.main',
          color: '#F0EADC',
          '& .MuiListItemIcon-root': { color: '#F0EADC' },
          '&:hover': { bgcolor: 'primary.main' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
        <Icon size={20} strokeWidth={2} />
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ fontSize: 14.5, fontWeight: 500 }}
      />
    </ListItemButton>
  );
}

function DrawerContent({ onNavigate }) {
  const { logout } = useAuth();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 3 }}>
      <Box
        component="img"
        src="/assets/favicon.svg"
        alt="NutriSense logo"
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          objectFit: 'contain',
        }}
      />
  <Typography
    sx={{
      fontFamily: '"Special Gothic Expanded One", sans-serif',
      fontSize: 17,
      color: 'text.primary',
    }}
  >
    NutriSense
  </Typography>
</Box>
      <Divider sx={{ borderColor: 'background.default' }} />

      {/* Primary nav group */}
      <List sx={{ pt: 1.5 }} onClick={onNavigate}>
        {primaryNav.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </List>

      <Divider sx={{ mx: 2.5, my: 1, borderColor: 'background.default' }} />

      {/* Secondary nav group */}
      <List onClick={onNavigate}>
        {secondaryNav.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Logout, pinned to bottom */}
      <Box sx={{ px: 1.5, pb: 2.5 }}>
        <Divider sx={{ mx: 1, mb: 1.5, borderColor: 'background.default' }} />
        <MotionListItemButton
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          sx={{
            borderRadius: '14px',
            color: 'secondary.dark',
            '&:hover': { bgcolor: (t) => alpha(t.palette.secondary.main, 0.1) },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'secondary.main' }}>
            <LogOut size={20} strokeWidth={2} />
          </ListItemIcon>
          <ListItemText
            primary="Log Out"
            primaryTypographyProps={{ fontSize: 14.5, fontWeight: 500 }}
          />
        </MotionListItemButton>
      </Box>
    </Box>
  );
}

/**
 * AppDrawer
 * - Desktop (md+): permanent, fixed drawer, always visible.
 * - Mobile: temporary drawer controlled by `open`/`onClose` props
 *   (toggle button lives in the page's own top bar, e.g. Dashboard's
 *   top nav, since AppNavbar is not rendered on drawer-shell pages).
 */
export default function AppDrawer({ open = false, onClose }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '1px 0 0 rgba(63,71,40,0.06)',
          },
        }}
      >
        <DrawerContent />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <DrawerContent onNavigate={onClose} />
    </Drawer>
  );
}

export { DRAWER_WIDTH };
