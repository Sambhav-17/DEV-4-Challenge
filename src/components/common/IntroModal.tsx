import React, { useState, useEffect, useRef } from 'react';
import { soundscape } from '../../lib/audio/soundscape';
import { ArrowRight, BookOpen, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface IntroModalProps {
  onEnter: () => void;
  onExploreArchive: () => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ onEnter, onExploreArchive }) => {
  const [step, setStep] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Floating ambient embers animation in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      pulse: number;
    }

    const colors = ['#D7AD63', '#E98B37', '#91C7D8', '#F3EBDD'];
    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.45 + 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulse += 0.02;
        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Step sequence
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 700);  // "THE MACHINE REMEMBERS."
    const t2 = setTimeout(() => setStep(2), 2200); // "BUT WHO REMEMBERS US?"
    const t3 = setTimeout(() => setStep(3), 3800); // Reveal wordmark and CTAs

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleToggleSound = () => {
    const active = soundscape.toggleSound();
    setSoundEnabled(active);
  };

  const handleSkipOrEnter = () => {
    setIsExiting(true);
    soundscape.playVeilBell();
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  const handleArchive = () => {
    setIsExiting(true);
    soundscape.playVeilBell();
    setTimeout(() => {
      onExploreArchive();
    }, 550);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#08090D] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden transition-opacity duration-600 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background animated particles canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Atmospheric radial gradient fog */}
      <div className="absolute inset-0 bg-radial from-[#101624]/60 via-[#08090D]/90 to-[#040406] opacity-90 pointer-events-none z-0" />

      {/* Top Bar Utilities */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={handleToggleSound}
          className="flex items-center gap-2 text-xs text-[#777985] hover:text-[#D7AD63] px-3 py-1.5 border border-white/10 rounded-md transition-all cursor-pointer backdrop-blur-sm bg-black/30"
          title="Toggle Ambient Audio Soundscape"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#D7AD63]" />
              <span className="text-[#D7AD63]">Sound Active</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Enable Sound</span>
            </>
          )}
        </button>

        <button
          onClick={handleSkipOrEnter}
          className="text-xs text-[#777985] hover:text-[#D7AD63] uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-md transition-all cursor-pointer backdrop-blur-sm bg-black/30"
        >
          Skip Prologue
        </button>
      </div>

      {/* Main Prologue Cinematic Container */}
      <div className="relative z-10 max-w-xl flex flex-col items-center">
        {/* Step 1: "THE MACHINE REMEMBERS." */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          } ${
            step >= 3
              ? 'text-xs text-[#777985] tracking-[0.25em]'
              : 'text-xl md:text-3xl font-display text-[#91C7D8] tracking-[0.2em] drop-shadow-[0_0_15px_rgba(145,199,216,0.3)]'
          }`}
        >
          THE MACHINE REMEMBERS.
        </div>

        {/* Step 2: "BUT WHO REMEMBERS US?" */}
        <div
          className={`mt-4 transition-all duration-1000 ease-out transform ${
            step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          } ${
            step >= 3
              ? 'text-sm text-[#E98B37] font-editorial italic'
              : 'text-2xl md:text-4xl font-display text-[#D7AD63] tracking-widest drop-shadow-[0_0_20px_rgba(215,173,99,0.4)]'
          }`}
        >
          BUT WHO REMEMBERS US?
        </div>

        {/* Step 3: AFTERLIGHT Brand Reveal & Interactive Portal */}
        <div
          className={`mt-8 transition-all duration-1000 ease-out flex flex-col items-center ${
            step >= 3 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
          }`}
        >
          {/* Luminous Archway Gate Glyph with breathing aura */}
          <div className="relative mb-6">
            <div className="w-20 h-24 border-2 border-[#D7AD63]/80 rounded-t-full flex items-center justify-center relative shadow-[0_0_35px_rgba(215,173,99,0.35)] bg-gradient-to-b from-[#D7AD63]/10 to-transparent">
              <div className="w-2.5 h-2.5 bg-[#D7AD63] rounded-full animate-ping" />
              <div className="w-1.5 h-1.5 bg-[#F3EBDD] rounded-full absolute shadow-[0_0_10px_#FFF]" />
              <div className="absolute -bottom-2 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D7AD63] to-transparent" />
            </div>
            {/* Ambient aura ring */}
            <div className="absolute -inset-2 border border-[#D7AD63]/20 rounded-t-full animate-pulse pointer-events-none" />
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-semibold text-[#F3EBDD] tracking-[0.25em] drop-shadow-[0_0_25px_rgba(243,235,221,0.2)]">
            AFTERLIGHT
          </h1>
          <p className="mt-3 text-base md:text-lg text-[#91C7D8] font-editorial italic">
            “Some things deserve to live forever.”
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={handleSkipOrEnter}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#D7AD63] text-[#08090D] font-display text-xs uppercase tracking-widest font-semibold rounded-lg hover:bg-[#e4be78] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(215,173,99,0.3)] hover:shadow-[0_0_35px_rgba(215,173,99,0.5)] cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#08090D]" />
              <span>Enter The Veil</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleArchive}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#101624] text-[#F3EBDD] font-display text-xs uppercase tracking-widest border border-white/10 rounded-lg hover:border-[#D7AD63]/60 transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-[#182136] active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-[#D7AD63]" />
              <span>Explore Archive</span>
            </button>
          </div>

          {/* Privacy & Open-Source Principle */}
          <p className="mt-8 text-[11px] text-[#777985] tracking-wider uppercase">
            Local-First Sovereign Remembrance · Zero Remote Surrender · Hacktoberfest 2026
          </p>
        </div>
      </div>
    </div>
  );
};
