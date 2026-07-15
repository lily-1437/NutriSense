import { Box, Container, Grid, Card, CardContent, Typography, Grow } from '@mui/material';
import { ScanLine, Activity, ShieldAlert, CalendarRange } from 'lucide-react';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Instant Recipe Parsing',
    description: 'Paste any recipe and get ingredients matched against USDA nutrition data in seconds.',
  },
  {
    icon: Activity,
    title: 'Full Nutrition Breakdown',
    description: 'See calories, macros, and micronutrients per serving, not just per recipe.',
  },
  {
    icon: ShieldAlert,
    title: 'Condition-Aware Risk Flags',
    description: 'Get warnings on ingredients that may conflict with your health conditions.',
  },
  {
    icon: CalendarRange,
    title: 'AI-Generated Meal Plans',
    description: 'Weekly plans with exercise and health tips, tailored to your goals.',
  },
];

export default function FeatureCards() {
  return (
    <Box sx={{ bgcolor: 'background.default', py: 10 }}>
      <Container maxWidth="md">
        <Grid container spacing={3}>
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} key={feature.title}>
                <Grow in timeout={400 + idx * 100}>
                  <Card
                    elevation={1}
                    sx={{
                      borderRadius: '16px',
                      height: '100%',
                      p: 1,
                      transition: 'box-shadow 200ms ease, transform 200ms ease',
                      '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardContent>
                      <Icon size={28} color="#576238" />
                      <Typography
                        variant="h3"
                        sx={{
                          fontFamily: '"Special Gothic Expanded One", sans-serif',
                          fontSize: 20,
                          mt: 1.5,
                          mb: 1,
                          color: 'text.primary',
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: '"Special Gothic", sans-serif' }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
