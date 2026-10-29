import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import AdmZip from 'adm-zip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// CORS middleware for Vercel and preview deployments
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Configurable runtime AI settings
let runtimeAiConfig = {
  endpoint: process.env.OLLAMA_HOST || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct',
  temperature: 0.7,
  provider: 'ollama' as 'ollama' | 'openai_compatible' | 'gemini_fallback',
  customApiKey: process.env.OPENAI_API_KEY || '',
};

// Open-weight models registry with licenses & hardware specs
const MODEL_REGISTRY = [
  {
    id: 'qwen2.5:7b-instruct',
    name: 'Qwen 2.5 (7B Instruct)',
    family: 'Qwen / Alibaba Cloud',
    parameterSize: '7.6 Billion',
    license: 'Apache 2.0 (True Open-Source)',
    isTrueOpenSource: true,
    recommendedVRAM: '6GB VRAM (Q4_K_M) / 16GB FP16',
    description: 'Premier multilingual open-weight model with exceptional literary nuance and evocative dialogue.',
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B Instruct v0.3',
    family: 'Mistral AI',
    parameterSize: '7.3 Billion',
    license: 'Apache 2.0 (True Open-Source)',
    isTrueOpenSource: true,
    recommendedVRAM: '5.5GB VRAM (Q4_K_M) / 16GB FP16',
    description: 'Fast, atmospheric, high-coherence open model with sliding window attention.',
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 (3B Instruct)',
    family: 'Meta AI',
    parameterSize: '3.2 Billion',
    license: 'Llama 3.2 Community License (Open Weights)',
    isTrueOpenSource: false,
    recommendedVRAM: '2.5GB VRAM (Ultra-lightweight on edge/laptops)',
    description: 'Highly efficient compact model ideal for low-spec laptops and edge devices.',
  },
  {
    id: 'deepseek-r1:8b',
    name: 'DeepSeek R1 Distill (8B)',
    family: 'DeepSeek AI',
    parameterSize: '8.0 Billion',
    license: 'MIT License (True Open-Source)',
    isTrueOpenSource: true,
    recommendedVRAM: '6.5GB VRAM (Q4_K_M)',
    description: 'Reasoning-distilled open model capable of intricate plot structure and emotional depth.',
  },
  {
    id: 'phi3.5:3.8b',
    name: 'Phi-3.5 Mini (3.8B Instruct)',
    family: 'Microsoft',
    parameterSize: '3.8 Billion',
    license: 'MIT License (True Open-Source)',
    isTrueOpenSource: true,
    recommendedVRAM: '3.0GB VRAM',
    description: 'Compact mathematical & narrative efficiency with long 128k context support.',
  }
];

