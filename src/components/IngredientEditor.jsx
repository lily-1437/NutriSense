// src/components/IngredientEditor.jsx
import { List, ListItem, Typography, Slider, Stack, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../motion/variants';

// ingredients here is recipe.ingredients: [{ original, matchedItem }]
export default function IngredientEditor({ ingredients, quantities, onChange }) {
  return (
    <Box component={motion.div} variants={staggerContainer()} initial="hidden" animate="visible">
      <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2 }}>
        Adjust ingredients
      </Typography>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 1 }}>
        {ingredients.map((entry) => {
          if (!entry.matchedItem) return null;
          const key = entry.matchedItem.fdc_id;
          const baseQty = entry.original.quantity ?? 0;
          const current = quantities[key] ?? baseQty;
          const max = Math.max(baseQty * 3, baseQty + 5, 5);

          return (
            <ListItem
              key={key}
              component={motion.div}
              variants={fadeUp}
              sx={{ display: 'block', py: 1.5 }}
            >
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {entry.matchedItem.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {current} {entry.original.unit}
                </Typography>
              </Stack>
              <Slider
                value={current}
                min={0}
                max={max}
                step={entry.original.unit === 'g' || entry.original.unit === 'ml' ? 1 : 0.25}
                onChange={(_, val) => onChange(key, val)}
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-thumb': { bgcolor: 'primary.dark' },
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}