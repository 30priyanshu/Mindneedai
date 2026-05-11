import React from 'react';
import { HelpCircle, MessageSquare, Mail, ExternalLink } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does the AI emotional analysis work?',
    answer:
      'MindNeedAI uses advanced machine learning models trained on clinical datasets to analyze the emotional content of your text, speech, or facial expressions. The AI detects patterns and provides insights without storing or sharing your data beyond your encrypted session.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. All analysis data is encrypted in transit and at rest. Your data is never sold or shared with third parties. Only your connected doctor (if any) can access your health records with your consent.',
  },
  {
    question: 'How do I connect with a doctor?',
    answer:
      'Go to Profile → Connect with a Doctor. You can enter your doctor\'s email address or the clinic code they provide. Once connected, your doctor can request assessments and view your analysis history.',
  },
  {
    question: 'What are PHQ-9 and GAD-7 assessments?',
    answer:
      'PHQ-9 (Patient Health Questionnaire) measures depression severity. GAD-7 (Generalized Anxiety Disorder) measures anxiety levels. These are standardized clinical tools your doctor may request to track your mental health over time.',
  },
  {
    question: 'Why was my analysis flagged for human review?',
    answer:
      'When the AI detects high clinical significance or low confidence in its assessment, it flags the result for a mental health professional to review. This ensures you receive the best possible care and isn\'t a cause for alarm.',
  },
  {
    question: 'How accurate is the AI?',
    answer:
      'Our models achieve competitive accuracy on benchmark datasets, but AI is always an assistive tool — not a replacement for professional mental healthcare. When results are uncertain, the system always recommends consulting a professional.',
  },
];

export default function HelpPage(): React.ReactElement {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <HelpCircle className="w-5 h-5 text-green-500" />
        <h1 className="text-2xl md:text-3xl font-bold text-white">Help & Support</h1>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-start justify-between gap-4 p-5 text-left"
                aria-expanded={openIdx === idx}
              >
                <span className="font-medium text-white text-sm">{faq.question}</span>
                <span className={`text-green-500 flex-shrink-0 transition-transform duration-200 ${openIdx === idx ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openIdx === idx && (
                <div className="px-5 pb-5 text-sm text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <h2 className="font-semibold text-white">Still need help?</h2>
        <p className="text-sm text-neutral-400">
          Our support team is here for you. Reach out via email or chat and we'll respond within 24 hours.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href="mailto:support@mindneedai.com"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 text-sm transition-all"
          >
            <Mail className="w-4 h-4" />
            support@mindneedai.com
          </a>
          <a
            href="https://mindneedai.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 text-sm transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Documentation
          </a>
        </div>
      </div>

      {/* Emergency */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-red-400">Mental Health Crisis?</h3>
        </div>
        <p className="text-sm text-neutral-300 mb-3">
          If you or someone you know is in immediate danger, please contact emergency services.
        </p>
        <ul className="text-sm text-neutral-400 space-y-1">
          <li>🇺🇸 National Suicide Prevention Lifeline: <strong className="text-white">988</strong></li>
          <li>🌍 Crisis Text Line: Text <strong className="text-white">HOME</strong> to <strong className="text-white">741741</strong></li>
          <li>🚨 Emergency Services: <strong className="text-white">911 / 999 / 112</strong></li>
        </ul>
      </div>
    </div>
  );
}
