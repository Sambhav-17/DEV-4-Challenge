import React, { useState } from 'react';
import { Menu, X, Sparkles, Terminal, Info, Download } from 'lucide-react';

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenUnderTheHood: () => void;
  onOpenTerminal: () => void;
  onOpenLeaveLight: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  onOpenUnderTheHood,
  onOpenTerminal,
  onOpenLeaveLight,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'veil', label: 'The Veil' },
    { id: 'stories', label: 'Ghost Stories' },
    { id: 'ofrenda', label: 'The Ofrenda' },
    { id: 'archive', label: 'Memory Archive' },
    { id: 'ai-lab', label: 'AI Lab' },
    { id: 'about', label: 'About' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="relative z-30 w-full bg-[#08090D]/90 border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single Text Element) */}
        <button
          onClick={() => handleLinkClick('veil')}
          className="text-xl font-display font-bold tracking-widest text-[#F3EBDD] hover:text-[#D7AD63] transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
        >
          AFTERLIGHT
        </button>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs tracking-wider uppercase">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer relative py-1 ${
                  isActive
                    ? 'text-[#D7AD63] font-semibold'
                    : 'text-[#777985] hover:text-[#F3EBDD]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D7AD63]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Utility Icons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Terminal Trigger */}
          <button
            onClick={onOpenTerminal}
            className="p-2 text-[#777985] hover:text-[#D7AD63] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Open Ghost Terminal (Safe CLI)"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Under The Hood (Judge Tour) */}
          <button
            onClick={onOpenUnderTheHood}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#91C7D8] bg-[#101624] border border-[#91C7D8]/30 rounded-lg hover:bg-[#18233a] transition-colors cursor-pointer whitespace-nowrap"
            title="Inspect Architecture & Demo in < 60s"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Judge Guide</span>
          </button>

          {/* Download Source Zip */}
          <a
            href="/afterlight-source.zip"
            download="afterlight-source.zip"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#D7AD63] bg-[#101624] border border-[#D7AD63]/30 rounded-lg hover:bg-[#18233a] transition-colors cursor-pointer whitespace-nowrap"
            title="Download Complete Source Code (.zip)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Source .zip</span>
          </a>

          {/* Primary CTA */}
          <button
            onClick={() => handleLinkClick('stories')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#08090D] bg-[#D7AD63] rounded-lg hover:bg-[#e2bd76] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Summon Story</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#777985] hover:text-[#F3EBDD] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#101624] border-b border-white/10 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`block w-full text-left py-2 text-sm tracking-wide ${
                activeSection === link.id
                  ? 'text-[#D7AD63] font-semibold'
                  : 'text-[#777985] hover:text-[#F3EBDD]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenUnderTheHood();
              }}
              className="w-full text-left py-2 text-xs text-[#91C7D8] flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              <span>Judge Guide & Under The Hood</span>
            </button>
            <a
              href="/afterlight-source.zip"
              download="afterlight-source.zip"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left py-2 text-xs text-[#D7AD63] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Source Code (.zip)</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTerminal();
              }}
              className="w-full text-left py-2 text-xs text-[#D7AD63] flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              <span>Haunted Ghost Terminal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
