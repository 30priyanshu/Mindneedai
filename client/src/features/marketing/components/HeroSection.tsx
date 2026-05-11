import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  readonly onPrimaryCta: () => void;
  readonly onWatchDemo: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
} as const;

const stillVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
} as const;

function useMotionConfig() {
  const reduced = useReducedMotion();
  return {
    variants: reduced ? stillVariants : fadeUp,
    initial: reduced ? 'visible' : ('hidden' as const),
    animate: 'visible' as const,
    transition: (delay: number) =>
      reduced ? { duration: 0 } : { duration: 0.8, delay, ease: 'easeOut' as const },
  };
}

export function HeroSection({ onPrimaryCta, onWatchDemo }: HeroSectionProps): React.ReactElement {
  const { variants, initial, animate, transition } = useMotionConfig();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 font-sans pt-28"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero_image.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-0.4 brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 pb-16 text-center max-w-5xl">

        <motion.div variants={variants} initial={initial} animate={animate} transition={transition(0)}>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-teal-400/30 bg-teal-400/10 text-teal-300 text-sm font-semibold mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            Next-Gen Mental Wellness Platform
          </span>
        </motion.div>

        <motion.h1
          id="hero-title"
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6"
          variants={variants}
          initial={initial}
          animate={animate}
          transition={transition(0.1)}
        >
          A New Paradigm for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            Mental Wellbeing
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          variants={variants}
          initial={initial}
          animate={animate}
          transition={transition(0.2)}
        >
          Harness the power of AI to understand your emotions, track your mental health, and receive
          personalized wellness insights.
        </motion.p>

        <motion.div
          variants={variants}
          initial={initial}
          animate={animate}
          transition={transition(0.3)}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          {/* Primary Button */}
          <button
            onClick={onPrimaryCta}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:scale-105 transition"
          >
            Get Started Free
          </button>

          {/* Secondary Button */}
          <button
            onClick={onWatchDemo}
            className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Watch Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}