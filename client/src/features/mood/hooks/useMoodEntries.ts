import { useQuery } from '@tanstack/react-query';
import { moodApi } from '../services/moodService';

export const useMoodEntries = () =>
  useQuery({
    queryKey: ['mood', 'entries'],
    queryFn: () => moodApi.getEntries(),
  });

