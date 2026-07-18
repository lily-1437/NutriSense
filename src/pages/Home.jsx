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
        heading="Meal That Fits Your Lifestyle"
        body="Healthy eating looks different for everyone. Build meal plans tailored to your tastes, goals, and lifestyle, making every meal a simple step toward a healthier, happier you."
        reverse={false}
      />
      <SplitFeatureSection
        heading="Know What's on Your Plate"
        body="Understand your meals beyond the ingredients. Each recipe is carefully analyzed to provide a comprehensive per-serving breakdown of calories, macronutrients, and essential vitamins and minerals, helping you make smarter, healthier food choices every day."
        reverse={true}
      />
      <SplitFeatureSection
        heading="Things to Watch For Your Health"
        body="Smart health alerts help you spot ingredients that may conflict with your dietary needs before you eat. With a tailored dashboard, you can analyze and compare meals, monitor nutrition, manage health conditions, and set personalized rules to make healthier choices with confidence."
        reverse={false}
      />

      <ApproachSection />
      <Footer />
    </Box>
  );
}
