import type { Track } from '../../../store/vibeStore';

export class DynamicWeightSystem {
    private sessionSkips: Map<string, number> = new Map(); // Artist -> Skip Count
    private sessionCompletions: Map<string, number> = new Map(); // Artist -> Completion Count
    private energyFatigue: number = 0; // Tracks consecutive high-energy skips
    private trustViolations: number = 0; // Tracks skips on low-trust sources
    private activeLanguage: string | null = null;

    // WEEK 3: DEADLOCK DETECTION
    private lastSkips: { artist: string, energy: number, trust: number, time: number }[] = [];
    private consecutiveSkips: number = 0;
    private flushCooldown: number = 0; // Tracks generations since last flush
    private isDeadlockDetected: boolean = false;

    constructor() { }

    public registerSkip(track: Track, skipTimeSeconds: number = 5) {
        // Track Artist Skips
        const artist = track.artist.toLowerCase();
        this.sessionSkips.set(artist, (this.sessionSkips.get(artist) || 0) + 1);

        // Track High Energy Fatigue
        const energy = track.audioFeatures?.energy || 0.5;
        if (energy > 0.7) {
            this.energyFatigue += 1;
        }

        // --- ADAPTIVE TRUST: Violation Signal ---
        // Rule: trustTier <= 0.7 + Skip < 15s = Trust Fracture
        if ((track.trustTier || 0.8) <= 0.7 && skipTimeSeconds < 15) {
            this.trustViolations = Math.min(5, this.trustViolations + 1);
            console.log(`📡 Trust Violation: ${track.trustMetadata}. Total: ${this.trustViolations}`);
        }

        // --- WEEK 3: DEADLOCK TRACKING ---
        this.consecutiveSkips++;
        this.lastSkips.push({
            artist: track.artist.toLowerCase(),
            energy: track.audioFeatures?.energy || 0.5,
            trust: track.trustTier || 0.8,
            time: skipTimeSeconds
        });
        if (this.lastSkips.length > 5) this.lastSkips.shift();

        this.checkDeadlock();
    }

    private checkDeadlock() {
        if (this.flushCooldown > 0) {
            this.isDeadlockDetected = false;
            return;
        }

        if (this.consecutiveSkips < 3) return;

        // PRECISION TRIGGER LOGIC
        const window = this.lastSkips.slice(-3);
        const avgSkipTime = window.reduce((sum, s) => sum + s.time, 0) / 3;
        const distinctArtists = new Set(window.map(s => s.artist)).size;
        const distinctEnergies = new Set(window.map(s => Math.round(s.energy * 2) / 2)).size; // 0.5 buckets
        const avgTrust = window.reduce((sum, s) => sum + s.trust, 0) / 3;

        // Rules from Senior Engineer:
        // 1. 3 skips in a row (this.consecutiveSkips >= 3)
        // 2. avg skip time < 12s
        // 3. distinct artists >= 2
        // 4. trustTier >= 0.8 (rejecting high quality)
        // 5. distinct energy buckets >= 2 (mood level rejection)
        if (avgSkipTime < 12 &&
            distinctArtists >= 2 &&
            avgTrust >= 0.8 &&
            distinctEnergies >= 2) {

            this.isDeadlockDetected = true;
            console.log("🔥 DEADLOCK DETECTED: Triggering Exploration Flush.");
        }
    }

    public isFlushRequired(): boolean {
        return this.isDeadlockDetected;
    }

    public consumeFlushRequest() {
        this.isDeadlockDetected = false;
        this.flushCooldown = 5; // Cooldown for 5 tracks/generations
        this.consecutiveSkips = 0;
        this.lastSkips = [];
    }

    public registerCompletion(track: Track, playTimeSeconds: number = 0) {
        this.consecutiveSkips = 0;
        this.lastSkips = [];
        if (this.flushCooldown > 0) this.flushCooldown--;
        // Boost Artist Affinity
        const artist = track.artist.toLowerCase();
        this.sessionCompletions.set(artist, (this.sessionCompletions.get(artist) || 0) + 1);

        // Reset Energy Fatigue if user vibes with high energy
        if ((track.audioFeatures?.energy || 0) > 0.7) {
            this.energyFatigue = 0;
        }

        // --- ADAPTIVE TRUST: Cooldown/Forgiveness ---
        // If user plays a suspect track for > 60s, forgive one violation
        if ((track.trustTier || 0.8) <= 0.7 && playTimeSeconds > 60) {
            this.trustViolations = Math.max(0, this.trustViolations - 1);
            console.log(`🛡️ Trust Vindication: User played through ${track.artist}. Violations: ${this.trustViolations}`);
        }

        // Update Active Language context
        if (track.language) {
            this.activeLanguage = track.language;
        }
    }

    public getArtistMultiplier(artist: string): number {
        const lowerArtist = artist.toLowerCase();
        const skips = this.sessionSkips.get(lowerArtist) || 0;
        const completions = this.sessionCompletions.get(lowerArtist) || 0;

        // Penalty: 3 skips -> 30% reduction (0.7x), 5 skips -> 50% reduction
        let penalty = 1.0;
        if (skips >= 3) penalty = 0.7;
        if (skips >= 5) penalty = 0.5;

        // Boost: Replays increase affinity temporarily
        let boost = 1.0;
        if (completions > 1) boost = 1.2;
        if (completions > 3) boost = 1.5;

        return penalty * boost;
    }

    public getLanguageMultiplier(candidateLanguage: string): number {
        if (!this.activeLanguage || !candidateLanguage) return 1.0;

        const active = this.activeLanguage.toLowerCase();
        const candidate = candidateLanguage.toLowerCase();

        // If user manually switched to a language (implied by listening), boost it
        if (active === candidate) {
            // Give a massive continuity boost to Indian languages to keep them in the zone
            const indianLangs = ['hindi', 'punjabi', 'tamil', 'telugu', 'malayalam'];
            if (indianLangs.includes(active)) {
                return 1.8; // 80% boost for Indian language continuity (keeps Punjabi with Punjabi)
            }
            return 1.3; // 30% boost for regular session language
        }
        return 1.0;
    }

    public getEnergyMultiplier(candidateEnergy: number): number {
        // If user is skipping high energy tracks repeatedly, penalize high energy
        if (this.energyFatigue >= 3 && candidateEnergy > 0.7) {
            return 0.6; // Reduce probability of high energy songs
        }

        // WEEK 4: INERTIA REDUCTION
        // If user is actively skipping, slightly dampen short-term intent to allow faster pivot
        if (this.consecutiveSkips >= 2) {
            return 0.85;
        }

        return 1.0;
    }

    public getAdaptiveTrustMultiplier(candidateTrustTier: number): number {
        // Only apply session-based frustration to non-official tracks
        if (candidateTrustTier >= 1.0) return 1.0;

        // Progressive decay: multiplier = 1.0 - (violations * 0.03)
        const frustrationRatio = 1.0 - (this.trustViolations * 0.03);
        return Math.max(0.85, frustrationRatio);
    }

    public getViolationCount(): number {
        return this.trustViolations;
    }

    public resetSession() {
        this.sessionSkips.clear();
        this.sessionCompletions.clear();
        this.energyFatigue = 0;
        this.trustViolations = 0;
    }
}
