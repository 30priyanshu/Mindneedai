import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingNavbar } from '../components/MarketingNavbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { CtaSection } from '../components/CtaSection';
import { MarketingFooter } from '../components/MarketingFooter';
import '../landing.css';

const FEATURES_ANCHOR = 'features';
const LOGIN_PATH = '/login';

export default function LandingPage(): React.ReactElement {
  const navigate = useNavigate();

  useEffect(() => {
    const previous = document.title;
    document.title = 'MindNeed AI — A New Paradigm for Mental Wellbeing';
    return () => {
      document.title = previous;
    };
  }, []);

  const goToLogin = useCallback((): void => {
    navigate(LOGIN_PATH);
  }, [navigate]);

  const scrollToFeatures = useCallback((): void => {
    const target = document.getElementById(FEATURES_ANCHOR);
    if (!target) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }, []);

  return (
    <div className="landing-scope" style={{ minHeight: '100vh' }}>
      <MarketingNavbar onSignIn={goToLogin} onGetStarted={goToLogin} />
      <main>
        <HeroSection onPrimaryCta={goToLogin} onWatchDemo={scrollToFeatures} />
        <FeaturesGrid />
        <CtaSection onCta={goToLogin} />
      </main>
      <MarketingFooter />
    </div>
  );
}
