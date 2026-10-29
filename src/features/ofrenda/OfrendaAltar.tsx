import React, { useState, useRef } from 'react';
import { MemoryRecord } from '../../types';
import { db } from '../../lib/storage/db';
import { soundscape } from '../../lib/audio/soundscape';
import {
  Sparkles,
  Heart,
  Music,
  Utensils,
  Calendar,
  BookOpen,
  Mic,
  MicOff,
  Image as ImageIcon,
  Plus,
  Compass,
  Star,
  Check,
  X,
  Volume2,
} from 'lucide-react';

interface OfrendaAltarProps {
  memories: MemoryRecord[];
  onMemoryAdded: (record: MemoryRecord) => void;
  onOpenLeaveLight: () => void;
}

export const OfrendaAltar: React.FC<OfrendaAltarProps> = ({
  memories,
  onMemoryAdded,
  onOpenLeaveLight,
}) => {
  const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(
    memories.find((m) => m.personName) || memories[0] || null
  );
  const [viewMode, setViewMode] = useState<'altar' | 'constellation'>('altar');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorStep, setEditorStep] = useState(1);

  // Form State
  const [personName, setPersonName] = useState('');
  const [title, setTitle] = useState('');
  const [remembranceText, setRemembranceText] = useState('');
  const [importantDate, setImportantDate] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [meaningfulObjectInput, setMeaningfulObjectInput] = useState('');
  const [objectsList, setObjectsList] = useState<string[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [audioBlobUrl, setAudioBlobUrl] = useState<string>('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filter ofrenda items
  const ofrendaMemories = memories.filter(
    (m) => m.type === 'remembrance' || m.personName || m.photoUrl
  );

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBlobUrl(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert('Microphone access was denied or is unavailable.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddObject = () => {
    if (meaningfulObjectInput.trim()) {
      setObjectsList([...objectsList, meaningfulObjectInput.trim()]);
      setMeaningfulObjectInput('');
    }
  };

  const handleSaveAltar = async () => {
    if (!title.trim() && !personName.trim()) return;

    const newRecord: MemoryRecord = {
      id: `ofrenda-${Date.now()}`,
      title: title.trim() || `In Memory of ${personName}`,
      personName: personName.trim(),
      type: 'remembrance',
      content: remembranceText.trim(),
      importantDate: importantDate.trim(),
      favoriteSong: favoriteSong.trim(),
      favoriteFood: favoriteFood.trim(),
      meaningfulObjects: objectsList,
      photoUrl: photoDataUrl || '/src/assets/images/ofrenda_portrait_vintage_1793096629132.jpg',
      audioDataUrl: audioBlobUrl || undefined,
      tags: ['Ofrenda', 'Remembrance', personName.trim() || 'Family'],
      isFavorite: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.saveMemory(newRecord);
    soundscape.playCandleChime();
    onMemoryAdded(newRecord);
    setSelectedMemory(newRecord);
    setIsEditorOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setPersonName('');
    setTitle('');
    setRemembranceText('');
    setImportantDate('');
    setFavoriteSong('');
    setFavoriteFood('');
    setObjectsList([]);
    setPhotoDataUrl('');
    setAudioBlobUrl('');
    setEditorStep(1);
  };

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-[0.25em] text-[#E98B37]">
          Section C · Digital Memory Altar
        </span>
        <h2 className="mt-2 text-3xl md:text-5xl font-display font-semibold text-[#F3EBDD]">
          The Ofrenda of Remembrance
        </h2>
        <p className="mt-3 text-sm md:text-base text-[#777985] max-w-2xl mx-auto font-editorial italic">
          Inspired respectfully by Día de los Muertos. A sacred space where photographs, songs, aromas, and stories welcome our beloved back into living memory.
        </p>

        {/* View mode toggle + Create Altar CTA */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1 bg-[#101624] border border-white/10 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('altar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'altar' ? 'bg-[#D7AD63] text-[#08090D] font-semibold' : 'text-[#777985] hover:text-[#F3EBDD]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Altar View</span>
            </button>
            <button
              onClick={() => setViewMode('constellation')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'constellation' ? 'bg-[#D7AD63] text-[#08090D] font-semibold' : 'text-[#777985] hover:text-[#F3EBDD]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Memory Constellation</span>
            </button>
          </div>

          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E98B37] text-[#08090D] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#f39c4e] transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Digital Ofrenda</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: ALTAR VIEW */}
      {viewMode === 'altar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Altar Showcase (7 cols) */}
          <div className="lg:col-span-7 bg-[#101624]/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* Top marigold garland simulation */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#E98B37] via-[#D7AD63] to-[#E98B37] opacity-80" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <span className="text-xs uppercase tracking-wider text-[#E98B37] font-mono">
                ✦ Sacred Memorial Tier
              </span>
              <span className="text-xs text-[#777985]">
                {ofrendaMemories.length} {ofrendaMemories.length === 1 ? 'Soul Honored' : 'Souls Honored'}
              </span>
            </div>

            {/* Central Portrait & Candlelight Array */}
            {selectedMemory ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Photo Frame */}
                  <div className="relative group shrink-0">
                    <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl overflow-hidden border-2 border-[#D7AD63] shadow-[0_0_30px_rgba(233,139,55,0.25)] bg-[#08090D]">
                      <img
                        src={selectedMemory.photoUrl || '/src/assets/images/ofrenda_portrait_vintage_1793096629132.jpg'}
                        alt={selectedMemory.personName || selectedMemory.title}
                        className="w-full h-full object-cover sepia-25 hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Small glowing candle indicator */}
                    <div className="absolute -bottom-2 -right-2 bg-[#08090D] border border-[#E98B37] rounded-full p-1.5 shadow-lg">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E98B37] animate-ping" />
                    </div>
                  </div>

                  {/* Title & Dates */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-2xl font-display font-semibold text-[#F3EBDD]">
                      {selectedMemory.personName || selectedMemory.title}
                    </h3>
                    {selectedMemory.importantDate && (
                      <p className="text-xs text-[#D7AD63] font-mono flex items-center justify-center sm:justify-start gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{selectedMemory.importantDate}</span>
                      </p>
                    )}
                    <p className="text-xs text-[#777985] font-editorial italic">
                      “The dead only die when the living forget them.”
                    </p>
                  </div>
                </div>

                {/* Remembrance Story Prose */}
                <div className="bg-[#08090D]/80 border border-white/10 rounded-xl p-5">
                  <h4 className="text-xs uppercase tracking-wider text-[#D7AD63] font-mono mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>The Living Remembrance</span>
                  </h4>
                  <p className="text-sm text-[#F3EBDD]/90 font-editorial leading-relaxed whitespace-pre-wrap">
                    {selectedMemory.content}
                  </p>
                </div>

                {/* Cultural Ofrenda Elements: Food, Song, Meaningful Objects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Favorite Food */}
                  {selectedMemory.favoriteFood && (
                    <div className="bg-[#08090D]/60 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#E98B37] font-mono mb-1">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Ofrenda Offering (Foods)</span>
                      </div>
                      <p className="text-xs text-[#F3EBDD] font-editorial">{selectedMemory.favoriteFood}</p>
                    </div>
                  )}

                  {/* Favorite Song */}
                  {selectedMemory.favoriteSong && (
                    <div className="bg-[#08090D]/60 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#91C7D8] font-mono mb-1">
                        <Music className="w-3.5 h-3.5" />
                        <span>Favorite Melody</span>
                      </div>
                      <p className="text-xs text-[#F3EBDD] font-editorial">{selectedMemory.favoriteSong}</p>
                    </div>
                  )}
                </div>

                {/* Meaningful Objects */}
                {selectedMemory.meaningfulObjects && selectedMemory.meaningfulObjects.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#777985] font-mono block mb-2">
                      Keepsakes & Meaningful Objects:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.meaningfulObjects.map((obj, i) => (
                        <span
                          key={i}
                          className="text-xs text-[#D7AD63] bg-[#08090D] border border-[#D7AD63]/30 px-2.5 py-1 rounded-md"
                        >
                          ✦ {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Memo if present */}
                {selectedMemory.audioDataUrl && (
                  <div className="p-3 bg-[#08090D] border border-white/10 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-[#F3EBDD] flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#D7AD63]" />
                      <span>Recorded Voice Memory</span>
                    </span>
                    <audio controls src={selectedMemory.audioDataUrl} className="h-8 max-w-[200px]" />
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-[#777985]">
                <p>No ofrenda altars created yet.</p>
              </div>
            )}
          </div>

          {/* Right Selector Column: All Souls on the Altar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-[#777985] font-mono">
              Honored Souls in This Garden
            </h3>

            <div className="space-y-3">
              {ofrendaMemories.map((mem) => {
                const isSelected = selectedMemory?.id === mem.id;
                return (
                  <div
                    key={mem.id}
                    onClick={() => {
                      setSelectedMemory(mem);
                      soundscape.playCandleChime();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? 'bg-[#101624] border-[#D7AD63] shadow-lg'
                        : 'bg-[#08090D]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#D7AD63]/50 shrink-0 bg-[#08090D]">
                      <img
                        src={mem.photoUrl || '/src/assets/images/ofrenda_portrait_vintage_1793096629132.jpg'}
                        alt={mem.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#F3EBDD] truncate">
                        {mem.personName || mem.title}
                      </h4>
                      <p className="text-xs text-[#777985] truncate font-editorial">
                        {mem.content.slice(0, 70)}...
                      </p>
                      {mem.isDemo && (
                        <span className="text-[10px] text-[#91C7D8] font-mono mt-0.5 block">
                          [Sample Memorial Data]
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave a Light offering prompt */}
            <div className="p-4 bg-gradient-to-r from-[#101624] to-[#161c2d] border border-[#D7AD63]/30 rounded-xl text-center space-y-2">
              <p className="text-xs text-[#F3EBDD] font-editorial">
                Light a virtual beeswax candle to illuminate their journey across the veil.
              </p>
              <button
                onClick={onOpenLeaveLight}
                className="px-4 py-1.5 bg-[#D7AD63] text-[#08090D] text-xs font-semibold rounded-lg hover:bg-[#e4be78] transition-colors cursor-pointer"
              >
                Place Candle Offering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MEMORY CONSTELLATION */}
      {viewMode === 'constellation' && (
        <div className="bg-[#08090D] border border-white/10 rounded-2xl p-8 min-h-[500px] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <h3 className="text-sm font-display text-[#D7AD63]">
              The Constellation of Living Memory
            </h3>
            <span className="text-xs text-[#777985] font-mono">
              Click any star node to reveal its story
            </span>
          </div>

          {/* Interactive Star Constellation Plane */}
          <div className="relative w-full h-[400px] my-6">
            {/* SVG Golden Connecting Threads */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {memories.map((_, i) => {
                if (i === 0) return null;
                const prevX = (i * 120 + 60) % 700;
                const prevY = ((i - 1) * 90 + 50) % 320;
                const currX = ((i + 1) * 120 + 60) % 700;
                const currY = (i * 90 + 50) % 320;
                return (
                  <line
                    key={i}
                    x1={prevX}
                    y1={prevY}
                    x2={currX}
                    y2={currY}
                    stroke="#D7AD63"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                );
              })}
            </svg>

            {/* Glowing Star Nodes */}
            {memories.map((mem, index) => {
              const leftPercent = 12 + ((index * 26) % 76);
              const topPercent = 18 + ((index * 32) % 65);
              const isSelected = selectedMemory?.id === mem.id;

              return (
                <div
                  key={mem.id}
                  onClick={() => {
                    setSelectedMemory(mem);
                    soundscape.playCandleChime();
                  }}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#E98B37] scale-150 shadow-[0_0_20px_#E98B37]'
                        : 'bg-[#D7AD63] group-hover:scale-125 shadow-[0_0_10px_#D7AD63]'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block whitespace-nowrap bg-[#101624] border border-white/10 px-3 py-1.5 rounded-md shadow-xl text-xs text-[#F3EBDD] z-20">
                    <p className="font-semibold">{mem.personName || mem.title}</p>
                    <p className="text-[10px] text-[#D7AD63] font-mono">{mem.type}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Star Details Card */}
          {selectedMemory && (
            <div className="bg-[#101624]/90 border border-[#D7AD63]/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div>
                <h4 className="text-sm font-semibold text-[#F3EBDD]">
                  {selectedMemory.personName || selectedMemory.title}
                </h4>
                <p className="text-xs text-[#777985] font-editorial max-w-xl">
                  {selectedMemory.content.slice(0, 140)}...
                </p>
              </div>
              <button
                onClick={() => setViewMode('altar')}
                className="px-3 py-1.5 bg-[#D7AD63] text-[#08090D] text-xs font-medium rounded-lg hover:bg-[#e4be78] whitespace-nowrap cursor-pointer"
              >
                Open Full Altar View
              </button>
            </div>
          )}
        </div>
      )}

      {/* GUIDED 6-STEP OFRENDA CREATION MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#101624] border border-white/15 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#E98B37] font-mono">
                  Step {editorStep} of 4 · Digital Ofrenda Flow
                </span>
                <h3 className="text-xl font-display text-[#F3EBDD]">Inscribe a Soul onto the Altar</h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-[#777985] hover:text-[#F3EBDD] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Identity & Photograph */}
            {editorStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Name of Person / Beloved Being
                  </label>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Abuela Elena Sofia Morales"
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EBDD] focus:border-[#D7AD63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Meaningful Dates or Era
                  </label>
                  <input
                    type="text"
                    value={importantDate}
                    onChange={(e) => setImportantDate(e.target.value)}
                    placeholder="e.g. 1938–2021 or 'Every Autumn by the Coast'"
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EBDD] focus:border-[#D7AD63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Portrait Photograph (Kept locally on device)
                  </label>
                  <div className="flex items-center gap-4">
                    {photoDataUrl && (
                      <img
                        src={photoDataUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-[#D7AD63]"
                      />
                    )}
                    <label className="flex items-center gap-2 px-3 py-2 bg-[#08090D] border border-white/15 rounded-lg text-xs text-[#F3EBDD] hover:border-[#D7AD63] cursor-pointer">
                      <ImageIcon className="w-4 h-4 text-[#D7AD63]" />
                      <span>{photoDataUrl ? 'Change Photo' : 'Upload Memorial Photo'}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: The Remembrance Story & Voice Memo */}
            {editorStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Altar Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Radio on the Windowsill"
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EBDD]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Personal Remembrance or Story
                  </label>
                  <textarea
                    rows={4}
                    value={remembranceText}
                    onChange={(e) => setRemembranceText(e.target.value)}
                    placeholder="Describe their laughter, their favorite sayings, what they taught you, or a quiet memory..."
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg p-3 text-xs text-[#F3EBDD] resize-none"
                  />
                </div>

                {/* Optional Voice Memo */}
                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-2 font-mono">
                    Optional Voice Remembrance Memo
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        isRecording
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-[#08090D] border border-white/15 text-[#F3EBDD] hover:border-[#D7AD63]'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#D7AD63]" />}
                      <span>{isRecording ? 'Stop Recording' : 'Record Voice Memory'}</span>
                    </button>
                    {audioBlobUrl && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-3.5 h-3.5" /> Audio captured
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Cultural Details: Songs, Food, Artifacts */}
            {editorStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Favorite Melody or Song
                  </label>
                  <input
                    type="text"
                    value={favoriteSong}
                    onChange={(e) => setFavoriteSong(e.target.value)}
                    placeholder="e.g. Cielito Lindo, Clair de Lune, or a radio waltz"
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EBDD]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Favorite Food or Ofrenda Treat
                  </label>
                  <input
                    type="text"
                    value={favoriteFood}
                    onChange={(e) => setFavoriteFood(e.target.value)}
                    placeholder="e.g. Pan de muerto with hot spiced cocoa, peach cobbler"
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EBDD]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#777985] mb-1 font-mono">
                    Meaningful Keepsakes (Books, keys, watches)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meaningfulObjectInput}
                      onChange={(e) => setMeaningfulObjectInput(e.target.value)}
                      placeholder="Add an object and click Add..."
                      className="flex-1 bg-[#08090D] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F3EBDD]"
                    />
                    <button
                      type="button"
                      onClick={handleAddObject}
                      className="px-3 py-2 bg-[#D7AD63] text-[#08090D] text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {objectsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {objectsList.map((obj, i) => (
                        <span
                          key={i}
                          className="text-xs bg-[#08090D] text-[#D7AD63] border border-[#D7AD63]/30 px-2 py-0.5 rounded"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Preview & Save Privately */}
            {editorStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-[#08090D] border border-[#D7AD63]/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#D7AD63]">
                      <img
                        src={photoDataUrl || '/src/assets/images/ofrenda_portrait_vintage_1793096629132.jpg'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#F3EBDD]">{personName || 'Honored Soul'}</h4>
                      <p className="text-xs text-[#D7AD63]">{title || 'Memorial Record'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#777985] font-editorial italic">
                    "{remembranceText || 'Memory preserved in Afterlight.'}"
                  </p>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-xs text-emerald-200">
                  ✦ Privacy Guarantee: This remembrance will be written exclusively to your browser's private IndexedDB storage. It is never uploaded to an AI service or public cloud without your consent.
                </div>
              </div>
            )}

            {/* Modal Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {editorStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setEditorStep(editorStep - 1)}
                  className="px-4 py-2 text-xs text-[#777985] hover:text-[#F3EBDD] cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {editorStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setEditorStep(editorStep + 1)}
                  className="px-4 py-2 bg-[#D7AD63] text-[#08090D] text-xs font-semibold rounded-lg hover:bg-[#e4be78] cursor-pointer"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAltar}
                  className="px-5 py-2.5 bg-[#E98B37] text-[#08090D] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#f39c4e] cursor-pointer shadow-lg"
                >
                  Inscribe on Altar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
