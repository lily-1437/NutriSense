import { Box } from '@mui/material';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import FeatureCards from '../components/FeatureCards';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <Box>
      <AppNavbar />
      <HeroSection />
      <FeatureCards />
      <Footer />
    </Box>
  );
}
