/** Single responsibility: Tailwind classes for severity styling in assessment modals. */

export const modalSeverityTextClass = (level: string): string => {
  const l = level.toLowerCase();
  if (l.includes('minimal') || l.includes('none')) return 'text-green-600 dark:text-green-400';
  if (l.includes('mild')) return 'text-yellow-600 dark:text-yellow-400';
  if (l.includes('moderate') && !l.includes('severe')) return 'text-orange-600 dark:text-orange-400';
  if (l.includes('severe') || l.includes('moderately')) return 'text-red-600 dark:text-red-400';
  return 'text-neutral-600 dark:text-neutral-400';
};

export const modalSeveritySurfaceClass = (level: string): string => {
  const l = level.toLowerCase();
  if (l.includes('minimal') || l.includes('none')) {
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  }
  if (l.includes('mild')) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
  if (l.includes('moderate') && !l.includes('severe')) {
    return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
  }
  if (l.includes('severe') || l.includes('moderately')) {
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  }
  return 'bg-neutral-50 dark:bg-dark-card border-neutral-200 dark:border-dark-border';
};
