import { useNavigate } from 'react-router-dom'

import { Features } from '../components/features'
import { FinalCta } from '../components/finalCta'
import { Footer } from '../components/footer'
import { Hero } from '../components/hero'
import { HowItWorks } from '../components/howItWorks'
import { Personas } from '../components/personas'
import { StackMarquee } from '../components/stackMarquee'
import { useSmoothAnchorScroll } from '../hooks/useSmoothAnchorScroll'

/** Landing marketing publique : enchaîne les sections et route les CTA vers la connexion. */
export function LandingPage() {
  const navigate = useNavigate()
  const handleCta = (): void => {
    void navigate('/login')
  }
  useSmoothAnchorScroll()

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
  )
}
