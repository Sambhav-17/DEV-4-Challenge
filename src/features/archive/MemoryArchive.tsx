import React, { useState, useMemo } from 'react';
import { MemoryRecord, MemoryType } from '../../types';
import { db } from '../../lib/storage/db';
import { soundscape } from '../../lib/audio/soundscape';
import {
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Trash2,
  Edit3,
  Copy,
  Download,
  Upload,
  Calendar,
  Tag,
  BookOpen,
  Sparkles,
  Volume2,
  FileText,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';

interface MemoryArchiveProps {
  memories: MemoryRecord[];
  onMemoriesUpdated: () => void;
  onSelectStoryForGenerator?: (memory: MemoryRecord) => void;
}

export const MemoryArchive: React.FC<MemoryArchiveProps> = ({
  memories,
  onMemoriesUpdated,
  onSelectStoryForGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alpha'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Modal inspection & editing
  const [activeMemory, setActiveMemory] = useState<MemoryRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<MemoryRecord | null>(null);

  // Import feedback
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Real statistics calculated from stored records
  const stats = useMemo(() => {
    const total = memories.length;
    const stories = memories.filter((m) => m.type === 'story').length;
    const remembrances = memories.filter((m) => m.type === 'remembrance').length;
    const letters = memories.filter((m) => m.type === 'letter').length;
    const totalWords = memories.reduce((acc, m) => acc + (m.content ? m.content.split(/\s+/).length : 0), 0);
    return { total, stories, remembrances, letters, totalWords };
  }, [memories]);

  // Filtered & sorted memories
  const filteredMemories = useMemo(() => {
    return memories
      .filter((m) => {
        if (selectedType !== 'all' && m.type !== selectedType) return false;
        if (onlyFavorites && !m.isFavorite) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchContent = m.content.toLowerCase().includes(q);
          const matchPerson = m.personName?.toLowerCase().includes(q);
          const matchTags = m.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchPerson && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') return b.createdAt - a.createdAt;
        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'alpha') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [memories, selectedType, onlyFavorites, searchQuery, sortBy]);

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.toggleFavorite(id);
    soundscape.playCandleChime();
    onMemoriesUpdated();
  };

  const handleDuplicate = async (memory: MemoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicateRecord: MemoryRecord = {
      ...memory,
      id: `${memory.id}-copy-${Date.now()}`,
      title: `${memory.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDemo: false,
    };
    await db.saveMemory(duplicateRecord);
    soundscape.playCandleChime();
    onMemoriesUpdated();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await db.deleteMemory(itemToDelete.id);
    setItemToDelete(null);
    if (activeMemory?.id === itemToDelete.id) {
      setActiveMemory(null);
    }
    onMemoriesUpdated();
  };

  const handleStartEdit = (memory: MemoryRecord) => {
    setActiveMemory(memory);
    setEditTitle(memory.title);
    setEditContent(memory.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!activeMemory) return;
    const updated: MemoryRecord = {
      ...activeMemory,
      title: editTitle.trim() || activeMemory.title,
      content: editContent.trim() || activeMemory.content,
      updatedAt: Date.now(),
    };
    await db.saveMemory(updated);
    setIsEditing(false);
    setActiveMemory(updated);
    onMemoriesUpdated();
  };

  const handleExportBackup = async () => {
    const jsonStr = await db.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `afterlight_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const res = await db.importBackupJson(text);
      if (res.success) {
        setImportStatus(`Successfully imported ${res.count} memories into your archive.`);
        onMemoriesUpdated();
      } else {
        setImportStatus(`Import failed: ${res.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 py-12">
      {/* Header & Stats Banner */}
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-[0.25em] text-[#91C7D8]">
          Section D · Local-First Library
        </span>
        <h2 className="mt-2 text-3xl md:text-5xl font-display font-semibold text-[#F3EBDD]">
          The Memory Archive
        </h2>
        <p className="mt-3 text-sm md:text-base text-[#777985] max-w-2xl mx-auto font-editorial italic">
          Preserved entirely on your machine via private browser storage. Search, curate, export, and safeguard human stories.
        </p>

        {/* Real Dynamic Calculated Statistics Strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          <div className="bg-[#101624]/80 border border-white/10 rounded-xl p-3 text-center">
            <span className="block text-2xl font-mono font-bold text-[#F3EBDD] tabular-nums">
              {stats.total}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#777985] font-mono">
              Total Records
            </span>
          </div>

          <div className="bg-[#101624]/80 border border-white/10 rounded-xl p-3 text-center">
            <span className="block text-2xl font-mono font-bold text-[#D7AD63] tabular-nums">
              {stats.stories}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#777985] font-mono">
              Summoned Stories
            </span>
          </div>

          <div className="bg-[#101624]/80 border border-white/10 rounded-xl p-3 text-center">
            <span className="block text-2xl font-mono font-bold text-[#E98B37] tabular-nums">
              {stats.remembrances}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#777985] font-mono">
              Altar Memories
            </span>
          </div>

          <div className="bg-[#101624]/80 border border-white/10 rounded-xl p-3 text-center">
            <span className="block text-2xl font-mono font-bold text-[#91C7D8] tabular-nums">
              {stats.totalWords.toLocaleString()}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#777985] font-mono">
              Words Preserved
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Sort, Import/Export */}
      <div className="bg-[#101624]/90 border border-white/10 rounded-2xl p-4 md:p-6 mb-8 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#777985] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories, tags, names..."
              className="w-full bg-[#08090D] border border-white/10 rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#F3EBDD] focus:border-[#D7AD63] focus:outline-none"
            />
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(['all', 'story', 'remembrance', 'letter'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                  selectedType === t
                    ? 'bg-[#D7AD63] text-[#08090D] font-semibold'
                    : 'bg-[#08090D] text-[#777985] border border-white/10 hover:text-[#F3EBDD]'
                }`}
              >
                {t}
              </button>
            ))}

            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                onlyFavorites
                  ? 'bg-[#E98B37] text-[#08090D] font-semibold'
                  : 'bg-[#08090D] text-[#777985] border border-white/10 hover:text-[#F3EBDD]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Favorites</span>
            </button>
          </div>

          {/* Backup Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08090D] border border-white/15 rounded-lg text-xs text-[#F3EBDD] hover:border-[#D7AD63] transition-colors cursor-pointer"
              title="Download entire archive as JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#D7AD63]" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08090D] border border-white/15 rounded-lg text-xs text-[#F3EBDD] hover:border-[#D7AD63] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#91C7D8]" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Import Feedback Banner */}
        {importStatus && (
          <div className="p-3 bg-[#08090D] border border-[#D7AD63]/50 rounded-lg text-xs text-[#D7AD63] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D7AD63]" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Grid of Memory Cards */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((record) => (
            <div
              key={record.id}
              onClick={() => setActiveMemory(record)}
              className="bg-[#101624]/90 border border-white/10 hover:border-[#D7AD63]/50 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
            >
              <div>
                {/* Header: Type & Favorite & Demo tag */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-[#D7AD63]">
                      {record.type}
                    </span>
                    {record.isDemo && (
                      <span className="text-[10px] text-[#777985] font-mono">· demo</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(record.id, e)}
                    className="p-1 text-[#777985] hover:text-[#E98B37] cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${record.isFavorite ? 'text-[#E98B37] fill-[#E98B37]' : ''}`}
                    />
                  </button>
                </div>

                {/* Title & Person */}
                <h3 className="text-lg font-display font-semibold text-[#F3EBDD] group-hover:text-[#D7AD63] transition-colors line-clamp-2">
                  {record.title}
                </h3>
                {record.personName && (
                  <p className="text-xs text-[#91C7D8] font-mono mt-1">
                    Dedicated to: {record.personName}
                  </p>
                )}

                {/* Excerpt */}
                <p className="text-xs text-[#777985] font-editorial leading-relaxed mt-2.5 line-clamp-3">
                  {record.content}
                </p>

                {/* Tags */}
                {record.tags && record.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {record.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-[#777985] bg-[#08090D] px-2 py-0.5 rounded border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-4 text-xs text-[#777985]">
                <span className="font-mono text-[10px]">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDuplicate(record, e)}
                    className="p-1 hover:text-[#F3EBDD] transition-colors cursor-pointer"
                    title="Duplicate record"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(record);
                    }}
                    className="p-1 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#101624]/60 border border-white/10 rounded-2xl p-16 text-center space-y-4">
          <BookOpen className="w-8 h-8 text-[#777985] mx-auto" />
          <h4 className="text-base font-display text-[#F3EBDD]">No Memories Match Your Filter</h4>
          <p className="text-xs text-[#777985] max-w-sm mx-auto font-editorial">
            Try adjusting your search terms or type filters, or summon an original story from the Veil.
          </p>
        </div>
      )}

      {/* FULL RECORD INSPECTION & EDIT MODAL */}
      {activeMemory && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#101624] border border-white/15 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono text-[#D7AD63]">
                  {activeMemory.type}
                </span>
                {activeMemory.isDemo && (
                  <span className="text-xs text-[#777985] font-mono">· Sample Record</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => handleStartEdit(activeMemory)}
                    className="p-1.5 text-[#777985] hover:text-[#D7AD63] rounded-lg cursor-pointer transition-colors"
                    title="Edit content"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveMemory(null);
                    setIsEditing(false);
                  }}
                  className="p-1.5 text-[#777985] hover:text-[#F3EBDD] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-[#777985] mb-1 font-mono">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg px-3 py-2 text-sm text-[#F3EBDD]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-[#777985] mb-1 font-mono">
                    Content
                  </label>
                  <textarea
                    rows={8}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#08090D] border border-white/15 rounded-lg p-3 text-sm text-[#F3EBDD] resize-none font-editorial"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs text-[#777985] hover:text-[#F3EBDD] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-[#D7AD63] text-[#08090D] text-xs font-semibold rounded-lg hover:bg-[#e4be78] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-display font-semibold text-[#F3EBDD]">
                  {activeMemory.title}
                </h3>

                {activeMemory.photoUrl && (
                  <div className="w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-[#08090D]">
                    <img
                      src={activeMemory.photoUrl}
                      alt={activeMemory.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {activeMemory.personName && (
                  <p className="text-xs text-[#D7AD63] font-mono">
                    Soul Honored: {activeMemory.personName}
                  </p>
                )}

                <div className="text-sm md:text-base text-[#F3EBDD]/90 font-editorial leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto pr-2">
                  {activeMemory.content}
                </div>

                {activeMemory.audioDataUrl && (
                  <div className="p-3 bg-[#08090D] border border-white/10 rounded-lg">
                    <span className="text-xs text-[#D7AD63] block mb-1 font-mono">Voice Recording:</span>
                    <audio controls src={activeMemory.audioDataUrl} className="w-full" />
                  </div>
                )}

                {activeMemory.tags && activeMemory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {activeMemory.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-[#91C7D8] bg-[#08090D] border border-white/10 px-2.5 py-1 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#101624] border border-red-900/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-display text-[#F3EBDD]">Confirm Deletion</h4>
            </div>
            <p className="text-xs text-[#777985] font-editorial">
              Are you sure you wish to dissolve "{itemToDelete.title}" from your local archive? This action cannot be undone unless you have an exported JSON backup.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs text-[#777985] hover:text-[#F3EBDD] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
