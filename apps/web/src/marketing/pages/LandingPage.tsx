import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@core/routing/routes';
import { Hero } from '../components/hero';
import { Personas } from '../components/personas';
import { HowItWorks } from '../components/howItWorks';
import { Features } from '../components/features';
import { StackMarquee } from '../components/stackMarquee';
import { FinalCta } from '../components/finalCta';
import { Footer } from '../components/footer';
import { useSmoothAnchorScroll } from '../hooks/useSmoothAnchorScroll';

export function LandingPage() {
  const navigate = useNavigate();
  const handleCta = () => navigate(ROUTES.public.login);
  useSmoothAnchorScroll();

  return (
    <div>
      <Hero onCta={handleCta} />
      <Personas />
      <HowItWorks />
      <Features />
      <StackMarquee />
      <FinalCta onCta={handleCta} />
      <Footer />
    </div>
  );
}
