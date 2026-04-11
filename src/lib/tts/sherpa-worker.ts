// src/lib/tts/sherpa-worker.ts

let tts: any = null;
let Module: any = null;

// Use CDN for the main Sherpa-ONNX WASM wrapper script
const SHERPA_ONNX_JS_URL = 'https://cdn.jsdelivr.net/npm/sherpa-onnx@1.10.42/sherpa-onnx-tts.js';

self.onmessage = async (e: MessageEvent) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            try {
                // 1. Loading the Sherpa-ONNX module
                if (!Module) {
                    // We need to import the sherpa-onnx-tts logic
                    // In a worker, we use importScripts for traditional builds or just dynamic import
                    // @ts-ignore
                    importScripts(SHERPA_ONNX_JS_URL);
                    Module = await (self as any).createSherpaOnnxTTS();
                }

                // 2. Initializing TTS with models
                // Payloads for models are expected to be ArrayBuffers
                const ttsConfig = {
                    vits: {
                        model: payload.model,
                        lexicon: payload.lexicon,
                        tokens: payload.tokens,
                        dataDir: payload.dataDir,
                        noiseScale: 0.667,
                        noiseScaleW: 0.8,
                        lengthScale: 1.0,
                    },
                    sampleRate: payload.sampleRate || 22050,
                    numThreads: Math.min(4, (self.navigator as any).hardwareConcurrency || 1),
                };

                tts = Module.createOfflineTTS(ttsConfig);
                self.postMessage({ type: 'INIT_DONE' });
            } catch (error: any) {
                self.postMessage({ type: 'ERROR', payload: error.message });
            }
            break;

        case 'GENERATE':
            if (!tts) {
                self.postMessage({ type: 'ERROR', payload: 'TTS not initialized' });
                return;
            }

            try {
                const { text, sid = 0, speed = 1.0 } = payload;
                const audio = tts.generate({
                    text,
                    sid,
                    speed,
                });

                // audio.samples is a Float32Array
                self.postMessage({ 
                    type: 'GENERATE_DONE', 
                    payload: { 
                        samples: audio.samples,
                        sampleRate: audio.sampleRate
                    } 
                }, [audio.samples.buffer] as any);
            } catch (error: any) {
                self.postMessage({ type: 'ERROR', payload: error.message });
            }
            break;
    }
};
