/** Single responsibility: short subtitle copy based on detected emotion. */
export const videoContentDescription = (emotion: string): string => {
  const descriptions: Record<string, string> = {
    happy: 'Uplifting wellness content',
    sad: 'Comforting guidance',
    angry: 'Calming exercises',
    neutral: 'Balanced practice',
    fear: 'Soothing techniques',
    anxious: 'Relaxation methods',
    surprise: 'Gentle activities',
    disgust: 'Restorative content',
  };
  return descriptions[emotion.toLowerCase()] ?? 'Wellness guidance';
};
