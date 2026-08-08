import { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Avatar,
  AvatarGroup,
  Snackbar,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Check,
  Clock,
  Archive,
  CircleDot,
  ListChecks,
  History as HistoryIcon,
} from 'lucide-react';

/**
 * TodaysTask.jsx
 * ----------------------------------------------------------------------
 * "Today's Task" workspace for NutriSense — mirrors the structural idea
 * of the reference (top toggle, heading + New Task action, status
 * filters, rectangular task cards) but is fully rebuilt on the existing
 * NutriSense design system (theme.js): Verdigris / Shadow / Dandelion /
 * Ecru White, Special Gothic Expanded One headings, Kameron body text.
 *
 * Deliberate deviations from theme.js defaults, scoped to this page only:
 * - shape.borderRadius is globally 25 (very rounded). This page overrides
 *   radius locally to 10–12px on every interactive surface (cards,
 *   buttons, filters, inputs) per the explicit "no pill shapes" brief —
 *   documented here as a scoped exception, same pattern as the BMI
 *   6-hue exception and the RateUsDialog non-MUI-Dialog exception.
 * - No scale-based motion anywhere (no whileHover scale, no springs on
 *   hover) — only opacity/position/color/border changes, per brief.
 *
 * Data: this page ships with local mock state so it can be dropped in
 * and previewed immediately. Wiring to Firestore is a drop-in swap —
 * see firestoreTasks.js (companion file) for the users/{uid}/tasks
 * subcollection CRUD functions in the same shape as firestoreGoals.js /
 * firestoreRecipes.js. Replace the `useState(initialTasks)` block below
 * with `getAllTasks(user.uid)` + the create/update/archive calls.
 */

const RADIUS = 10; // page-scoped rectangular radius (overrides theme's 25)

const STATUS = {
  OPEN: 'open',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: STATUS.OPEN, label: 'Open' },
  { key: STATUS.COMPLETED, label: 'Completed' },
  { key: STATUS.ARCHIVED, label: 'Archived' },
];

const CONTEXT_OPTIONS = ['Food', 'Medicine', 'Exercise', 'Reading'];

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const initialTasks = [
  {
    id: 't1',
    title: 'Log breakfast macros',
    description: 'Analyze this morning\u2019s oatmeal bowl and confirm ingredient matches.',
    date: 'Today',
    time: '8:00 AM \u2013 8:15 AM',
    status: STATUS.COMPLETED,
    priority: 'Medium',
    context: 'Food',
    collaborators: ['You'],
  },
  {
    id: 't2',
    title: 'Take evening medication',
    description: 'Blood pressure medication, after dinner as prescribed.',
    date: 'Today',
    time: '11:00 AM \u2013 11:20 AM',
    status: STATUS.OPEN,
    priority: 'High',
    context: 'Medicine',
    collaborators: ['You'],
  },
  {
    id: 't3',
    title: 'Evening walk',
    description: '30-minute walk to stay on track with the weekly activity goal.',
    date: 'Today',
    time: '5:30 PM \u2013 6:00 PM',
    status: STATUS.OPEN,
    priority: 'Medium',
    context: 'Exercise',
    collaborators: ['You'],
  },
  {
    id: 't4',
    title: 'Read up on managing sodium intake',
    description: 'Article saved from Dashboard \u2014 useful before next grocery run.',
    date: 'Yesterday',
    time: '9:00 AM',
    status: STATUS.ARCHIVED,
    priority: 'Low',
    context: 'Reading',
    collaborators: ['You'],
  },
];

const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

// ---------------------------------------------------------------------
// Motion variants — opacity + small positional shift only, no scale.
// ---------------------------------------------------------------------
const panelVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 24 : -24,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -24 : 24,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  }),
};

const listStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowFade = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

function StatusTag({ status }) {
  const map = {
    [STATUS.OPEN]: {
      label: 'Open',
      icon: <CircleDot size={14} strokeWidth={2.5} />,
      color: 'primary.dark',
      bg: 'rgba(99, 114, 57, 0.10)',
      border: 'primary.main',
    },
    [STATUS.COMPLETED]: {
      label: 'Completed',
      icon: <Check size={14} strokeWidth={2.5} />,
      color: 'text.secondary',
      bg: 'rgba(141, 132, 77, 0.10)',
      border: 'secondary.main',
    },
    [STATUS.ARCHIVED]: {
      label: 'Archived',
      icon: <Archive size={14} strokeWidth={2.5} />,
      color: 'text.secondary',
      bg: 'rgba(107, 101, 80, 0.08)',
      border: 'text.secondary',
    },
  };
  const s = map[status];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.4,
        borderRadius: `${RADIUS - 4}px`,
        border: '1px solid',
        borderColor: s.border,
        bgcolor: s.bg,
        color: s.color,
      }}
    >
      {s.icon}
      <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
        {s.label}
      </Typography>
    </Box>
  );
}

