// src/lib/tts/TTSManager.ts

export interface TTSConfig {
    model: ArrayBuffer;
    tokens: ArrayBuffer;
    lexicon?: ArrayBuffer;
    sampleRate: number;
}

export interface VoicePreset {
    id: string;
    name: string;
    gender: 'female' | 'male';
    pitch: number;
    rate: number;
    isNeural?: boolean;
    modelUrl?: string;
    tokensUrl?: string;
    lang?: 'en' | 'hi' | 'hinglish';
}

export const VOICE_PRESETS: VoicePreset[] = [
    // === ENGLISH VOICES ===
    { 
        id: 'eng_f1_neural', 
        name: 'Exa (Natural F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        lang: 'en',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-kristin-medium/resolve/main/en_US-kristin-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-kristin-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'eng_f2_neural', 
        name: 'Exa (Friendly F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.05, 
        isNeural: true,
        lang: 'en',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/en_US-amy-low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/tokens.txt'
    },
    { 
        id: 'eng_f3_sweet', 
        name: 'Exa (Sweet F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        lang: 'en',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-medium/resolve/main/en_US-lessac-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'eng_m1_neural', 
        name: 'Exa (Tutor M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        lang: 'en',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-low/resolve/main/en_US-lessac-low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-low/resolve/main/tokens.txt'
    },
    { 
        id: 'eng_m2_chill', 
        name: 'Exa (Chill M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 0.95,
        isNeural: true,
        lang: 'en',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-joe-medium/resolve/main/en_US-joe-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-joe-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'eng_m3_formal', 
        name: 'Exa (Deep M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 0.9,
        isNeural: true,
        lang: 'en',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-ryan-medium/resolve/main/en_US-ryan-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-ryan-medium/resolve/main/tokens.txt'
    },

    // === HINDI VOICES ===
    { 
        id: 'hin_f1_neural', 
        name: 'Exa (Bharat F)', 
        gender: 'female', 
        pitch: 1.0,
        rate: 1.0,
        isNeural: true,
        lang: 'hi',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-priyamvada-medium/resolve/main/hi_IN-priyamvada-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-priyamvada-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hin_f2_soft', 
        name: 'Exa (Soft F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 0.9,
        isNeural: true,
        lang: 'hi',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-priyamvada-medium/resolve/main/hi_IN-priyamvada-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-priyamvada-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hin_f3_expressive', 
        name: 'Exa (Kavya F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.1,
        isNeural: true,
        lang: 'hi',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-priyamvada-medium/resolve/main/hi_IN-priyamvada-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-priyamvada-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hin_m1_deep', 
        name: 'Exa (Kabir M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 0.95,
        isNeural: true,
        lang: 'hi',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-rohan-medium/resolve/main/hi_IN-rohan-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-rohan-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hin_m2_bright', 
        name: 'Exa (Raj M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 1.0,
        isNeural: true,
        lang: 'hi',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-pratham-medium/resolve/main/hi_IN-pratham-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-pratham-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hin_m3_gentle', 
        name: 'Exa (Amit M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 1.05,
        isNeural: true,
        lang: 'hi',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-rohan-medium/resolve/main/hi_IN-rohan-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-hi_IN-rohan-medium/resolve/main/tokens.txt'
    },

    // === HINGLISH VOICES ===
    { 
        id: 'hgl_f1_desigirl', 
        name: 'Exa (Desi F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0,
        isNeural: true,
        lang: 'hinglish',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/en_US-amy-low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/tokens.txt'
    },
    { 
        id: 'hgl_f2_urban', 
        name: 'Exa (Metro F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.05,
        isNeural: true,
        lang: 'hinglish',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-kristin-medium/resolve/main/en_US-kristin-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-kristin-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hgl_f3_classy', 
        name: 'Exa (Classy F)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0,
        isNeural: true,
        lang: 'hinglish',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-medium/resolve/main/en_US-lessac-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hgl_m1_cool', 
        name: 'Exa (Dude M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 1.0,
        isNeural: true,
        lang: 'hinglish',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-low/resolve/main/en_US-lessac-low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-low/resolve/main/tokens.txt'
    },
    { 
        id: 'hgl_m2_prof', 
        name: 'Exa (Pro M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 0.95,
        isNeural: true,
        lang: 'hinglish',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-joe-medium/resolve/main/en_US-joe-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-joe-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'hgl_m3_bro', 
        name: 'Exa (Bro M)', 
        gender: 'male', 
        pitch: 1.0, 
        rate: 0.9,
        isNeural: true,
        lang: 'hinglish',
        modelUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-ryan-medium/resolve/main/en_US-ryan-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/vits-piper-en_US-ryan-medium/resolve/main/tokens.txt'
    }
];