// Helper: Check local Ollama or remote server connectivity
async function checkOllamaHealth(endpoint: string, timeoutMs: number = 2000): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${endpoint}/api/version`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(id);
    const latency = Date.now() - start;
    if (res.ok) {
      return { ok: true, latencyMs: latency };
    }
    return { ok: false, latencyMs: latency, error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.name === 'AbortError' ? 'Connection timed out' : 'Refused / Offline' };
  }
}

// Helper: Build source code zip
function createSourceArchiveBuffer(): Buffer {
  const rootDir = process.cwd();
  const existingZip = path.join(rootDir, 'afterlight-source.zip');
  if (fs.existsSync(existingZip)) {
    try {
      return fs.readFileSync(existingZip);
    } catch {
      // Fall through to dynamic zip creation
    }
  }

  const zip = new AdmZip();
  const rootFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
    'README.md',
    '.env.example',
    '.gitignore',
    'server.ts',
    'vercel.json',
  ];

  for (const file of rootFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      zip.addLocalFile(fullPath);
    }
  }

  // Add src folder
  const srcDir = path.join(rootDir, 'src');
  if (fs.existsSync(srcDir)) {
    zip.addLocalFolder(srcDir, 'src');
  }

  const publicDir = path.join(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    zip.addLocalFolder(publicDir, 'public');
  }

  return zip.toBuffer();
}

// Download source zip route
app.get(['/api/download-zip', '/download-zip', '/afterlight-source.zip'], (_req: Request, res: Response) => {
  try {
    const zipBuffer = createSourceArchiveBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="afterlight-source.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create zip archive: ' + err.message });
  }
});

// 1. Backend Status
app.get(['/api/status', '/status'], async (_req: Request, res: Response) => {
  const health = await checkOllamaHealth(runtimeAiConfig.endpoint, 1500);
  const geminiAvailable = Boolean(process.env.GEMINI_API_KEY);

  let status: 'connected' | 'remote_configured' | 'unavailable' = 'unavailable';
  let message = 'Local open-weight model server (Ollama) is not running on ' + runtimeAiConfig.endpoint;

  if (health.ok) {
    status = 'connected';
    message = `Local inference active at ${runtimeAiConfig.endpoint} (${health.latencyMs}ms)`;
  } else if (runtimeAiConfig.endpoint.startsWith('https://') || runtimeAiConfig.endpoint.includes('.ngrok') || runtimeAiConfig.endpoint.includes('.run.app')) {
    status = 'remote_configured';
    message = `Remote compatible inference endpoint configured at ${runtimeAiConfig.endpoint}`;
  } else if (geminiAvailable) {
    message = 'Local Ollama unreachable. Gemini server-side fallback available for demo purposes.';
  }

  res.json({
    status,
    endpoint: runtimeAiConfig.endpoint,
    model: runtimeAiConfig.model,
    latencyMs: health.ok ? health.latencyMs : undefined,
    provider: runtimeAiConfig.provider,
    geminiFallbackAvailable: geminiAvailable,
    message,
  });
});

// 2. Models list
app.get(['/api/models', '/models'], (_req: Request, res: Response) => {
  res.json({
    models: MODEL_REGISTRY,
    currentModel: runtimeAiConfig.model,
    currentEndpoint: runtimeAiConfig.endpoint,
  });
});

// 3. AI Config update
app.post(['/api/ai/config', '/ai/config'], (req: Request, res: Response) => {
  const { endpoint, model, provider, customApiKey } = req.body;
  if (endpoint && typeof endpoint === 'string') {
    runtimeAiConfig.endpoint = endpoint.replace(/\/+$/, '');
  }
  if (model && typeof model === 'string') {
    runtimeAiConfig.model = model;
  }
  if (provider && ['ollama', 'openai_compatible', 'gemini_fallback'].includes(provider)) {
    runtimeAiConfig.provider = provider;
  }
  if (typeof customApiKey === 'string') {
    runtimeAiConfig.customApiKey = customApiKey;
  }

  res.json({
    success: true,
    config: runtimeAiConfig,
  });
});

// 4. Test Prompt (Under the Hood / AI Lab live verification)
app.post(['/api/ai/test', '/ai/test'], async (_req: Request, res: Response) => {
  const testPrompt = 'Ping from the Veil Gate. Respond in one poetic sentence acknowledging the memorial archive.';
  const start = Date.now();

  // Fast check: is local Ollama reachable?
  const health = await checkOllamaHealth(runtimeAiConfig.endpoint, 600);

  if (health.ok) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${runtimeAiConfig.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: runtimeAiConfig.model,
          prompt: testPrompt,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data: any = await response.json();
        return res.json({
          success: true,
          source: 'local_ollama',
          model: runtimeAiConfig.model,
          latencyMs: Date.now() - start,
          text: data.response || 'The gate awakens; your light is cataloged.',
        });
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Check if Gemini fallback is permitted and available
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: testPrompt,
      });
      return res.json({
        success: true,
        source: 'gemini_fallback',
        model: 'gemini-3.8-flash (Demonstration Fallback)',
        latencyMs: Date.now() - start,
        text: result.text || 'The gate stands open between machine and memory.',
      });
    } catch (err: any) {
      return res.status(503).json({
        success: false,
        error: 'Inference test failed: ' + (err.message || 'Model unreachable'),
        latencyMs: Date.now() - start,
      });
    }
  }

  return res.status(503).json({
    success: false,
    source: 'none',
    error: `Local Ollama instance at ${runtimeAiConfig.endpoint} is offline. Please start Ollama with 'ollama run ${runtimeAiConfig.model}' or configure a reachable endpoint in the AI Lab.`,
    latencyMs: Date.now() - start,
  });
});

// 5. Generate Ghost Story or Whisper
app.post(['/api/ai/generate', '/ai/generate'], async (req: Request, res: Response) => {
  const {
    setting = 'abandoned observatory',
    mood = 'melancholic and mysterious',
    length = 'medium',
    inspirationType = 'custom',
    inspirationText = '',
    pov = 'first',
    pacing = 'slow-burn',
    recurringCharacter,
    endingStyle = 'bittersweet',
    customPrompt,
    isWhisper = false,
  } = req.body;

  let prompt = '';
  if (isWhisper && customPrompt) {
    prompt = `You are the guardian spirit of AFTERLIGHT, an ancient digital memorial archive where human memories transcend death.
