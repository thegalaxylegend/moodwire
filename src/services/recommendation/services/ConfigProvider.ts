import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AlphaBlender } from '../core/AlphaBlender';
import type { RankWeights } from '../types';

export class ConfigProvider {
    private unsubscribe: (() => void) | null = null;
    private currentWeights: RankWeights | null = null;
    private onConfigUpdate: (weights: RankWeights) => void;

    constructor(defaultWeights: RankWeights, onUpdate: (weights: RankWeights) => void) {
        this.currentWeights = defaultWeights;
        this.onConfigUpdate = onUpdate;
        this.listenForRemoteConfig();
    }

    private listenForRemoteConfig() {
        if (typeof window === 'undefined') return;
        try {
            this.unsubscribe = onSnapshot(doc(db, 'system', 'recommendation_config'), (snap: any) => {
                if (snap.exists()) {
                    const config = snap.data();
                    if (config.weights) {
                        const alpha = config.mlWeightAlpha || 0.4;
                        const blendedWeights = AlphaBlender.blend(config.weights, alpha);
                        this.currentWeights = blendedWeights;
                        this.onConfigUpdate(blendedWeights);
                    }
                }
            });
        } catch (e) {
            console.warn("Recommendation Remote Config Unavailable", e);
        }
    }

    public getWeights(): RankWeights | null {
        return this.currentWeights;
    }

    public dispose() {
        this.unsubscribe?.();
        this.unsubscribe = null;
    }
}
