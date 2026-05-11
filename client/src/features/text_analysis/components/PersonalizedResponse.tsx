import React from 'react';
import { Heart } from 'lucide-react';

interface PersonalizedResponseProps {
  response: string;
}

export const PersonalizedResponse: React.FC<PersonalizedResponseProps> = ({ response }) => {
  if (!response) return null;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5 text-green-500" strokeWidth={2} />
        </div>
        <div>
          <h4 className="font-semibold text-white">Personalized Response</h4>
          <p className="text-xs text-neutral-400 mt-0.5">AI-generated care message for you</p>
        </div>
      </div>
      <p className="text-sm text-neutral-300 leading-relaxed">{response}</p>
    </div>
  );
};