const ESPEAK_FILES = [
    'phondata',
    'phonindex',
    'phontab',
    'intonations',
    'en_dict',
    'hi_dict',
    'lang/gmw/en',
    'lang/gmw/en-US',
    'lang/inc/hi'
];

export class TTSManager {
    private static instance: TTSManager;
    private worker: Worker | null = null;
    private isInitialized = false;
    private audioContext: AudioContext | null = null;
    private activeSources: AudioBufferSourceNode[] = [];
    private initializationPromise: Promise<void> | null = null;
    private loadedModelUrl: string | null = null;
    private espeakLoaded = false;
    private currentPitch = 1.0;
    private speakQueue: Promise<void> = Promise.resolve();

    // Default URLs
    private readonly DEFAULT_MODEL_URL = 'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/en_US-amy-low.onnx';
    private readonly DEFAULT_TOKENS_URL = 'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/tokens.txt';

    private constructor() {}

    static getInstance() {
        if (!this.instance) {
            this.instance = new TTSManager();
        }
        return this.instance;
    }

    async init(modelUrl?: string, tokensUrl?: string) {
        const urlToLoad = modelUrl || this.DEFAULT_MODEL_URL;
        const tokensToLoad = tokensUrl || this.DEFAULT_TOKENS_URL;

        if (this.isInitialized && this.loadedModelUrl === urlToLoad) return;
        
        // Single inflight initialization
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = (async () => {
            try {
                // 1. Fetch models (using cache if available)
                const [model, tokens] = await Promise.all([
                    this.fetchWithCache(urlToLoad),
                    this.fetchWithCache(tokensToLoad)
                ]);

                let espeakData: { filename: string; buffer: ArrayBuffer }[] | undefined = undefined;
                const transferList: ArrayBuffer[] = [model, tokens];

                // 2. Fetch and transfer espeak-ng-data files ONLY once to optimize startup latency and memory usage
                if (!this.espeakLoaded) {
                    console.log('[TTSManager] First-time loading espeak-ng-data files...');
                    const espeakBuffers = await Promise.all(
                        ESPEAK_FILES.map(file => this.fetchWithCache(`/espeak-ng-data/${file}`))
                    );
                    espeakData = ESPEAK_FILES.map((filename, i) => ({
                        filename,
                        buffer: espeakBuffers[i]
                    }));
                    transferList.push(...espeakBuffers);
                    this.espeakLoaded = true;
                }

                // 3. Initialize Worker only if not already spawned
                if (!this.worker) {
                    console.log('[TTSManager] Spawning new worker...');
                    this.worker = new Worker(new URL('./sherpa-worker.ts', import.meta.url));
                } else {
                    console.log('[TTSManager] Reusing existing worker to avoid WebAssembly reload/OOM...');
                }
                
                return new Promise<void>((resolve, reject) => {
                    if (!this.worker) return reject('Worker failed to start');

                    const handleInitMessage = (e: MessageEvent) => {
                        if (e.data.type === 'INIT_DONE') {
                            this.worker?.removeEventListener('message', handleInitMessage);
                            this.isInitialized = true;
                            this.loadedModelUrl = urlToLoad;
                            this.initializationPromise = null;
                            resolve();
                        } else if (e.data.type === 'ERROR') {
                            this.worker?.removeEventListener('message', handleInitMessage);
                            this.initializationPromise = null;
                            reject(e.data.payload);
                        }
                    };

                    this.worker.addEventListener('message', handleInitMessage);

                    this.worker.postMessage({
                        type: 'INIT',
                        payload: {
                            model,
                            tokens,
                            espeakData,
                            sampleRate: 22050
                        }
                    }, transferList);
                });
            } catch (error) {
                console.error('[TTSManager] Initialization failed:', error);
                this.initializationPromise = null;
                if (this.worker) {
                    try { this.worker.terminate(); } catch (e) {}
                    this.worker = null;
                }
                this.isInitialized = false;
                throw error;
            }
        })();

        return this.initializationPromise;
    }

