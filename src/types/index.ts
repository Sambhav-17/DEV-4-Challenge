export type MemoryType = 'story' | 'remembrance' | 'letter' | 'audio_note';

export interface MemoryRecord {
  id: string;
  title: string;
  type: MemoryType;
  content: string;
  tags: string[];
  isFavorite: boolean;
  isDemo?: boolean;
  authorName?: string;
  personName?: string;
  importantDate?: string;
  favoriteSong?: string;
  favoriteFood?: string;
  meaningfulObjects?: string[];
  photoUrl?: string;
  audioDataUrl?: string; // base64 recorded audio memo
  createdAt: number;
  updatedAt: number;
}

export interface CandleOffering {
  id: string;
  message: string;
  donorName: string;
  color: 'gold' | 'marigold' | 'cyan' | 'ivory';
  x: number;
  z: number;
  createdAt: number;
}

export interface StoryPromptOptions {
  setting: string;
  mood: string;
  length: 'short' | 'medium' | 'long';
  inspirationType: 'memory' | 'object' | 'event' | 'custom';
  inspirationText: string;
  pov: 'first' | 'third';
  pacing: 'slow-burn' | 'supernatural-mystery' | 'climactic';
  recurringCharacter?: string;
  endingStyle: 'bittersweet' | 'spectral-peace' | 'lingering-dread' | 'open-ended';
}

export interface AIBackendStatus {
  status: 'connected' | 'remote_configured' | 'unavailable';
  endpoint: string;
  model: string;
  latencyMs?: number;
  provider: 'ollama' | 'openai_compatible' | 'gemini_fallback';
  message: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  family: string;
  parameterSize: string;
  license: string;
  isTrueOpenSource: boolean; // Distinguish OSI approved vs open-weights
  recommendedVRAM: string;
  description: string;
}
