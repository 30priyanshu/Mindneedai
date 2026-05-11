import React from 'react';

export function MarketingFooter(): React.ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer
      className="border-landing"
      style={{
        padding: '2.5rem 0',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        backgroundColor: 'hsl(var(--landing-bg))',
      }}
    >
      <div
        className="container text-muted"
        style={{ textAlign: 'center', fontSize: '0.875rem' }}
      >
        © {year} MindNeed AI. All rights reserved. Built with care for your wellbeing.
      </div>
    </footer>
  );
}
