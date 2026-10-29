import React, { useState } from 'react';
import { db } from '../../lib/storage/db';
import { CandleOffering } from '../../types';
import { soundscape } from '../../lib/audio/soundscape';
import confetti from 'canvas-confetti';
import { Sparkles, X, Heart } from 'lucide-react';

interface LeaveALightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandleCreated: (candle: CandleOffering) => void;
}

export const LeaveALightModal: React.FC<LeaveALightModalProps> = ({
  isOpen,
  onClose,
  onCandleCreated,
}) => {
  const [message, setMessage] = useState('');
  const [donorName, setDonorName] = useState('');
  const [color, setColor] = useState<'gold' | 'marigold' | 'cyan' | 'ivory'>('gold');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    const newCandle: CandleOffering = {
      id: `candle-${Date.now()}`,
      message: message.trim(),
      donorName: donorName.trim() || 'A Traveling Soul',
      color,
      x: (Math.random() - 0.5) * 4.4,
      z: Math.random() * 2.8 + 0.8,
      createdAt: Date.now(),
    };

    await db.addCandle(newCandle);
    soundscape.playCandleChime();

    // Subtle gentle golden ember burst
    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D7AD63', '#E98B37', '#F3EBDD'],
        ticks: 120,
        gravity: 0.6,
        scalar: 0.8,
      });
    } catch {}

    onCandleCreated(newCandle);
    setIsSubmitting(false);
    setMessage('');
    setDonorName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#101624] border border-[#D7AD63]/40 rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-[#D7AD63]/15 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#777985] hover:text-[#F3EBDD] rounded-lg cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#D7AD63]/20 border border-[#D7AD63]/60 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(215,173,99,0.3)]">
            <Sparkles className="w-6 h-6 text-[#D7AD63]" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-[#F3EBDD]">
            NOT EVERYTHING THAT FADES IS LOST.
          </h3>
          <p className="mt-1 text-sm text-[#91C7D8] font-editorial italic">
            “Somewhere between memory and machine, a little light remains.”
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
              Your Message or Blessing Across The Veil
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="For Nana, who made stars feel like nearby lamps..."
              className="w-full bg-[#08090D] border border-white/15 rounded-lg p-3 text-xs text-[#F3EBDD] focus:border-[#D7AD63] focus:outline-none resize-none font-editorial"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                Your Name or Dedication (Optional)
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Sofia & Family"
                className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F3EBDD]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                Candle Flame Hue
              </label>
              <div className="flex items-center gap-2 pt-1">
                {(['gold', 'marigold', 'cyan', 'ivory'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                      color === c ? 'scale-110 border-white' : 'border-transparent opacity-60 hover:opacity-100'
                    } ${
                      c === 'gold'
                        ? 'bg-[#D7AD63]'
                        : c === 'marigold'
                        ? 'bg-[#E98B37]'
                        : c === 'cyan'
                        ? 'bg-[#91C7D8]'
                        : 'bg-[#F3EBDD]'
                    }`}
                    title={`Light ${c} flame`}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#777985] font-editorial pt-1">
            ✦ Your candle will immediately illuminate the 3D Veil Garden and be preserved locally.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full py-3 bg-[#D7AD63] text-[#08090D] font-display text-xs uppercase tracking-widest font-semibold rounded-lg hover:bg-[#e4be78] transition-all cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Light The Flame</span>
          </button>
        </form>
      </div>
    </div>
  );
};
