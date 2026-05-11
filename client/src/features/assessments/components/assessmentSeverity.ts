/** Single responsibility: map assessment severity labels to Badge variants. */
export const assessmentSeverityToBadgeVariant = (
  severityLevel: string,
): 'success' | 'warning' | 'error' | 'info' => {
  const level = severityLevel.toLowerCase();
  if (level.includes('none') || level.includes('minimal')) return 'success';
  if (level.includes('mild')) return 'info';
  if (level.includes('moderate')) return 'warning';
  return 'error';
};
