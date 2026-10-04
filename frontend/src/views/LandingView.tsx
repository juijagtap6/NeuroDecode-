import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustedStatement } from '../components/landing/TrustedStatement';
import { ModuleShowcase } from '../components/landing/ModuleShowcase';
import { ProductVisualization } from '../components/landing/ProductVisualization';
import { HowItWorks } from '../components/landing/HowItWorks';
import { ScientificCapabilities } from '../components/landing/ScientificCapabilities';
import { FinalCta } from '../components/landing/FinalCta';
import { Footer } from '../components/landing/Footer';
import { AuthModal } from '../components/auth/AuthModal';

interface LandingViewProps {
  onLaunchApp: (targetModule?: 'explorer' | 'decoder' | 'simulation' | 'comparison') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLaunchApp }) => {
  const { tokens } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLaunch = () => {
    onLaunchApp('explorer');
  };

  const handleSelectModule = (moduleId?: 'explorer' | 'decoder' | 'simulation' | 'comparison') => {
    onLaunchApp(moduleId || 'explorer');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.bg,
        color: tokens.text,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* 1. Sticky Navigation Bar */}
      <LandingNavbar
        onOpenAuth={() => setShowAuthModal(true)}
        onLaunch={handleSelectModule}
      />

      {/* Main Page Flow */}
      <main style={{ flex: 1 }}>
        {/* 2. Cinematic Hero Section */}
        <HeroSection
          onLaunch={handleLaunch}
          onExploreModules={() => {
            const el = document.getElementById('modules');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* 3. Scientific Trust & Technical Statement */}
        <TrustedStatement />

        {/* 4. Four Core Module Showcase */}
        <ModuleShowcase onSelectModule={handleSelectModule} />

        {/* 5. Product Visualization & Telemetry Console */}
        <ProductVisualization />

        {/* 6. How NeuroDecode Works Pipeline */}
        <HowItWorks onSelectStep={handleSelectModule} />

        {/* 7. Computational Neuroscience Capabilities */}
        <ScientificCapabilities />

        {/* 8. Final Call to Action */}
        <FinalCta onLaunch={handleLaunch} onOpenAuth={() => setShowAuthModal(true)} />
      </main>

      {/* 9. Scientific Platform Footer */}
      <Footer onSelectModule={handleSelectModule} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          onLaunchApp('explorer');
        }}
      />
    </div>
  );
};
