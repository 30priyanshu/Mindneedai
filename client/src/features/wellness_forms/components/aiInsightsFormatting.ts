/** Single responsibility: normalize AI summary markdown noise for display. */
export const cleanInsightSummaryText = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .replace(/^['"]{3,}/gm, '')
    .replace(/['"]{3,}$/gm, '')
    .replace(/^'''[\w]*\n?/gm, '')
    .replace(/\n?'''$/gm, '')
    .trim();
};

/** Single responsibility: human-readable date for insight metadata. */
export const formatInsightDisplayDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};
