import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

type AnalysisModality = 'text' | 'video' | 'audio';

const modalityLabels: Record<AnalysisModality, string> = {
  text: 'Text',
  video: 'Video',
  audio: 'Audio',
};

export const useAnalysisNotification = () => {
  const { addNotification } = useNotifications();

  const notifyAnalysisComplete = useCallback(
    (type: AnalysisModality, emotion: string) => {
      addNotification({
        type: 'analysis',
        title: `${modalityLabels[type]} Analysis Complete`,
        message: `Your ${type} analysis has completed successfully. Detected emotion: ${emotion}`,
        action_url: '/history',
      });
    },
    [addNotification]
  );

  const notifyAnalysisError = useCallback(
    (type: AnalysisModality, error: string) => {
      addNotification({
        type: 'error',
        title: `${modalityLabels[type]} Analysis Failed`,
        message: `Failed to analyze ${type}: ${error}`,
      });
    },
    [addNotification]
  );

  return { notifyAnalysisComplete, notifyAnalysisError };
};
