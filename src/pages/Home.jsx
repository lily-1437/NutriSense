import { Box } from '@mui/material';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import IntroSection from '../components/IntroSection';
import SplitFeatureSection from '../components/SplitFeatureSection';
import ApproachSection from '../components/ApproachSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <Box>
      <AppNavbar />
      <HeroSection />
      <IntroSection />

      <SplitFeatureSection
        heading="Instant recipe parsing"
        body="Paste ingredients and get matched USDA nutrition data in seconds — no manual lookups, no spreadsheets."
        reverse={false}
      />
      <SplitFeatureSection
        heading="Full nutrition breakdown"
        body="Understand your meals beyond the ingredients. Each recipe is carefully analyzed to provide a comprehensive per-serving breakdown of calories, macronutrients, and essential vitamins and minerals, helping you make smarter, healthier food choices every day."
        reverse={true}
      />
      <SplitFeatureSection
        heading="Condition-aware risk flags"
        body="Warnings surface right on the results page when an ingredient conflicts with a health condition you've set."
        reverse={false}
      />

      <ApproachSection />
      <Footer />
    </Box>
  );
}
