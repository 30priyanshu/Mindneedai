import { Activity, BarChart3, Brain, Shield, Sparkles, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MarketingFeature {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

export const MARKETING_FEATURES: readonly MarketingFeature[] = [
  {
    id: 'analysis',
    icon: Brain,
    title: 'AI-Powered Analysis',
    description:
      'Advanced neural networks analyze your emotions through text, video, and audio in real-time.',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Your mental health data is encrypted with military-grade AES-256 encryption.',
  },
  {
    id: 'insights',
    icon: BarChart3,
    title: 'Deep Insights',
    description:
      'Track your emotional patterns over time with beautiful, interactive visualizations.',
  },
  {
    id: 'video',
    icon: Video,
    title: 'Video Emotion Detection',
    description:
      'Real-time facial emotion recognition powered by cutting-edge computer vision.',
  },
  {
    id: 'metrics',
    icon: Activity,
    title: 'Health Metrics',
    description:
      'Monitor stress, mood trends, and wellness scores all in one unified dashboard.',
  },
  {
    id: 'personalized',
    icon: Sparkles,
    title: 'Personalized Tips',
    description:
      'AI-curated wellness recommendations tailored to your unique emotional profile.',
  },
] as const;