function TaskCard({ task, onToggleComplete, onArchive }) {
  const isCompleted = task.status === STATUS.COMPLETED;
  const isArchived = task.status === STATUS.ARCHIVED;

  return (
    <motion.div variants={rowFade}>
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'rgba(63, 71, 40, 0.10)',
          borderRadius: `${RADIUS}px`,
          p: { xs: 2, sm: 2.5 },
          mb: 1.5,
          opacity: isArchived ? 0.75 : 1,
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 1px 6px rgba(63, 71, 40, 0.08)',
          },
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <IconButton
                onClick={() => onToggleComplete(task.id)}
                disabled={isArchived}
                sx={{
                  width: 28,
                  height: 28,
                  mt: 0.3,
                  borderRadius: `${RADIUS - 6}px`,
                  border: '1.5px solid',
                  borderColor: isCompleted ? 'primary.main' : 'rgba(107,101,80,0.35)',
                  bgcolor: isCompleted ? 'primary.main' : 'transparent',
                  color: isCompleted ? '#F0EADC' : 'transparent',
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: isCompleted ? 'primary.dark' : 'rgba(99,114,57,0.08)',
                  },
                }}
              >
                <Check size={16} strokeWidth={3} />
              </IconButton>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: '"Special Gothic Expanded One", sans-serif',
                    fontSize: '1rem',
                    color: 'text.primary',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    textDecorationColor: 'text.secondary',
                    opacity: isCompleted ? 0.65 : 1,
                  }}
                  noWrap
                >
                  {task.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.25 }}
                >
                  {task.description}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 1 }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
                    <Clock size={14} />
                    <Typography variant="caption">
                      {task.date} \u00b7 {task.time}
                    </Typography>
                  </Stack>
                  <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(107,101,80,0.25)' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'secondary.dark',
                      bgcolor: 'rgba(141,132,77,0.10)',
                      px: 0.9,
                      py: 0.25,
                      borderRadius: `${RADIUS - 6}px`,
                    }}
                  >
                    {task.context}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'accent.dark',
                      bgcolor: 'rgba(255,205,40,0.18)',
                      px: 0.9,
                      py: 0.25,
                      borderRadius: `${RADIUS - 6}px`,
                    }}
                  >
                    {task.priority} priority
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Stack
            direction={{ xs: 'row', sm: 'column' }}
            spacing={1}
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            justifyContent="space-between"
          >
            <StatusTag status={task.status} />
            <Stack direction="row" spacing={1} alignItems="center">
              <AvatarGroup
                max={3}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 26,
                    height: 26,
                    fontSize: '0.7rem',
                    borderRadius: `${RADIUS - 6}px`,
                    bgcolor: 'primary.main',
                    color: '#F0EADC',
                    border: '2px solid',
                    borderColor: 'background.paper',
                  },
                }}
              >
                {task.collaborators.map((c) => (
                  <Avatar key={c}>{c.slice(0, 1)}</Avatar>
                ))}
              </AvatarGroup>
              {!isArchived && (
                <Button
                  size="small"
                  onClick={() => onArchive(task.id)}
                  sx={{
                    minWidth: 0,
                    px: 1,
                    py: 0.4,
                    fontSize: '0.7rem',
                    borderRadius: `${RADIUS - 6}px`,
                    color: 'text.secondary',
                    '&:hover': { color: 'secondary.dark', bgcolor: 'rgba(141,132,77,0.08)' },
                  }}
                >
                  Archive
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </motion.div>
  );
}

