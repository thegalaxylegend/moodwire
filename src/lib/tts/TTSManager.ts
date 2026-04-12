// src/lib/tts/TTSManager.ts

export interface TTSConfig {
    model: ArrayBuffer;
    tokens: ArrayBuffer;
    lexicon?: ArrayBuffer;
    sampleRate: number;
}

export class TTSManager {
    private static instance: TTSManager;
    private worker: Worker | null = null;
    private isInitialized = false;
    private audioContext: AudioContext | null = null;
    private activeSources: AudioBufferSourceNode[] = [];
    private initializationPromise: Promise<void> | null = null;
    private loadedModelUrl: string | null = null;

    // Default URLs
    private readonly DEFAULT_MODEL_URL = 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-amy-low/resolve/main/model.onnx';
    private readonly DEFAULT_TOKENS_URL = 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-amy-low/resolve/main/tokens.txt';

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

                // 2. Initialize Worker
                this.worker = new Worker(new URL('./sherpa-worker.ts', import.meta.url), { type: 'module' });
                
                return new Promise<void>((resolve, reject) => {
                    if (!this.worker) return reject('Worker failed to start');

                    this.worker.onmessage = (e) => {
                        if (e.data.type === 'INIT_DONE') {
                            this.isInitialized = true;
                            this.loadedModelUrl = urlToLoad;
                            this.initializationPromise = null;
                            resolve();
                        } else if (e.data.type === 'ERROR') {
                            this.initializationPromise = null;
                            reject(e.data.payload);
                        }
                    };

                    this.worker.postMessage({
                        type: 'INIT',
                        payload: {
                            model,
                            tokens,
                            sampleRate: 22050
                        }
                    });
                });
            } catch (error) {
                console.error('[TTSManager] Initialization failed:', error);
                this.initializationPromise = null;
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
                console.log(`[TTSManager] Persistent Cache Hit: ${url}`);
                return await cachedResponse.arrayBuffer();
            }

            console.log(`[TTSManager] Downloading and caching model: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
            
            // Put in cache before consuming
            await cache.put(url, response.clone());
            
            return await response.arrayBuffer();
        } catch (e) {
            console.warn(`[TTSManager] Cache/Fetch error for ${url}:`, e);
            // Fallback to direct fetch if cache fails
            const response = await fetch(url);
            return await response.arrayBuffer();
        }
    }

    async speak(text: string, speed = 1.0, modelUrl?: string, tokensUrl?: string) {
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
            this.worker.postMessage({
                type: 'GENERATE',
                payload: { text, speed }
            });
        });
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
        
        if (this.audioContext?.state === 'running') {
            this.audioContext.suspend();
        }
    }
}

export const ttsManager = TTSManager.getInstance();
