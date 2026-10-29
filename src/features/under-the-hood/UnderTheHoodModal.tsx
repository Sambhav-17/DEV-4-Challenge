import React, { useState } from 'react';
import { db } from '../../lib/storage/db';
import { soundscape } from '../../lib/audio/soundscape';
import {
  Info,
  X,
  Zap,
  Shield,
  Cpu,
  Database,
  RotateCcw,
  ExternalLink,
  Check,
  RefreshCw,
  Download,
} from 'lucide-react';

interface UnderTheHoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoReset: () => void;
  onNavigateToAiLab: () => void;
}

export const UnderTheHoodModal: React.FC<UnderTheHoodModalProps> = ({
  isOpen,
  onClose,
  onDemoReset,
  onNavigateToAiLab,
}) => {
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setIsPinging(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResponse(`[${data.model} · ${data.latencyMs}ms]: "${data.text}"`);
      } else {
        setTestResponse(`[Status]: ${data.error || 'Server responded with error'}`);
      }
    } catch {
      setTestResponse('[Network Error]: Could not reach backend.');
    } finally {
      setIsPinging(false);
    }
  };

  const handleResetData = async () => {
    await db.resetDemoData();
    soundscape.playCandleChime();
    setResetSuccess(true);
    onDemoReset();
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#101624] border border-[#D7AD63]/40 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#D7AD63]" />
            <h3 className="text-xl font-display text-[#F3EBDD]">
              Under The Hood: Judge Briefing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777985] hover:text-[#F3EBDD] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 60-Second Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#08090D] border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#D7AD63] font-mono">
              <Cpu className="w-4 h-4" />
              <span>Inference Engine</span>
            </div>
            <p className="text-[#F3EBDD] font-semibold">Qwen 2.5 (7B-Instruct) / Ollama</p>
            <p className="text-[#777985] font-editorial">
              True open-source (Apache 2.0). Runs locally on hardware with standard Ollama protocol.
            </p>
          </div>

          <div className="bg-[#08090D] border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <Shield className="w-4 h-4" />
              <span>Privacy & Storage</span>
            </div>
            <p className="text-[#F3EBDD] font-semibold">100% Client-Side IndexedDB</p>
            <p className="text-[#777985] font-editorial">
              Photographs, audio memos, and personal letters never leave the user's browser device.
            </p>
          </div>

          <div className="bg-[#08090D] border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#91C7D8] font-mono">
              <Database className="w-4 h-4" />
              <span>Data Sovereignty</span>
            </div>
            <p className="text-[#F3EBDD] font-semibold">JSON Export & Validated Import</p>
            <p className="text-[#777985] font-editorial">
              Complete archive backups can be downloaded and restored anywhere without vendor dependency.
            </p>
          </div>

          <div className="bg-[#08090D] border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#E98B37] font-mono">
              <Zap className="w-4 h-4" />
              <span>3D World & Sound</span>
            </div>
            <p className="text-[#F3EBDD] font-semibold">Three.js + Procedural Web Audio</p>
            <p className="text-[#777985] font-editorial">
              Zero 404 dependencies: procedural stone, marigolds, particles, and synthesized bell acoustics.
            </p>
          </div>
        </div>

        {/* Live Test Trigger for Judges */}
        <div className="bg-[#08090D] border border-[#D7AD63]/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#D7AD63]">
              1-Click Live AI Demonstration
            </span>
            <button
              onClick={handleTestPing}
              disabled={isPinging}
              className="px-3.5 py-1.5 bg-[#D7AD63] text-[#08090D] text-xs font-semibold rounded-lg hover:bg-[#e4be78] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isPinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{isPinging ? 'Pinging...' : 'Execute Test Ping'}</span>
            </button>
          </div>

          {testResponse && (
            <p className="p-2.5 bg-[#101624] border border-white/10 rounded text-xs font-mono text-emerald-300">
              {testResponse}
            </p>
          )}
        </div>

        {/* Demo Mode & Reset Data */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#777985]">
            <p className="font-semibold text-[#F3EBDD]">Demonstration State</p>
            <p>Separates sample demo records from user-created entries.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/afterlight-source.zip"
              download="afterlight-source.zip"
              className="px-3 py-1.5 bg-[#D7AD63] text-[#08090D] font-semibold text-xs rounded-lg hover:bg-[#e4be78] transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Source (.zip)</span>
            </a>

            <button
              onClick={handleResetData}
              className="px-3 py-1.5 bg-[#08090D] border border-white/15 text-xs text-[#F3EBDD] hover:border-[#D7AD63] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {resetSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>{resetSuccess ? 'Demo Reset' : 'Reset Demo Data'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateToAiLab();
              }}
              className="px-3 py-1.5 bg-[#101624] border border-[#91C7D8]/40 text-xs text-[#91C7D8] hover:bg-[#18233a] rounded-lg transition-colors cursor-pointer"
            >
              AI Lab Settings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