function NewTaskDialog({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Medium',
    context: 'Food',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onCreate({
      id: `t${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim() || 'No additional details.',
      date: form.date || 'Today',
      time: form.time || '\u2014',
      status: STATUS.OPEN,
      priority: form.priority,
      context: form.context,
      // context now holds a task type: Food | Medicine | Exercise | Reading
      collaborators: ['You'],
    });
    setForm({ title: '', description: '', date: '', time: '', priority: 'Medium', context: 'Food' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: `${RADIUS}px`, bgcolor: 'background.paper' } }}
    >
      <DialogTitle
        sx={{
          fontFamily: '"Special Gothic Expanded One", sans-serif',
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        New Task
        <IconButton onClick={onClose} size="small" sx={{ borderRadius: `${RADIUS - 6}px` }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(63,71,40,0.10)' }}>
        <Stack spacing={2.25} sx={{ pt: 0.5 }}>
          <TextField
            label="Task title"
            value={form.title}
            onChange={update('title')}
            fullWidth
            autoFocus
            slotProps={{ input: { sx: { borderRadius: `${RADIUS - 4}px` } } }}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={update('description')}
            fullWidth
            multiline
            minRows={2}
            slotProps={{ input: { sx: { borderRadius: `${RADIUS - 4}px` } } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={update('date')}
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: { sx: { borderRadius: `${RADIUS - 4}px` } },
              }}
            />
            <TextField
              label="Time"
              type="time"
              value={form.time}
              onChange={update('time')}
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: { sx: { borderRadius: `${RADIUS - 4}px` } },
              }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                label="Priority"
                value={form.priority}
                onChange={update('priority')}
                sx={{ borderRadius: `${RADIUS - 4}px` }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Task type</InputLabel>
              <Select
                label="Task type"
                value={form.context}
                onChange={update('context')}
                sx={{ borderRadius: `${RADIUS - 4}px` }}
              >
                {CONTEXT_OPTIONS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: `${RADIUS - 4}px`, color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            borderRadius: `${RADIUS - 4}px`,
            bgcolor: 'primary.main',
            color: '#F0EADC',
            px: 3,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Create task
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TodaysTask() {
  const [tab, setTab] = useState('today'); // 'today' | 'activity'
  const [direction, setDirection] = useState(1);
  const [filter, setFilter] = useState('all');
  const [tasks, setTasks] = useState(initialTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const handleTabChange = (next) => {
    if (next === tab) return;
    setDirection(next === 'activity' ? 1 : -1);
    setTab(next);
  };

  const visibleTasks = useMemo(() => {
    if (filter === 'all') return tasks.filter((t) => t.status !== STATUS.ARCHIVED || filter === 'all');
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const activityTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === STATUS.COMPLETED)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [tasks]
  );

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === STATUS.COMPLETED ? STATUS.OPEN : STATUS.COMPLETED }
          : t
      )
    );
  };

  const archiveTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: STATUS.ARCHIVED } : t)));
    setToast('Task archived');
  };

  const createTask = (task) => {
    setTasks((prev) => [task, ...prev]);
    setToast('Task created');
  };

  const counts = useMemo(
    () => ({
      all: tasks.length,
      [STATUS.OPEN]: tasks.filter((t) => t.status === STATUS.OPEN).length,
      [STATUS.COMPLETED]: tasks.filter((t) => t.status === STATUS.COMPLETED).length,
      [STATUS.ARCHIVED]: tasks.filter((t) => t.status === STATUS.ARCHIVED).length,
    }),
    [tasks]
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="md">
        {/* Top toggle: Today's Task / Last Activity — centered */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              border: '1px solid',
              borderColor: 'rgba(63,71,40,0.14)',
              borderRadius: `${RADIUS}px`,
              bgcolor: 'background.paper',
              p: 0.5,
            }}
          >
            {[
              { key: 'today', label: "Today's Task", icon: <ListChecks size={16} /> },
              { key: 'activity', label: 'Last Activity', icon: <HistoryIcon size={16} /> },
            ].map((item) => {
              const active = tab === item.key;
              return (
                <Box
                  key={item.key}
                  onClick={() => handleTabChange(item.key)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 0.85,
                    cursor: 'pointer',
                    borderRadius: `${RADIUS - 4}px`,
                    color: active ? '#3F4728' : 'text.secondary',
                    bgcolor: active ? '#d4ad2d' : 'transparent',
                    transition: 'background-color 150ms ease, color 150ms ease',
                    '&:hover': {
                      bgcolor: active ? '#c29e28' : 'rgba(99,114,57,0.08)',
                    },
                  }}
                >
                  {item.icon}
                  <Typography variant="body1" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {tab === 'today' ? (
              <motion.div
                key="today"
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Heading */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{ fontSize: { xs: '1.6rem', sm: '1.9rem' }, color: 'text.primary' }}
                  >
                    Today's Task
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {todayLabel}
                  </Typography>
                </Box>

                {/* Status filters + New Task action, same row */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    {FILTERS.map((f) => {
                      const active = filter === f.key;
                      return (
                        <Box
                          key={f.key}
                          onClick={() => setFilter(f.key)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.75,
                            py: 0.75,
                            cursor: 'pointer',
                            borderRadius: `${RADIUS - 4}px`,
                            border: '1px solid',
                            borderColor: active ? '#d4ad2d' : 'rgba(63,71,40,0.14)',
                            bgcolor: active ? 'rgba(212,173,45,0.16)' : 'background.paper',
                            transition: 'border-color 150ms ease, background-color 150ms ease',
                            '&:hover': { borderColor: '#d4ad2d' },
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: active ? 700 : 500,
                              color: active ? '#3F4728' : 'text.secondary',
                            }}
                          >
                            {f.label}
                          </Typography>
                          <Box
                            sx={{
                              fontSize: '0.7rem',
                              px: 0.75,
                              borderRadius: `${RADIUS - 6}px`,
                              bgcolor: active ? '#d4ad2d' : 'rgba(107,101,80,0.12)',
                              color: active ? '#3F4728' : 'text.secondary',
                              fontWeight: 700,
                            }}
                          >
                            {counts[f.key]}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>

                  <Button
                    onClick={() => setDialogOpen(true)}
                    startIcon={<Plus size={18} />}
                    variant="contained"
                    sx={{
                      borderRadius: `${RADIUS - 4}px`,
                      bgcolor: 'primary.main',
                      color: '#F0EADC',
                      px: 2.5,
                      py: 1,
                      alignSelf: { xs: 'stretch', sm: 'auto' },
                      flexShrink: 0,
                      transition: 'background-color 150ms ease, border-color 150ms ease',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    New Task
                  </Button>
                </Stack>

                {/* Task list */}
                <motion.div variants={listStagger} initial="hidden" animate="visible">
                  {visibleTasks.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        border: '1px dashed',
                        borderColor: 'rgba(63,71,40,0.18)',
                        borderRadius: `${RADIUS}px`,
                        color: 'text.secondary',
                      }}
                    >
                      <Typography variant="body1">No tasks in this view yet.</Typography>
                    </Box>
                  ) : (
                    visibleTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={toggleComplete}
                        onArchive={archiveTask}
                      />
                    ))
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="activity"
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{ fontSize: { xs: '1.6rem', sm: '1.9rem' }, color: 'text.primary' }}
                  >
                    Last Activity
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    Tasks you've marked complete, most recent first
                  </Typography>
                </Box>

                <motion.div variants={listStagger} initial="hidden" animate="visible">
                  {activityTasks.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        border: '1px dashed',
                        borderColor: 'rgba(63,71,40,0.18)',
                        borderRadius: `${RADIUS}px`,
                        color: 'text.secondary',
                      }}
                    >
                      <Typography variant="body1">Nothing completed yet.</Typography>
                    </Box>
                  ) : (
                    activityTasks.map((task) => (
                      <motion.div key={task.id} variants={rowFade}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'rgba(63,71,40,0.10)',
                            borderRadius: `${RADIUS}px`,
                            p: 2,
                            mb: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: `${RADIUS - 6}px`,
                              bgcolor: 'primary.main',
                              color: '#F0EADC',
                            }}
                          >
                            <Check size={16} strokeWidth={3} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontFamily: '"Special Gothic Expanded One", sans-serif',
                                fontSize: '0.95rem',
                                color: 'text.primary',
                              }}
                              noWrap
                            >
                              {task.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Completed \u00b7 {task.date} \u00b7 {task.time}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'secondary.dark',
                              bgcolor: 'rgba(141,132,77,0.10)',
                              px: 1,
                              py: 0.35,
                              borderRadius: `${RADIUS - 6}px`,
                              flexShrink: 0,
                            }}
                          >
                            {task.context}
                          </Typography>
                        </Stack>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Container>

      <NewTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={createTask}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity="success"
          variant="filled"
          sx={{
            borderRadius: `${RADIUS - 4}px`,
            bgcolor: 'primary.main',
            color: '#F0EADC',
          }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
