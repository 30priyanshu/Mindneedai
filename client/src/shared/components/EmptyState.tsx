import { ReactNode } from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <Card className="text-center py-12">
    <div className="flex flex-col items-center gap-4">
      <div className="text-neutral-400">{icon}</div>
      <div>
        <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">{description}</p>
      </div>
    </div>
  </Card>
);
