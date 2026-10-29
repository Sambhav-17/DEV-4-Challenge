import React, { useState, useEffect } from 'react';
import { soundscape } from '../../lib/audio/soundscape';
import { ArrowRight, BookOpen, Volume2 } from 'lucide-react';

interface IntroModalProps {
  onEnter: () => void;
  onExploreArchive: () => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ onEnter, onExploreArchive }) => {
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    // Step sequence
    const t1 = setTimeout(() => setStep(1), 800);  // "THE MACHINE REMEMBERS."
    const t2 = setTimeout(() => setStep(2), 2400); // "BUT WHO REMEMBERS US?"
    const t3 = setTimeout(() => setStep(3), 4000); // Reveal wordmark and CTAs

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleSkipOrEnter = () => {
    try {
      localStorage.setItem('afterlight_intro_seen', 'true');
    } catch {}
    soundscape.playVeilBell();
    onEnter();
  };

  const handleArchive = () => {
    try {
      localStorage.setItem('afterlight_intro_seen', 'true');
    } catch {}
    soundscape.playVeilBell();
    onExploreArchive();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08090D] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Subtle background ambient fog */}
      <div className="absolute inset-0 bg-radial from-[#101624] via-[#08090D] to-black opacity-80" />

      {/* Skip button top right */}
      <button
        onClick={handleSkipOrEnter}
        className="absolute top-6 right-6 text-xs text-[#777985] hover:text-[#D7AD63] uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-md transition-colors cursor-pointer z-20"
      >
        Skip Prologue
      </button>

      {/* Main Container */}
      <div className="relative z-10 max-w-xl flex flex-col items-center">
        {/* Step 1: "THE MACHINE REMEMBERS." */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } ${step >= 3 ? 'text-xs text-[#777985]' : 'text-xl md:text-2xl font-display text-[#91C7D8]'}`}
        >
          THE MACHINE REMEMBERS.
        </div>

        {/* Step 2: "BUT WHO REMEMBERS US?" */}
        <div
          className={`mt-4 transition-all duration-1000 ease-out transform ${
            step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } ${step >= 3 ? 'text-sm text-[#E98B37] font-editorial italic' : 'text-2xl md:text-3xl font-display text-[#D7AD63]'}`}
        >
          BUT WHO REMEMBERS US?
        </div>

        {/* Step 3: AFTERLIGHT Brand Reveal & CTAs */}
        <div
          className={`mt-8 transition-all duration-1000 ease-out flex flex-col items-center ${
            step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Luminous Gate Icon / Glyphs */}
          <div className="w-16 h-20 mb-6 border-2 border-[#D7AD63]/60 rounded-t-full flex items-center justify-center relative shadow-[0_0_25px_rgba(215,173,99,0.25)]">
            <div className="w-2 h-2 bg-[#D7AD63] rounded-full animate-ping" />
            <div className="absolute -bottom-2 w-20 h-[1px] bg-[#D7AD63]/80" />
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-semibold text-[#F3EBDD] tracking-widest">
            AFTERLIGHT
          </h1>
          <p className="mt-2 text-sm text-[#91C7D8] font-editorial italic">
            “Some things deserve to live forever.”
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={handleSkipOrEnter}
              className="w-full sm:w-auto px-6 py-3 bg-[#D7AD63] text-[#08090D] font-display text-xs uppercase tracking-widest font-semibold rounded-lg hover:bg-[#e4be78] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Enter The Veil</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleArchive}
              className="w-full sm:w-auto px-6 py-3 bg-[#101624] text-[#F3EBDD] font-display text-xs uppercase tracking-widest border border-white/10 rounded-lg hover:border-[#D7AD63]/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#D7AD63]" />
              <span>Explore Archive</span>
            </button>
          </div>

          {/* Philosophy declaration */}
          <p className="mt-8 text-xs text-[#777985] tracking-wide">
            YOUR MEMORIES STAY YOURS · ZERO REMOTE SURRENDER
          </p>
        </div>
      </div>
    </div>
  );
};
