import React, { useState, useEffect, useCallback } from 'react';
import { MemoryRecord, CandleOffering } from './types';
import { db } from './lib/storage/db';
import { soundscape } from './lib/audio/soundscape';
import { Header } from './components/common/Header';
import { IntroModal } from './components/common/IntroModal';
import { VeilGardenCanvas } from './components/three/VeilGardenCanvas';
import { StoryGenerator } from './features/stories/StoryGenerator';
import { OfrendaAltar } from './features/ofrenda/OfrendaAltar';
import { MemoryArchive } from './features/archive/MemoryArchive';
import { OpenSourceAiLab } from './features/ai-lab/OpenSourceAiLab';
import { AboutManifesto } from './features/about/AboutManifesto';
import { GhostTerminal } from './features/terminal/GhostTerminal';
import { UnderTheHoodModal } from './features/under-the-hood/UnderTheHoodModal';
import { LeaveALightModal } from './components/common/LeaveALightModal';
import { Volume2, VolumeX, Sparkles, Terminal, Info } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('veil');
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [candles, setCandles] = useState<CandleOffering[]>([]);
  const [showIntro, setShowIntro] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(true);

  // Modals
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isUnderTheHoodOpen, setIsUnderTheHoodOpen] = useState<boolean>(false);
  const [isLeaveLightOpen, setIsLeaveLightOpen] = useState<boolean>(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check intro preference & load DB on startup
  useEffect(() => {
    try {
      const seen = localStorage.getItem('afterlight_intro_seen');
      if (!seen) {
        setShowIntro(true);
      }
    } catch {
      setShowIntro(false);
    }
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    const [allMemories, allCandles] = await Promise.all([
      db.getAllMemories(),
      db.getAllCandles(),
    ]);
    setMemories(allMemories);
    setCandles(allCandles);
  }, []);

  const handleToggleSound = () => {
    const active = soundscape.toggleSound();
    setIsSoundMuted(!active);
    showToast(active ? 'Soundscape active' : 'Soundscape muted');
  };

  const handleCandleCreated = (newCandle: CandleOffering) => {
    setCandles((prev) => [...prev, newCandle]);
    showToast('Your light has joined the Veil Garden');
  };

  const handleMemoryAdded = (record: MemoryRecord) => {
    setMemories((prev) => [record, ...prev]);
    showToast(`"${record.title}" inscribed in local archive`);
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F3EBDD] flex flex-col relative font-sans selection:bg-[#D7AD63] selection:text-[#08090D]">
      {/* Cinematic Intro Modal */}
      {showIntro && (
        <IntroModal
          onEnter={() => setShowIntro(false)}
          onExploreArchive={() => {
            setShowIntro(false);
            setActiveSection('archive');
          }}
        />
      )}

      {/* Top Navigation Bar */}
      <Header
        activeSection={activeSection}
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenUnderTheHood={() => setIsUnderTheHoodOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenLeaveLight={() => setIsLeaveLightOpen(true)}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#101624] border border-[#D7AD63]/60 text-[#F3EBDD] text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-[#D7AD63]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN VIEW ROUTING */}
      <main className="flex-1 flex flex-col relative">
        {activeSection === 'veil' && (
          <div className="w-full h-[calc(100vh-64px)] relative">
            <VeilGardenCanvas
              candles={candles}
              onSelectCandle={(c) => showToast(`Offering by ${c.donorName}: "${c.message}"`)}
              onOpenLeaveLight={() => setIsLeaveLightOpen(true)}
              isSoundMuted={isSoundMuted}
              onToggleSound={handleToggleSound}
            />
          </div>
        )}

        {activeSection === 'stories' && (
          <div className="py-6">
            <StoryGenerator
              onStorySaved={handleMemoryAdded}
              onNavigateToAiLab={() => setActiveSection('ai-lab')}
            />
          </div>
        )}

        {activeSection === 'ofrenda' && (
          <div className="py-6">
            <OfrendaAltar
              memories={memories}
              onMemoryAdded={handleMemoryAdded}
              onOpenLeaveLight={() => setIsLeaveLightOpen(true)}
            />
          </div>
        )}

        {activeSection === 'archive' && (
          <div className="py-6">
            <MemoryArchive
              memories={memories}
              onMemoriesUpdated={loadData}
            />
          </div>
        )}

        {activeSection === 'ai-lab' && (
          <div className="py-6">
            <OpenSourceAiLab />
          </div>
        )}

        {activeSection === 'about' && (
          <div className="py-6">
            <AboutManifesto
              onOpenLeaveLight={() => setIsLeaveLightOpen(true)}
              onNavigateToAiLab={() => setActiveSection('ai-lab')}
            />
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="w-full bg-[#050608] border-t border-white/5 py-6 px-4 text-center text-xs text-[#777985]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display tracking-widest text-[#D7AD63]">
            AFTERLIGHT
          </span>
          <span className="font-editorial italic">
            “Some things deserve to live forever.” · Hacktoberfest 2026
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsUnderTheHoodOpen(true)}
              className="hover:text-[#F3EBDD] cursor-pointer"
            >
              Judge Guide
            </button>
            <button
              onClick={() => setIsTerminalOpen(true)}
              className="hover:text-[#D7AD63] cursor-pointer"
            >
              Terminal
            </button>
            <button
              onClick={() => setShowIntro(true)}
              className="hover:text-[#F3EBDD] cursor-pointer"
            >
              Replay Intro
            </button>
          </div>
        </div>
      </footer>

      {/* Haunted Ghost Terminal CRT Modal */}
      <GhostTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLeaveLight={() => setIsLeaveLightOpen(true)}
      />

      {/* Under The Hood Judge Briefing Modal */}
      <UnderTheHoodModal
        isOpen={isUnderTheHoodOpen}
        onClose={() => setIsUnderTheHoodOpen(false)}
        onDemoReset={loadData}
        onNavigateToAiLab={() => {
          setActiveSection('ai-lab');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Leave a Light Offering Modal */}
      <LeaveALightModal
        isOpen={isLeaveLightOpen}
        onClose={() => setIsLeaveLightOpen(false)}
        onCandleCreated={handleCandleCreated}
      />
    </div>
  );
}
