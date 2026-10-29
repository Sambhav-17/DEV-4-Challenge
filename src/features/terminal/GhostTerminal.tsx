import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../lib/storage/db';
import { soundscape } from '../../lib/audio/soundscape';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, CornerDownLeft } from 'lucide-react';

interface GhostTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onOpenLeaveLight: () => void;
}

interface TerminalLog {
  id: string;
  type: 'command' | 'output' | 'system' | 'error';
  text: string;
}

export const GhostTerminal: React.FC<GhostTerminalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenLeaveLight,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'AFTERLIGHT VEIL INTERFACE v1.0.4 [OPEN-WEIGHT CRT TERMINAL]',
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Type "help" to list safe terminal commands or "status" to inspect active model.',
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputVal.trim();
    if (!raw) return;

    soundscape.playKeystroke(600);
    setInputVal('');
    setHistory((prev) => [...prev, raw]);
    setHistoryIdx(-1);

    const newLogs: TerminalLog[] = [
      ...logs,
      { id: `cmd-${Date.now()}`, type: 'command', text: `> ${raw}` },
    ];

    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `AVAILABLE COMMANDS:
  help               - Display this help directory
  status             - Probe backend connectivity & model details
  memories           - Count actual memories preserved in local storage
  summon             - Navigate to the Haunted Ghost Story Engine
  whisper <message>  - Transmit an ethereal prompt to the active AI model
  ofrenda            - Open the Digital Ofrenda Memorial Altar
  light <message>    - Inscribe a glowing candle offering into the garden
  archive            - Open the private Memory Archive
  about              - Display the AFTERLIGHT philosophy manifesto
  clear              - Wipe terminal display buffer
  exit / quit        - Close this terminal session`,
        });
        break;

      case 'status':
        try {
          const res = await fetch('/api/status');
          const data = await res.json();
          newLogs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            text: `MODEL SERVER STATUS:
  Connection : [${data.status.toUpperCase()}]
  Endpoint   : ${data.endpoint}
  Model      : ${data.model}
  Latency    : ${data.latencyMs ? `${data.latencyMs}ms` : 'N/A'}
  Diagnostics: ${data.message}`,
          });
        } catch {
          newLogs.push({
            id: `err-${Date.now()}`,
            type: 'error',
            text: 'ERROR: Unable to communicate with the AFTERLIGHT backend daemon.',
          });
        }
        break;

      case 'memories': {
        const list = await db.getAllMemories();
        const stories = list.filter((m) => m.type === 'story').length;
        const remembrances = list.filter((m) => m.type === 'remembrance').length;
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `LOCAL ARCHIVE AUDIT:
  Total records verified in IndexedDB: ${list.length}
  - Summoned stories   : ${stories}
  - Altar remembrances : ${remembrances}
  Storage Location     : Client Browser Local Sandboxed DB`,
        });
        break;
      }

      case 'summon':
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: 'Opening the Haunted Story Engine...',
        });
        setTimeout(() => {
          onNavigate('stories');
          onClose();
        }, 500);
        break;

      case 'ofrenda':
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: 'Opening the Ofrenda Altar...',
        });
        setTimeout(() => {
          onNavigate('ofrenda');
          onClose();
        }, 500);
        break;

      case 'archive':
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: 'Opening the Memory Archive...',
        });
        setTimeout(() => {
          onNavigate('archive');
          onClose();
        }, 500);
        break;

      case 'whisper':
        if (!args) {
          newLogs.push({
            id: `err-${Date.now()}`,
            type: 'error',
            text: 'Usage: whisper <your prompt or thought>',
          });
        } else {
          newLogs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            text: `Transmitting whisper across the veil: "${args}"...`,
          });
          setLogs([...newLogs]);

          try {
            const whisperRes = await fetch('/api/ai/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isWhisper: true, customPrompt: args }),
            });
            const data = await whisperRes.json();
            if (whisperRes.ok && data.success) {
              setLogs((prev) => [
                ...prev,
                {
                  id: `whisper-${Date.now()}`,
                  type: 'output',
                  text: `SPIRIT RESPONSE (${data.model}):\n"${data.text}"`,
                },
              ]);
            } else {
              setLogs((prev) => [
                ...prev,
                {
                  id: `whisper-err-${Date.now()}`,
                  type: 'error',
                  text: data.error || 'The whisper was lost in the silence.',
                },
              ]);
            }
          } catch {
            setLogs((prev) => [
              ...prev,
              {
                id: `whisper-err-${Date.now()}`,
                type: 'error',
                text: 'Backend offline: Unable to summon a response.',
              },
            ]);
          }
          return;
        }
        break;

      case 'light':
        if (!args) {
          onOpenLeaveLight();
          newLogs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            text: 'Opening "Leave a Light" modal...',
          });
        } else {
          await db.addCandle({
            id: `candle-${Date.now()}`,
            message: args,
            donorName: 'Terminal Pilgrim',
            color: 'gold',
            x: (Math.random() - 0.5) * 4,
            z: Math.random() * 2 + 1,
            createdAt: Date.now(),
          });
          soundscape.playCandleChime();
          newLogs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            text: `Light placed in the Veil Garden: "${args}"`,
          });
        }
        break;

      case 'about':
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `AFTERLIGHT PHILOSOPHY:
"Some things deserve to live forever."
We believe human memories are sacred and should not belong to remote cloud conglomerates.
By uniting local-first browser databases with open-weight language models (Qwen, Mistral, Llama),
AFTERLIGHT proves that AI can preserve human heritage with dignity and privacy.`,
        });
        break;

      case 'zip':
      case 'download': {
        const link = document.createElement('a');
        link.href = '/afterlight-source.zip';
        link.download = 'afterlight-source.zip';
        link.click();
        newLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: 'Triggering source code archive download: afterlight-source.zip [~2.5MB]',
        });
        break;
      }

      case 'clear':
        setLogs([]);
        return;

      case 'exit':
      case 'quit':
        onClose();
        return;

      default:
        newLogs.push({
          id: `err-${Date.now()}`,
          type: 'error',
          text: `Command not recognized: "${cmd}". Type "help" for a list of valid commands.`,
        });
        break;
    }

    setLogs(newLogs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    soundscape.playKeystroke();
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx >= 0) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className={`bg-[#050b0a] border border-[#22c55e]/40 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-mono crt-screen ${
          isMaximized ? 'w-[95vw] h-[90vh]' : 'w-full max-w-2xl h-[520px]'
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="bg-[#0b1412] border-b border-[#22c55e]/30 px-4 py-2.5 flex items-center justify-between text-xs text-[#22c55e]">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-[#22c55e]" />
            <span className="font-semibold tracking-wider">AFTERLIGHT // GHOST_TERMINAL_TTY0</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:text-white rounded cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-red-400 rounded cursor-pointer"
              title="Close terminal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CRT Content Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs text-[#4ade80] tracking-wide relative z-10 selection:bg-[#22c55e] selection:text-black">
          {logs.map((log) => (
            <div key={log.id} className="leading-relaxed">
              {log.type === 'command' ? (
                <div className="text-[#86efac] font-bold">{log.text}</div>
              ) : log.type === 'system' ? (
                <div className="text-[#fbbf24]">{log.text}</div>
              ) : log.type === 'error' ? (
                <div className="text-[#f87171]">{log.text}</div>
              ) : (
                <div className="whitespace-pre-wrap text-[#4ade80] opacity-90">{log.text}</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleCommand}
          className="bg-[#0b1412] border-t border-[#22c55e]/30 px-4 py-3 flex items-center gap-2 text-xs relative z-10"
        >
          <span className="text-[#22c55e] font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'help' or command..."
            className="flex-1 bg-transparent text-[#86efac] focus:outline-none placeholder-[#22c55e]/40 font-mono"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="text-[#22c55e] hover:text-[#86efac] p-1 cursor-pointer">
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
