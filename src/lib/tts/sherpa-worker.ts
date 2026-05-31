// src/lib/tts/sherpa-worker.ts

const SHERPA_ONNX_WASM_JS_URL = '/sherpa-onnx-wasm-main-tts.js';

let tts: OfflineTts | null = null;
let wasmModule: any = null;
let resolveRuntimeInitialized: (() => void) | null = null;

const runtimeInitializedPromise = new Promise<void>((resolve) => {
    resolveRuntimeInitialized = resolve;
});

(self as any).Module = {
    locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
            return '/sherpa-onnx-wasm-main-tts.wasm';
        }
        return path;
    },
    onRuntimeInitialized: () => {
        if (resolveRuntimeInitialized) {
            resolveRuntimeInitialized();
        }
    }
};

// @ts-expect-error - importScripts is a worker global function not declared in typings
importScripts(SHERPA_ONNX_WASM_JS_URL);

class OfflineTts {
    private handle: number;
    private Module: any;

    constructor(Module: any, config: any) {
        this.Module = Module;

        const vitsConfig = config.offlineTtsModelConfig.offlineTtsVitsModelConfig;
        
        // Allocate strings in WASM memory
        const modelLen = Module.lengthBytesUTF8(vitsConfig.model || '') + 1;
        const lexiconLen = Module.lengthBytesUTF8(vitsConfig.lexicon || '') + 1;
        const tokensLen = Module.lengthBytesUTF8(vitsConfig.tokens || '') + 1;
        const dataDirLen = Module.lengthBytesUTF8(vitsConfig.dataDir || '') + 1;
        const dictDir = '';
        const dictDirLen = Module.lengthBytesUTF8(dictDir) + 1;
        const providerLen = Module.lengthBytesUTF8(config.offlineTtsModelConfig.provider || 'cpu') + 1;
        const ruleFstsLen = Module.lengthBytesUTF8(config.ruleFsts || '') + 1;
        const ruleFarsLen = Module.lengthBytesUTF8(config.ruleFars || '') + 1;
        
        const totalStringBytes = modelLen + lexiconLen + tokensLen + dataDirLen + dictDirLen + providerLen + ruleFstsLen + ruleFarsLen;
        const stringBuffer = Module._malloc(totalStringBytes);
        
        let offset = 0;
        
        const modelStrPtr = stringBuffer + offset;
        Module.stringToUTF8(vitsConfig.model || '', modelStrPtr, modelLen);
        offset += modelLen;
        
        const lexiconStrPtr = stringBuffer + offset;
        Module.stringToUTF8(vitsConfig.lexicon || '', lexiconStrPtr, lexiconLen);
        offset += lexiconLen;
        
        const tokensStrPtr = stringBuffer + offset;
        Module.stringToUTF8(vitsConfig.tokens || '', tokensStrPtr, tokensLen);
        offset += tokensLen;
        
        const dataDirStrPtr = stringBuffer + offset;
        Module.stringToUTF8(vitsConfig.dataDir || '', dataDirStrPtr, dataDirLen);
        offset += dataDirLen;
        
        const dictDirStrPtr = stringBuffer + offset;
        Module.stringToUTF8(dictDir, dictDirStrPtr, dictDirLen);
        offset += dictDirLen;
        
        const providerStrPtr = stringBuffer + offset;
        Module.stringToUTF8(config.offlineTtsModelConfig.provider || 'cpu', providerStrPtr, providerLen);
        offset += providerLen;
        
        const ruleFstsStrPtr = stringBuffer + offset;
        Module.stringToUTF8(config.ruleFsts || '', ruleFstsStrPtr, ruleFstsLen);
        offset += ruleFstsLen;
        
        const ruleFarsStrPtr = stringBuffer + offset;
        Module.stringToUTF8(config.ruleFars || '', ruleFarsStrPtr, ruleFarsLen);
        offset += ruleFarsLen;
        
        // Allocate the 60-byte struct
        const ptr = Module._malloc(60);
        
        // VITS config
        Module.setValue(ptr + 0, modelStrPtr, 'i8*');
        Module.setValue(ptr + 4, lexiconStrPtr, 'i8*');
        Module.setValue(ptr + 8, tokensStrPtr, 'i8*');
        Module.setValue(ptr + 12, dataDirStrPtr, 'i8*');
        Module.setValue(ptr + 16, vitsConfig.noiseScale ?? 0.667, 'float');
        Module.setValue(ptr + 20, vitsConfig.noiseScaleW ?? 0.8, 'float');
        Module.setValue(ptr + 24, vitsConfig.lengthScale ?? 1.0, 'float');
        Module.setValue(ptr + 28, dictDirStrPtr, 'i8*');
        
        // Model config
        Module.setValue(ptr + 32, config.offlineTtsModelConfig.numThreads ?? 1, 'i32');
        Module.setValue(ptr + 36, config.offlineTtsModelConfig.debug ?? 0, 'i32');
        Module.setValue(ptr + 40, providerStrPtr, 'i8*');
        
        // TTS config
        Module.setValue(ptr + 44, ruleFstsStrPtr, 'i8*');
        Module.setValue(ptr + 48, config.maxNumSentences ?? 1, 'i32');
        Module.setValue(ptr + 52, ruleFarsStrPtr, 'i8*');
        Module.setValue(ptr + 56, config.silenceScale ?? 0.2, 'float');
        
        try {
            this.handle = Module._SherpaOnnxCreateOfflineTts(ptr);
            if (!this.handle) {
                throw new Error('SherpaOnnxCreateOfflineTts returned null handle. Memory alignment or path resolution issue.');
            }
        } finally {
            Module._free(ptr);
            Module._free(stringBuffer);
        }
    }

