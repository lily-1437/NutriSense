import { Box } from '@mui/material';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import IntroSection from '../components/IntroSection';
import SplitFeatureSection from '../components/SplitFeatureSection';
import ApproachSection from '../components/ApproachSection';

export default function Home() {
  return (
    <Box>
      <AppNavbar />
      <HeroSection />
      <IntroSection />

      <SplitFeatureSection
        image={
          <img
            src="../assets/feat_4.jpg"
            alt="Meal that fits your lifestyle"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
          />
        }
        heading="Meal That Fits Your Lifestyle"
        body="Healthy eating looks different for everyone. Build meal plans tailored to your tastes, goals, and lifestyle, making every meal a simple step toward a healthier, happier you."
        reverse={false}
      />
      <SplitFeatureSection
        image={
          <img
            src="../assets/feat_2.jpg"
            alt="Know what's on your plate"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
          />
        }
        heading="Know What's on Your Plate"
        body="Understand your meals beyond the ingredients. Each recipe is carefully analyzed to provide a comprehensive per-serving breakdown of calories, macronutrients, and essential vitamins and minerals, helping you make smarter, healthier food choices every day."
        reverse={true}
      />
      <SplitFeatureSection
        image={
          <img
            src="../assets/feat_1.jpg"
            alt="Things to watch for your health"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
          />
        }
        heading="Things to Watch For Your Health"
        body="Smart health alerts help you spot ingredients that may conflict with your dietary needs before you eat. With a tailored dashboard, you can analyze and compare meals, monitor nutrition, manage health conditions, and set personalized rules to make healthier choices with confidence."
        reverse={false}
      />

      {/* ApproachSection now also renders the stats block + footer bar
          that used to live in a separate <Footer /> component. */}
      <ApproachSection />
    </Box>
  );
}
