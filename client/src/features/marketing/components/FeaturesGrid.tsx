import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MARKETING_FEATURES } from '../data/features';
import type { MarketingFeature } from '../data/features';

const cardFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const;

const stillVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
} as const;

interface FeatureCardProps {
  readonly feature: MarketingFeature;
  readonly index: number;
  readonly reducedMotion: boolean;
}

function FeatureCard({ feature, index, reducedMotion }: FeatureCardProps): React.ReactElement {
  const Icon = feature.icon;
  const variants = reducedMotion ? stillVariants : cardFadeUp;
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.5, delay: index * 0.1, ease: 'easeOut' as const };

  return (
    <motion.article
      className="feature-card"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={transition}
    >
      <div className="feature-icon" aria-hidden="true">
        <Icon style={{ width: '1.5rem', height: '1.5rem' }} strokeWidth={2} />
      </div>
      <h3
        className="font-display text-fg"
        style={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.3, marginBottom: '0.5rem' }}
      >
        {feature.title}
      </h3>
      <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.625 }}>
        {feature.description}
      </p>
    </motion.article>
  );
}

export function FeaturesGrid(): React.ReactElement {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      style={{ padding: '6rem 0', backgroundColor: 'hsl(var(--landing-bg))' }}
    >
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2
            id="features-title"
            className="font-display text-fg section-heading"
          >
            Powerful Features for Your Wellness
          </h2>
          <p
            className="text-muted"
            style={{ fontSize: '1.125rem', maxWidth: '42rem', marginInline: 'auto' }}
          >
            Everything you need to understand, track, and improve your mental wellbeing.
          </p>
        </header>

        <div className="features-grid">
          {MARKETING_FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
