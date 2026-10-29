import { MemoryRecord, CandleOffering } from '../../types';

const DB_NAME = 'afterlight_db';
const DB_VERSION = 1;
const MEMORIES_STORE = 'memories';
const CANDLES_STORE = 'candles';

const INITIAL_DEMO_MEMORIES: MemoryRecord[] = [
  {
    id: 'demo-abuela-elena',
    title: 'Abuela Elena’s Kitchen & The Midnight Radio',
    type: 'remembrance',
    personName: 'Elena Sofia Morales (1938–2021)',
    content: `She kept an ivory-cased transistor radio on the windowsill that hummed on cold November mornings. She taught three generations that cinnamon must always be crushed between fingers, never blades, so the scent stays warm. Whenever storm sirens cried in Michoacán, she would light a beeswax candle and tell us the ancestors were just adjusting the chandeliers in the sky.`,
    tags: ['Family', 'Michoacán', 'Kitchen', 'Tradition'],
    isFavorite: true,
    isDemo: true,
    importantDate: '1938-04-12 — 2021-11-02',
    favoriteSong: 'Cielito Lindo (Chavela Vargas rendition)',
    favoriteFood: 'Pan de muerto with orange blossom water & Mexican hot chocolate',
    meaningfulObjects: ['Vintage ivory transistor radio', 'Carved molinillo whisk', 'Lace embroidery apron'],
    photoUrl: '/src/assets/images/ofrenda_portrait_vintage_1793096629132.jpg',
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'demo-observatory-story',
    title: 'The Glass Prism of Sector 7',
    type: 'story',
    authorName: 'AI Ghost Storyteller (Qwen-2.5-7B)',
    content: `The brass telescope had not tracked a living star in fifty years. Yet every autumn equinox, the counterweights within the stone tower clicked into motion without steam or human hand. Dr. Vance, who had spent his life cataloging dead variable stars, swore he could smell damp tweed and bergamot tea in the cold cupola. When the lens finally aligned at 03:14 AM, the glass did not reflect the Andromeda galaxy—it reflected his own childhood bedroom in Devonshire, lit by a single kerosene lamp that had flickered out in the winter of 1964.`,
    tags: ['Ghost Story', 'Observatory', 'Stars', 'Memory'],
    isFavorite: true,
    isDemo: true,
    meaningfulObjects: ['Brass prism', 'Star catalog ledger', 'Worn wool scarf'],
    photoUrl: '/src/assets/images/haunted_observatory_ruins_1793096629548.jpg',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'demo-letter-mateo',
    title: 'A Letter Left in the Attic Floorboards',
    type: 'letter',
    personName: 'Uncle Mateo',
    content: `If you are reading this, the old willow tree has probably outgrown the conservatory roof. Do not cut it down. Under the second root to the east, there is an iron tobacco tin with thirteen silver railway tokens and three river pebbles. When the freight trains passed at dusk, your mother and I used to place our palms flat against the warm tracks to feel the pulse of cities we had never seen. Remember: silence is never empty; it is simply listening.`,
    tags: ['Letters', 'Attic', 'Heritage', 'Youth'],
    isFavorite: false,
    isDemo: true,
    importantDate: 'October 14, 1978',
    meaningfulObjects: ['Iron tobacco tin', 'Silver train tokens'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  }
];

const INITIAL_DEMO_CANDLES: CandleOffering[] = [
  {
    id: 'candle-1',
    message: 'For Nana, who made stars feel like nearby lamps.',
    donorName: 'Mateo & Sofia',
    color: 'marigold',
    x: -2.4,
    z: 1.8,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'candle-2',
    message: 'To the travelers who never made it to the coast.',
    donorName: 'Anonymous Pilgrim',
    color: 'gold',
    x: 2.1,
    z: 2.5,
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'candle-3',
    message: 'For Julian. The music never stopped playing.',
    donorName: 'Elena',
    color: 'cyan',
    x: -0.8,
    z: 3.2,
    createdAt: Date.now() - 3600000 * 20,
  },
  {
    id: 'candle-4',
    message: 'May memory be lighter than stone.',
    donorName: 'Kaelen',
    color: 'ivory',
    x: 1.6,
    z: 0.9,
    createdAt: Date.now() - 3600000 * 48,
  }
];

class StorageManager {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryFallback: Map<string, MemoryRecord> = new Map();
  private candleFallback: Map<string, CandleOffering> = new Map();

  constructor() {
    this.initDatabase();
  }

  private initDatabase(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
            const memoryStore = db.createObjectStore(MEMORIES_STORE, { keyPath: 'id' });
            memoryStore.createIndex('type', 'type', { unique: false });
            memoryStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(CANDLES_STORE)) {
            db.createObjectStore(CANDLES_STORE, { keyPath: 'id' });
          }
        };

        request.onsuccess = async (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          // Seed demo data if store is empty
          await this.ensureSeedData(db);
          resolve(db);
        };

        request.onerror = () => {
          console.warn('IndexedDB failed to open, utilizing memory/localStorage fallback.');
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async ensureSeedData(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MEMORIES_STORE, CANDLES_STORE], 'readonly');
        const countReq = tx.objectStore(MEMORIES_STORE).count();

        countReq.onsuccess = () => {
          if (countReq.result === 0) {
            const writeTx = db.transaction([MEMORIES_STORE, CANDLES_STORE], 'readwrite');
            const memStore = writeTx.objectStore(MEMORIES_STORE);
            for (const item of INITIAL_DEMO_MEMORIES) {
              memStore.put(item);
            }
            const candleStore = writeTx.objectStore(CANDLES_STORE);
            for (const candle of INITIAL_DEMO_CANDLES) {
              candleStore.put(candle);
            }
            writeTx.oncomplete = () => resolve();
            writeTx.onerror = () => resolve();
          } else {
            resolve();
          }
        };
        countReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --- MEMORIES CRUD ---

  async getAllMemories(): Promise<MemoryRecord[]> {
    const db = await this.initDatabase();
    if (!db) {
      const local = localStorage.getItem('afterlight_memories');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          return INITIAL_DEMO_MEMORIES;
        }
      }
      return INITIAL_DEMO_MEMORIES;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(MEMORIES_STORE, 'readonly');
        const store = tx.objectStore(MEMORIES_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const items: MemoryRecord[] = req.result || [];
          items.sort((a, b) => b.createdAt - a.createdAt);
          resolve(items);
        };
        req.onerror = () => resolve(INITIAL_DEMO_MEMORIES);
      } catch {
        resolve(INITIAL_DEMO_MEMORIES);
      }
    });
  }

  async saveMemory(memory: MemoryRecord): Promise<void> {
    const db = await this.initDatabase();
    if (!db) {
      const current = await this.getAllMemories();
      const idx = current.findIndex(m => m.id === memory.id);
      if (idx >= 0) current[idx] = memory;
      else current.unshift(memory);
      localStorage.setItem('afterlight_memories', JSON.stringify(current));
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(MEMORIES_STORE, 'readwrite');
        const store = tx.objectStore(MEMORIES_STORE);
        const req = store.put(memory);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async deleteMemory(id: string): Promise<void> {
    const db = await this.initDatabase();
    if (!db) {
      const current = (await this.getAllMemories()).filter(m => m.id !== id);
      localStorage.setItem('afterlight_memories', JSON.stringify(current));
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(MEMORIES_STORE, 'readwrite');
        const store = tx.objectStore(MEMORIES_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const list = await this.getAllMemories();
    const item = list.find(m => m.id === id);
    if (!item) return false;
    item.isFavorite = !item.isFavorite;
    item.updatedAt = Date.now();
    await this.saveMemory(item);
    return item.isFavorite;
  }

  // --- CANDLE OFFERINGS ---

  async getAllCandles(): Promise<CandleOffering[]> {
    const db = await this.initDatabase();
    if (!db) {
      const local = localStorage.getItem('afterlight_candles');
      if (local) {
        try { return JSON.parse(local); } catch { return INITIAL_DEMO_CANDLES; }
      }
      return INITIAL_DEMO_CANDLES;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(CANDLES_STORE, 'readonly');
        const store = tx.objectStore(CANDLES_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || INITIAL_DEMO_CANDLES);
        req.onerror = () => resolve(INITIAL_DEMO_CANDLES);
      } catch {
        resolve(INITIAL_DEMO_CANDLES);
      }
    });
  }

  async addCandle(candle: CandleOffering): Promise<void> {
    const db = await this.initDatabase();
    if (!db) {
      const list = await this.getAllCandles();
      list.push(candle);
      localStorage.setItem('afterlight_candles', JSON.stringify(list));
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(CANDLES_STORE, 'readwrite');
        const store = tx.objectStore(CANDLES_STORE);
        const req = store.put(candle);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- EXPORT & IMPORT BACKUP ---

  async exportBackupJson(): Promise<string> {
    const memories = await this.getAllMemories();
    const candles = await this.getAllCandles();
    const payload = {
      app: 'AFTERLIGHT',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      recordCount: memories.length,
      memories,
      candles,
      philosophy: 'Memories belong to humans, not corporations.'
    };
    return JSON.stringify(payload, null, 2);
  }

  async importBackupJson(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.memories)) {
        return { success: false, count: 0, error: 'Invalid backup format: missing memories array.' };
      }

      let count = 0;
      for (const raw of parsed.memories) {
        if (raw.id && raw.title && raw.content) {
          const validRecord: MemoryRecord = {
            id: String(raw.id),
            title: String(raw.title).slice(0, 150),
            type: ['story', 'remembrance', 'letter', 'audio_note'].includes(raw.type) ? raw.type : 'remembrance',
            content: String(raw.content),
            tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
            isFavorite: Boolean(raw.isFavorite),
            isDemo: false,
            authorName: raw.authorName ? String(raw.authorName) : undefined,
            personName: raw.personName ? String(raw.personName) : undefined,
            importantDate: raw.importantDate ? String(raw.importantDate) : undefined,
            favoriteSong: raw.favoriteSong ? String(raw.favoriteSong) : undefined,
            favoriteFood: raw.favoriteFood ? String(raw.favoriteFood) : undefined,
            meaningfulObjects: Array.isArray(raw.meaningfulObjects) ? raw.meaningfulObjects.map(String) : [],
            photoUrl: raw.photoUrl ? String(raw.photoUrl) : undefined,
            audioDataUrl: raw.audioDataUrl ? String(raw.audioDataUrl) : undefined,
            createdAt: Number(raw.createdAt) || Date.now(),
            updatedAt: Date.now(),
          };
          await this.saveMemory(validRecord);
          count++;
        }
      }

      if (Array.isArray(parsed.candles)) {
        for (const candle of parsed.candles) {
          if (candle.id && candle.message) {
            await this.addCandle({
              id: String(candle.id),
              message: String(candle.message),
              donorName: String(candle.donorName || 'Anonymous'),
              color: candle.color || 'gold',
              x: Number(candle.x) || (Math.random() * 4 - 2),
              z: Number(candle.z) || (Math.random() * 3 + 1),
              createdAt: Number(candle.createdAt) || Date.now()
            });
          }
        }
      }

      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Failed to parse JSON file' };
    }
  }

  async resetDemoData(): Promise<void> {
    const db = await this.initDatabase();
    if (!db) {
      localStorage.setItem('afterlight_memories', JSON.stringify(INITIAL_DEMO_MEMORIES));
      localStorage.setItem('afterlight_candles', JSON.stringify(INITIAL_DEMO_CANDLES));
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MEMORIES_STORE, CANDLES_STORE], 'readwrite');
        tx.objectStore(MEMORIES_STORE).clear();
        tx.objectStore(CANDLES_STORE).clear();

        for (const m of INITIAL_DEMO_MEMORIES) {
          tx.objectStore(MEMORIES_STORE).put(m);
        }
        for (const c of INITIAL_DEMO_CANDLES) {
          tx.objectStore(CANDLES_STORE).put(c);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const db = new StorageManager();
