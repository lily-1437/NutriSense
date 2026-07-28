// src/components/dashboard/QuoteOfTheDay.jsx

import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, IconButton, Skeleton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, RefreshCw, AlertCircle } from 'lucide-react';
import { getDailyQuote } from '../../logic/dailyQuote';

export default function QuoteOfTheDay() {
  const [state, setState] = useState({ status: 'loading', quote: null, author: null });

  const load = useCallback(async (force = false) => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const { quote, author } = await getDailyQuote(force);
      setState({ status: 'ready', quote, author });
    } catch (err) {
      setState({ status: 'error', quote: null, author: null });
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <Box
      sx={{
        borderRadius: '20px',
        p: 2.5,
        bgcolor: 'primary.main',
        color: '#F0EADC',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Quote size={16} color="#FFD95E" />
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, opacity: 0.85 }}>
            QUOTE OF THE DAY
          </Typography>
        </Box>
        <Tooltip title="Get a new quote">
          <IconButton
            size="small"
            onClick={() => load(true)}
            disabled={state.status === 'loading'}
            sx={{ color: '#F0EADC' }}
          >
            <motion.div
              animate={state.status === 'loading' ? { rotate: 360 } : { rotate: 0 }}
              transition={
                state.status === 'loading'
                  ? { repeat: Infinity, duration: 0.9, ease: 'linear' }
                  : { duration: 0.2 }
              }
            >
              <RefreshCw size={15} />
            </motion.div>
          </IconButton>
        </Tooltip>
      </Box>

      <AnimatePresence mode="wait">
        {state.status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Skeleton
              variant="text"
              sx={{ bgcolor: 'rgba(240,234,220,0.25)', fontSize: 16 }}
            />
            <Skeleton
              variant="text"
              width="70%"
              sx={{ bgcolor: 'rgba(240,234,220,0.25)', fontSize: 16 }}
            />
          </motion.div>
        )}

        {state.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertCircle size={16} color="#FFD95E" />
              <Typography sx={{ fontSize: 13.5 }}>
                Couldn't load today's quote. Tap refresh to try again.
              </Typography>
            </Box>
          </motion.div>
        )}

        {state.status === 'ready' && (
          <motion.div
            key={state.quote}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontStyle: 'italic' }}>
              "{state.quote}"
            </Typography>
            <Typography sx={{ fontSize: 12.5, opacity: 0.8, mt: 1 }}>
              — {state.author}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