The user speaks to you: "${customPrompt}"
Respond as an ethereal, respectful, profound storyteller in 2 to 3 poetic sentences. Do not use generic AI greetings or corporate disclaimers. Speak like an ancient spirit that preserves human stories.`;
  } else {
    const lengthGuide = length === 'short' ? 'about 250 words' : length === 'long' ? 'about 600 words' : 'about 400 words';
    prompt = `You are AFTERLIGHT’s master supernatural storyteller, inspired by classic literary ghost stories (Shirley Jackson, Edgar Allan Poe, Guillermo del Toro, M.R. James).
Write a haunting, deeply atmospheric supernatural ghost story honoring these parameters:
- Setting: ${setting}
- Atmospheric Mood: ${mood}
- Story Inspiration (${inspirationType}): "${inspirationText || 'An antique key found in a clockmaker’s drawer'}"
- Narrative Point of View: ${pov === 'first' ? 'First-person ("I")' : 'Third-person ("He/She/They")'}
- Narrative Pacing: ${pacing}
- Ending Style: ${endingStyle}
${recurringCharacter ? `- Key Character / Figure: ${recurringCharacter}` : ''}
- Target Length: ${lengthGuide}

STORYTELLING RULES:
1. Ground the supernatural in palpable tactile details: the smell of damp stone, the click of cold mechanisms, the warmth of old tea, the glow of candlelight.
2. The ghost or presence should symbolize love, forgotten history, regret, or a promise made to the living.
3. No clichés, no jump scares, no cheesy slasher tropes. Emphasize emotional resonance and eerie beauty.
4. Lead directly into the story. Do NOT include markdown meta-commentary like "Here is your story:".`;
  }

  const start = Date.now();

  // Fast check: is local Ollama reachable?
  const health = await checkOllamaHealth(runtimeAiConfig.endpoint, 600);

  if (health.ok) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s for local generation
      const response = await fetch(`${runtimeAiConfig.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: runtimeAiConfig.model,
          prompt,
          stream: false,
          options: {
            temperature: runtimeAiConfig.temperature,
          }
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data: any = await response.json();
        return res.json({
          success: true,
          source: 'local_ollama',
          model: runtimeAiConfig.model,
          latencyMs: Date.now() - start,
          text: data.response,
        });
      }
    } catch (err: any) {
      // Local Ollama unavailable
    }
  }

  // Fallback to Gemini if API key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      return res.json({
        success: true,
        source: 'gemini_fallback',
        model: 'gemini-3.8-flash (Demonstration Fallback)',
        latencyMs: Date.now() - start,
        text: result.text || 'The veil parted, yet no words could cross the silence.',
      });
    } catch (err: any) {
      return res.status(503).json({
        success: false,
        error: 'Failed to generate story: ' + (err.message || 'Remote inference error'),
      });
    }
  }

  // Honest failure state when no model backend is reachable
  return res.status(503).json({
    success: false,
    source: 'none',
    error: `No language model could be reached. Ollama is not responding on ${runtimeAiConfig.endpoint}. Please start Ollama or configure an accessible endpoint in the Open-Source AI Lab.`,
    latencyMs: Date.now() - start,
  });
});

// Vite middleware in development or static in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AFTERLIGHT Server listening on http://0.0.0.0:${PORT}`);
  });
}

// In Vercel serverless environment, VERCEL is set and Vercel manages the HTTP lifecycle
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start AFTERLIGHT server:', err);
  });
}

export default app;
