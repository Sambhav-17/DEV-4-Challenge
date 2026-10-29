import React from 'react';
import { ShieldCheck, Cpu, HardDrive, Share2, HeartHandshake, Sparkles } from 'lucide-react';

interface AboutManifestoProps {
  onOpenLeaveLight: () => void;
  onNavigateToAiLab: () => void;
}

export const AboutManifesto: React.FC<AboutManifestoProps> = ({
  onOpenLeaveLight,
  onNavigateToAiLab,
}) => {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 py-16">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.25em] text-[#D7AD63]">
          Section G · Manifesto & Philosophy
        </span>
        <h2 className="mt-2 text-3xl md:text-5xl font-display font-semibold text-[#F3EBDD]">
          Why Open Innovation Matters
        </h2>
        <p className="mt-3 text-base text-[#91C7D8] max-w-2xl mx-auto font-editorial italic">
          “Memories are not training tokens. They are sacred human footprints.”
        </p>
      </div>

      {/* Six Pillars of AFTERLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#D7AD63] font-mono text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>1. Zero Remote Surrender</span>
          </div>
          <h3 className="text-lg font-display text-[#F3EBDD]">Your Memory Belongs to You</h3>
          <p className="text-xs text-[#777985] font-editorial leading-relaxed">
            Personal remembrances, family letters, and ancestral portraits are stored in client-side IndexedDB on your device. You are never forced to surrender intimate family history to an opaque remote server.
          </p>
        </div>

        <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#91C7D8] font-mono text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>2. Sovereign Local Inference</span>
          </div>
          <h3 className="text-lg font-display text-[#F3EBDD]">The Machine Runs in Your Home</h3>
          <p className="text-xs text-[#777985] font-editorial leading-relaxed">
            By pairing standard Ollama protocol with open-weight models like Qwen 2.5 and Mistral 7B, the AI model generates stories on your CPU/GPU. No telemetry, no centralized logging.
          </p>
        </div>

        <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#E98B37] font-mono text-xs uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>3. Immortal Data Portability</span>
          </div>
          <h3 className="text-lg font-display text-[#F3EBDD]">Surviving the Death of Platforms</h3>
          <p className="text-xs text-[#777985] font-editorial leading-relaxed">
            Services shut down, servers sunset, and startups pivot. With one click, download your entire memorial archive as standardized, human-readable JSON. Your memories survive even if AFTERLIGHT disappears.
          </p>
        </div>

        <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#F3EBDD] font-mono text-xs uppercase tracking-wider">
            <Share2 className="w-4 h-4" />
            <span>4. Model Interoperability</span>
          </div>
          <h3 className="text-lg font-display text-[#F3EBDD]">Provider Independence</h3>
          <p className="text-xs text-[#777985] font-editorial leading-relaxed">
            AFTERLIGHT uses open REST schemas. Switch between Ollama, vLLM, LM Studio, or community fine-tunes without re-architecting your memorial. True open standards protect against vendor lock-in.
          </p>
        </div>
      </div>

      {/* Cultural Respect Statement */}
      <div className="bg-[#08090D] border border-[#D7AD63]/30 rounded-2xl p-8 text-center space-y-4 mb-12">
        <HeartHandshake className="w-8 h-8 text-[#D7AD63] mx-auto" />
        <h3 className="text-xl font-display text-[#F3EBDD]">A Sacred Digital Tradition</h3>
        <p className="text-xs sm:text-sm text-[#777985] font-editorial max-w-2xl mx-auto leading-relaxed">
          The Ofrenda feature is inspired respectfully by Día de los Muertos—a Mexican celebration recognizing that death is a natural chapter of the human journey. AFTERLIGHT is not an occult tool; it is a living vessel of art, love, and community preservation.
        </p>
      </div>

      {/* The Final Moment Call to Action */}
      <div className="text-center space-y-4 pt-8 border-t border-white/10">
        <h3 className="text-2xl sm:text-3xl font-display font-semibold text-[#F3EBDD]">
          NOT EVERYTHING THAT FADES IS LOST.
        </h3>
        <p className="text-sm text-[#91C7D8] font-editorial italic">
          “Somewhere between memory and machine, a little light remains.”
        </p>
        <button
          onClick={onOpenLeaveLight}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#D7AD63] text-[#08090D] font-display text-xs uppercase tracking-widest font-semibold rounded-lg hover:bg-[#e4be78] transition-all cursor-pointer shadow-lg mt-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Leave A Light</span>
        </button>
      </div>
    </section>
  );
};