    private async fetchWithCache(url: string): Promise<ArrayBuffer> {
        const cacheName = 'exa-tts-models-v1';
        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                const buffer = await cachedResponse.arrayBuffer();
                if (buffer && buffer.byteLength > 0) {
                    console.log(`[TTSManager] Persistent Cache Hit: ${url} (${buffer.byteLength} bytes)`);
                    return buffer;
                } else {
                    console.warn(`[TTSManager] Cached response was empty/corrupted for ${url}, deleting from cache...`);
                    await cache.delete(url);
                }
            }

            console.log(`[TTSManager] Downloading and caching model: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
            
            const buffer = await response.arrayBuffer();
            if (!buffer || buffer.byteLength === 0) {
                throw new Error(`Downloaded empty/corrupted buffer from ${url}`);
            }

            // Create a fresh, unredirected, fully resolved response using the ArrayBuffer to put in cache
            // We use buffer.slice(0) to clone it so the returned buffer is still usable
            const cacheResponse = new Response(buffer.slice(0), {
                headers: {
                    'content-type': response.headers.get('content-type') || 'application/octet-stream',
                    'content-length': buffer.byteLength.toString()
                }
            });
            await cache.put(url, cacheResponse);
            console.log(`[TTSManager] Successfully cached ${url} (${buffer.byteLength} bytes)`);
            
            return buffer;
        } catch (e) {
            console.warn(`[TTSManager] Cache/Fetch error for ${url}:`, e);
            // Fallback to direct fetch if cache fails
            const response = await fetch(url);
            return await response.arrayBuffer();
        }
    }

    private async speakInternal(text: string, speed = 1.0, pitch = 1.0, modelUrl?: string, tokensUrl?: string) {
        this.currentPitch = pitch;

        if (!this.isInitialized || (modelUrl && modelUrl !== this.loadedModelUrl)) {
            await this.init(modelUrl, tokensUrl);
        }

        return new Promise<void>((resolve, reject) => {
            if (!this.worker) return reject('Worker not available');

            const handleMessage = (e: MessageEvent) => {
                if (e.data.type === 'GENERATE_DONE') {
                    this.worker?.removeEventListener('message', handleMessage);
                    this.playAudio(e.data.payload.samples, e.data.payload.sampleRate)
                        .then(resolve)
                        .catch(reject);
                } else if (e.data.type === 'ERROR') {
                    this.worker?.removeEventListener('message', handleMessage);
                    reject(e.data.payload);
                }
            };

            this.worker.addEventListener('message', handleMessage);

            // Speed compensation formula: Generated Speed = Requested Speed / Pitch Factor
            // This maintains perfect timing when the playbackRate is shifted inside AudioContext playout.
            const ttsSpeed = speed / pitch;

            this.worker.postMessage({
                type: 'GENERATE',
                payload: { text, speed: ttsSpeed }
            });
        });
    }

    async speak(text: string, speed = 1.0, pitch = 1.0, modelUrl?: string, tokensUrl?: string) {
        // Queue the speech sequentially to prevent concurrent worker thread collisions
        this.speakQueue = this.speakQueue.then(() => {
            return this.speakInternal(text, speed, pitch, modelUrl, tokensUrl);
        }).catch(err => {
            console.error("[TTSManager] Error in speech queue:", err);
        });
        return this.speakQueue;
    }

    private async playAudio(samples: Float32Array, sampleRate: number) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                latencyHint: 'interactive'
            });
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const buffer = this.audioContext.createBuffer(1, samples.length, sampleRate);
        buffer.getChannelData(0).set(samples);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // Apply native pitch shifting directly inside the AudioContext playout chain
        source.playbackRate.value = this.currentPitch;

        source.connect(this.audioContext.destination);
        
        this.activeSources.push(source);
        source.start();

        return new Promise<void>((resolve) => {
            source.onended = () => {
                this.activeSources = this.activeSources.filter(s => s !== source);
                resolve();
            };
        });
    }

    stop() {
        // Stop all active sources instead of closing the context
        this.activeSources.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        this.activeSources = [];
        
        // Reset the sequential speech queue to a freshly resolved state
        this.speakQueue = Promise.resolve();
        
        if (this.audioContext?.state === 'running') {
            this.audioContext.suspend();
        }
    }
}

export const ttsManager = TTSManager.getInstance();