    generate(text: string, sid: number = 0, speed: number = 1.0) {
        if (!this.handle) {
            throw new Error('TTS handle is not initialized');
        }

        const textLen = this.Module.lengthBytesUTF8(text) + 1;
        const textPtr = this.Module._malloc(textLen);
        this.Module.stringToUTF8(text, textPtr, textLen);

        try {
            const h = this.Module._SherpaOnnxOfflineTtsGenerate(this.handle, textPtr, sid, speed);
            if (!h) {
                throw new Error('TTS generation failed');
            }

            const base = h / 4;
            const samplesPtr = this.Module.HEAPU32[base];
            const numSamples = this.Module.HEAP32[base + 1];
            const sampleRate = this.Module.HEAP32[base + 2];

            const heapSamples = this.Module.HEAPF32.subarray(samplesPtr / 4, samplesPtr / 4 + numSamples);
            const samples = new Float32Array(heapSamples);

            this.Module._SherpaOnnxDestroyOfflineTtsGeneratedAudio(h);

            return {
                samples,
                sampleRate
            };
        } finally {
            this.Module._free(textPtr);
        }
    }

    free() {
        if (this.handle) {
            this.Module._SherpaOnnxDestroyOfflineTts(this.handle);
            this.handle = 0;
        }
    }
}

self.onmessage = async (e: MessageEvent) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            try {
                // Wait for WebAssembly compilation and runtime boot
                await runtimeInitializedPromise;
                wasmModule = (self as any).Module;

                // Resolve FS either from global scope or Module
                const FS = (self as any).FS || wasmModule.FS;
                if (!FS) {
                    throw new Error('Emscripten FS object not found in worker global scope or Module');
                }

                // Write ArrayBuffers to virtual filesystem
                FS.writeFile('/model.onnx', new Uint8Array(payload.model));
                FS.writeFile('/tokens.txt', new Uint8Array(payload.tokens));
                
                if (payload.lexicon) {
                    FS.writeFile('/lexicon.txt', new Uint8Array(payload.lexicon));
                }

                // Create espeak-ng-data directory structure in virtual FS
                try { FS.mkdir('/espeak-ng-data'); } catch (err) {}
                try { FS.mkdir('/espeak-ng-data/voices'); } catch (err) {}
                try { FS.mkdir('/espeak-ng-data/voices/!v'); } catch (err) {}
                try { FS.mkdir('/espeak-ng-data/lang'); } catch (err) {}
                try { FS.mkdir('/espeak-ng-data/lang/gmw'); } catch (err) {}
                try { FS.mkdir('/espeak-ng-data/lang/inc'); } catch (err) {}

                // Write preloaded espeak files to virtual FS
                if (payload.espeakData && Array.isArray(payload.espeakData)) {
                    for (const file of payload.espeakData) {
                        FS.writeFile(`/espeak-ng-data/${file.filename}`, new Uint8Array(file.buffer));
                    }
                }

                // Initializing TTS VITS structure (aligned to the 60-byte C++ struct layout)
                const vitsConfig = {
                    model: '/model.onnx',
                    lexicon: payload.lexicon ? '/lexicon.txt' : '',
                    tokens: '/tokens.txt',
                    noiseScale: 0.667,
                    noiseScaleW: 0.8,
                    lengthScale: 1.0,
                    dataDir: '/espeak-ng-data',
                };

                const ttsConfig = {
                    offlineTtsModelConfig: {
                        offlineTtsVitsModelConfig: vitsConfig,
                        // MUST be 1 to prevent OnnxRuntimeException pthread failures in sandbox/cross-origin limited webviews
                        numThreads: 1, 
                        debug: 0,
                        provider: 'cpu',
                    },
                    ruleFsts: '',
                    ruleFars: '',
                    maxNumSentences: 1,
                };

                // Clean up previous TTS instance to avoid C++ memory leak
                if (tts) {
                    try { tts.free(); } catch (err) {}
                }
                
                tts = new OfflineTts(wasmModule, ttsConfig);
                self.postMessage({ type: 'INIT_DONE' });
            } catch (error: any) {
                console.error('[sherpa-worker] Init Error:', error);
                self.postMessage({ type: 'ERROR', payload: error.message || String(error) });
            }
            break;

        case 'GENERATE':
            if (!tts) {
                self.postMessage({ type: 'ERROR', payload: 'TTS not initialized' });
                return;
            }

            try {
                const { text, sid = 0, speed = 1.0 } = payload;
                const audio = tts.generate(text, sid, speed);

                // audio.samples is a Float32Array
                self.postMessage({ 
                    type: 'GENERATE_DONE', 
                    payload: { 
                        samples: audio.samples,
                        sampleRate: audio.sampleRate
                    } 
                }, [audio.samples.buffer] as any);
            } catch (error: any) {
                self.postMessage({ type: 'ERROR', payload: error.message || String(error) });
            }
            break;
    }
};
