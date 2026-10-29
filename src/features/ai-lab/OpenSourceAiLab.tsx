import React, { useState, useEffect } from 'react';
import { ModelInfo, AIBackendStatus } from '../../types';
import {
  Cpu,
  Server,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Terminal,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  Sliders,
} from 'lucide-react';

export const OpenSourceAiLab: React.FC = () => {
  const [statusData, setStatusData] = useState<AIBackendStatus | null>(null);
  const [modelsList, setModelsList] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:7b-instruct');
  const [customEndpoint, setCustomEndpoint] = useState<string>('http://localhost:11434');

  // Test prompt state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    source?: string;
    model?: string;
    latencyMs?: number;
    text?: string;
    error?: string;
  } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Fetch status & models
  const refreshStatus = async () => {
    try {
      const [resStatus, resModels] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/models'),
      ]);
      const dataStatus = await resStatus.json();
      const dataModels = await resModels.json();

      setStatusData(dataStatus);
      setModelsList(dataModels.models || []);
      setSelectedModel(dataStatus.model || 'qwen2.5:7b-instruct');
      setCustomEndpoint(dataStatus.endpoint || 'http://localhost:11434');
    } catch {
      setStatusData({
        status: 'unavailable',
        endpoint: customEndpoint,
        model: selectedModel,
        provider: 'ollama',
        message: 'Could not contact server API daemon.',
      });
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleRunLiveTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: 'Network error calling /api/ai/test: ' + err.message,
      });
    } finally {
      setIsTesting(false);
      refreshStatus();
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingConfig(true);
    try {
      await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          model: selectedModel,
        }),
      });
      await refreshStatus();
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-[#91C7D8]">
          Section F · Hacktoberfest AI Systems Architecture
        </span>
        <h2 className="mt-2 text-3xl md:text-5xl font-display font-semibold text-[#F3EBDD]">
          Open-Source AI Lab
        </h2>
        <p className="mt-3 text-sm md:text-base text-[#777985] max-w-2xl mx-auto font-editorial italic">
          Preserving human memory through verifiable, open-weight language models run on local hardware. No surveillance, no vendor lock-in.
        </p>
      </div>

      {/* 1. ARCHITECTURE VISUALIZATION DIAGRAM */}
      <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-6 md:p-8 mb-8 shadow-2xl">
        <h3 className="text-xs uppercase tracking-wider text-[#D7AD63] font-mono mb-4 flex items-center gap-2">
          <Server className="w-4 h-4" />
          <span>Local-First Inference Pipeline Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
          {/* Step 1 */}
          <div className="bg-[#08090D] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#777985] font-mono">Layer 1</span>
            <div className="my-2">
              <h4 className="font-semibold text-[#F3EBDD] text-sm">User Interface</h4>
              <p className="text-[11px] text-[#777985] mt-1 font-editorial">React + 3D Memorial Altar & Veil Garden</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">100% Client-Side</span>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center text-[#D7AD63] font-mono">
            →
          </div>

          {/* Step 2 */}
          <div className="bg-[#08090D] border border-[#D7AD63]/30 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#D7AD63] font-mono">Layer 2</span>
            <div className="my-2">
              <h4 className="font-semibold text-[#F3EBDD] text-sm">Local Storage & DB</h4>
              <p className="text-[11px] text-[#777985] mt-1 font-editorial">Browser IndexedDB Private Vault</p>
            </div>
            <span className="text-[10px] text-[#D7AD63] font-mono">Zero Remote Upload</span>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center text-[#D7AD63] font-mono">
            →
          </div>

          {/* Step 3 */}
          <div className="bg-[#08090D] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#91C7D8] font-mono">Layer 3</span>
            <div className="my-2">
              <h4 className="font-semibold text-[#F3EBDD] text-sm">Model Adapter</h4>
              <p className="text-[11px] text-[#777985] mt-1 font-editorial">Server-side proxy to Ollama / vLLM</p>
            </div>
            <span className="text-[10px] text-[#91C7D8] font-mono">Open Protocol</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#777985]">
          <span>Protocol: HTTP JSON / Streaming SSE over REST</span>
          <span className="font-mono text-[#D7AD63]">Default Target: http://localhost:11434 (Ollama)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        {/* 2. REAL BACKEND STATUS & LIVE PING TEST (7 cols) */}
        <div className="lg:col-span-7 bg-[#101624]/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F3EBDD] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D7AD63]" />
              <span>Inference Runtime Status</span>
            </h3>
            <button
              onClick={refreshStatus}
              className="text-xs text-[#91C7D8] hover:text-[#F3EBDD] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Probe Status</span>
            </button>
          </div>

          {/* Differentiated Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-4 ${
              statusData?.status === 'connected'
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : statusData?.status === 'remote_configured'
                ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
            }`}
          >
            {statusData?.status === 'connected' ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider">
                  STATUS: {statusData?.status === 'connected' ? 'LOCAL OLLAMA CONNECTED' : statusData?.status === 'remote_configured' ? 'REMOTE ENDPOINT CONFIGURED' : 'LOCAL INFERENCE OFFLINE'}
                </span>
                {statusData?.latencyMs && (
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-black/40 rounded">
                    {statusData.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90">{statusData?.message}</p>
            </div>
          </div>

          {/* Test Prompt Execution */}
          <div className="bg-[#08090D] border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#D7AD63] font-mono">
                Judge Live Connectivity Test
              </span>
              <button
                onClick={handleRunLiveTest}
                disabled={isTesting}
                className="px-3.5 py-1.5 bg-[#D7AD63] text-[#08090D] text-xs font-semibold rounded-lg hover:bg-[#e4be78] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Pinging Model...' : 'Run Live Ping Test'}</span>
              </button>
            </div>

            <p className="text-xs text-[#777985] font-editorial">
              Submits a non-sensitive prompt ("Ping from Veil Gate") directly to the active backend and measures response round-trip latency.
            </p>

            {testResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
                  testResult.success
                    ? 'bg-[#101624] border-emerald-500/40 text-[#F3EBDD]'
                    : 'bg-red-950/30 border-red-800/40 text-red-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#777985]">
                  <span>Source: {testResult.source}</span>
                  <span>Model: {testResult.model} · {testResult.latencyMs}ms</span>
                </div>
                {testResult.success ? (
                  <p className="text-emerald-300 font-editorial italic text-sm">
                    "{testResult.text}"
                  </p>
                ) : (
                  <p className="text-red-300">{testResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Ollama Run Guide */}
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-[#777985] font-mono">
              Terminal Setup Command (Copy & Run on your Machine):
            </span>
            <div className="bg-[#08090D] border border-white/10 rounded-lg p-3 flex items-center justify-between font-mono text-xs text-[#91C7D8]">
              <code>ollama run qwen2.5:7b-instruct</code>
              <button
                onClick={() => handleCopy('ollama run qwen2.5:7b-instruct', 'ollama-qwen')}
                className="p-1 hover:text-white cursor-pointer"
              >
                {copiedCmd === 'ollama-qwen' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3. MODEL SELECTOR & ENDPOINT CONFIG (5 cols) */}
        <div className="lg:col-span-5 bg-[#101624]/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F3EBDD] flex items-center gap-2 pb-4 border-b border-white/10 mb-6">
            <Sliders className="w-4 h-4 text-[#D7AD63]" />
            <span>Adapter Configuration</span>
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                Active Open-Weight Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F3EBDD]"
              >
                {modelsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.license})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                Inference Server Endpoint
              </label>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F3EBDD] font-mono"
              />
              <span className="text-[10px] text-[#777985] mt-1 block">
                Compatible with Ollama, LM Studio (v1/chat), LocalAI, or vLLM.
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingConfig}
              className="w-full py-2.5 bg-[#D7AD63] text-[#08090D] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#e4be78] transition-colors cursor-pointer"
            >
              {isUpdatingConfig ? 'Updating Adapter...' : 'Apply Adapter Settings'}
            </button>
          </form>

          {/* Model info details for active choice */}
          {(() => {
            const current = modelsList.find((m) => m.id === selectedModel);
            if (!current) return null;
            return (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-xs text-[#777985]">
                <div className="flex justify-between">
                  <span>License:</span>
                  <span className={`font-mono ${current.isTrueOpenSource ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {current.license}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Parameter Size:</span>
                  <span className="font-mono text-[#F3EBDD]">{current.parameterSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recommended VRAM:</span>
                  <span className="font-mono text-[#D7AD63]">{current.recommendedVRAM}</span>
                </div>
                <p className="pt-2 font-editorial italic text-[#F3EBDD]/80">
                  {current.description}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. OPEN-WEIGHT VS OPEN-SOURCE LICENSING AUDIT TABLE */}
      <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="pb-4 border-b border-white/10 mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F3EBDD] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D7AD63]" />
            <span>Open Weights vs. True Open-Source Software Governance</span>
          </h3>
          <p className="text-xs text-[#777985] mt-1 font-editorial">
            To satisfy Hacktoberfest rigor: We strictly distinguish between permissive OSI-approved software licenses (Apache 2.0 / MIT) and commercial open-weight community licenses.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F3EBDD]">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#777985] font-mono">
                <th className="pb-3">Model</th>
                <th className="pb-3">Provider</th>
                <th className="pb-3">License Class</th>
                <th className="pb-3">OSI Compliant?</th>
                <th className="pb-3">VRAM Spec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {modelsList.map((m) => (
                <tr key={m.id} className="hover:bg-white/5">
                  <td className="py-3 font-semibold text-[#D7AD63]">{m.name}</td>
                  <td className="py-3 text-[#777985]">{m.family}</td>
                  <td className="py-3 text-[#F3EBDD]">{m.license}</td>
                  <td className="py-3">
                    {m.isTrueOpenSource ? (
                      <span className="text-emerald-400">Yes (Permissive)</span>
                    ) : (
                      <span className="text-amber-400">Open-Weights Only</span>
                    )}
                  </td>
                  <td className="py-3 text-[#777985]">{m.recommendedVRAM}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
