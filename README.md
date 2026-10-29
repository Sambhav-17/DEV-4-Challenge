# AFTERLIGHT — Stories Beyond The Veil

> **“Some things deserve to live forever.”**  
> *Hacktoberfest 2026 Open-Source AI Challenge Week 4: “Ghost in the Machine”*

AFTERLIGHT is an immersive 3D digital remembrance experience where human memories become light, stories awaken, and open-weight AI preserves heritage without requiring users to surrender their most private moments to remote cloud monopolies.

---

## ✦ System Architecture

```
USER INTERFACE (React + Three.js + Web Audio)
       │
       ▼
LOCAL-FIRST VAULT (Client-Side IndexedDB)
       │
       ▼
MODEL ADAPTER (/api/ai/generate & /api/status)
       │
       ▼
LOCAL INFERENCE ENGINE (Ollama / vLLM / LM Studio)
       │
       ▼
OPEN-WEIGHT LANGUAGE MODEL (Qwen 2.5 7B / Mistral 7B)
```

---

## ✦ Core Features

1. **The Veil Gate (3D Memorial Garden)**
   - Real-time Three.js WebGL environment featuring the ancient megalithic Veil Gate.
   - Floating translucent spectral orb responsive to cursor proximity.
   - Instanced procedural drifting particles and golden marigold pollen.
   - Flickering beeswax candles and reflective slate stone floor.
   - Procedural Web Audio API soundscape (Tibetan temple bell, atmospheric drone, candle chime).

2. **The Haunted Story Engine**
   - Weaves real human inspirations, forgotten artifacts, and twilight settings into cinematic ghost stories.
   - Direct integration with local open-weight language models (`/api/ai/generate`).
   - Customizable narrative point-of-view, pacing, length, and ending resonance.
   - Instant export as Markdown, clipboard copy, and one-click saving to the local memory archive.

3. **The Ofrenda of Remembrance**
   - Respectfully inspired by Día de los Muertos.
   - Interactive memorial tiers honoring loved ones, family members, or ancestors.
   - Support for vintage portrait photographs, meaningful dates, favorite songs, traditional food offerings, and recorded voice memories.
   - **Memory Constellation Mode**: Transforms saved remembrances into interconnected star nodes connected by delicate golden threads.

4. **The Local-First Memory Archive**
   - 100% private in-browser storage using IndexedDB.
   - Full-text search and filtering by category, tags, and favorites.
   - Dynamically calculated archive metrics (records, summoned stories, words preserved).
   - Complete JSON backup export and validated import capability.

5. **The Haunted Ghost Terminal**
   - Amber-green phosphor CRT terminal with authentic scanlines.
   - Safe CLI commands: `help`, `status`, `memories`, `summon`, `whisper <query>`, `ofrenda`, `light <message>`, `archive`, `about`, `clear`.
   - Live backend model whisper transmission.

6. **Open-Source AI Lab & Judge Guide**
   - Transparent architecture visualization and model selector.
   - Live connectivity test prompt reporting genuine round-trip latency.
   - Rigorous audit of open-source licenses (OSI Apache 2.0 vs commercial open weights).
   - Dedicated "Under the Hood" tour for challenge judges.

---

## ✦ Quick Start & Local Execution

### Prerequisites
- Node.js 18+ or 20+
- (Optional but recommended) [Ollama](https://ollama.com/) for sovereign local model inference.

### 1. Clone & Install
```bash
git clone https://github.com/afterlight-veil/afterlight.git
cd afterlight
npm install
```

### 2. Start Local Open-Weight Model (Ollama)
```bash
# Pull and start Qwen 2.5 (7B Instruct - Apache 2.0)
ollama run qwen2.5:7b-instruct
```

### 3. Run AFTERLIGHT Full-Stack Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Open-Weight Model Support & Specifications

| Model | Parameter Size | License Class | OSI Compliant? | Recommended Hardware |
| :--- | :--- | :--- | :--- | :--- |
| **Qwen 2.5 7B** | 7.6B | Apache 2.0 | **Yes** | 6GB VRAM (Q4_K_M) / 16GB RAM |
| **Mistral 7B v0.3** | 7.3B | Apache 2.0 | **Yes** | 5.5GB VRAM / 16GB RAM |
| **DeepSeek R1 Distill 8B** | 8.0B | MIT License | **Yes** | 6.5GB VRAM |
| **Llama 3.2 3B** | 3.2B | Llama 3.2 Community | Open Weights | 2.5GB VRAM (Edge / Laptops) |
| **Phi-3.5 Mini** | 3.8B | MIT License | **Yes** | 3.0GB VRAM |

---

## ✦ Privacy Manifesto

1. **Zero Remote Surrender**: Your family photographs, voice recordings, and intimate letters are stored exclusively in your browser's private sandboxed IndexedDB storage.
2. **Local Inference**: Story summoning can execute on your local machine with zero outbound data transmission.
3. **Immortality Guarantee**: You can export your entire memory vault to standard JSON at any time.

*Built for Hacktoberfest 2026.*
