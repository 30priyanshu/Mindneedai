import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CtaSectionProps {
  readonly onCta: () => void;
}

export function CtaSection({ onCta }: CtaSectionProps): React.ReactElement {
  return (
    <section
      aria-labelledby="cta-title"
      className="gradient-hero"
      style={{ position: 'relative', padding: '5rem 0', overflow: 'hidden' }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h2
          id="cta-title"
          className="font-display text-on-dark section-heading"
        >
          Ready to Transform Your Mental Wellness?
        </h2>
        <p
          className="text-on-dark-muted"
          style={{ fontSize: '1.125rem', marginBottom: '2rem' }}
        >
          Join thousands of users already benefiting from AI-powered mental health insights.
        </p>
        <button
          type="button"
          className="btn btn-lg btn-primary btn-cta-xl"
          onClick={onCta}
        >
          Start Your Journey
          <ArrowRight
            className="btn-icon-trailing"
            style={{ width: '1.25rem', height: '1.25rem' }}
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}
