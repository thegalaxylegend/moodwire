
import type { UserProfile } from '../types';
import type { Track } from '../../../store/vibeStore';
import { ColdStartService } from '../pipelines/ColdStart';
import { FeatureExtractor } from '../core/FeatureExtractor';

export class ProfileService {
    private userProfile: UserProfile | null = null;
    private profileCacheTimestamp: number = 0;
    private readonly CACHE_TTL = 120000; // 2 minutes

    public getProfile(ctx: {
        history: Track[];
        favorites: Track[];
        preferences: any;
        skippedIds: Set<string>;
        completedIds?: Set<string>;
    }): UserProfile {
        const now = Date.now();
        
        // Cache hit check
        if (this.userProfile && (now - this.profileCacheTimestamp < this.CACHE_TTL)) {
            return this.userProfile;
        }

        const languages = ctx.preferences?.languages || ['Hindi', 'English'];
        const genres = ctx.preferences?.vibeTypes || [];
        const artists = ctx.preferences?.favoriteArtists || [];

        if (ctx.history.length < 5) {
            this.userProfile = ColdStartService.generateInitialProfile(ctx.preferences);
        } else {
            const languageWeights: Record<string, number> = {};
            languages.forEach((l: string) => languageWeights[l] = 1.0);

            this.userProfile = {
                affirmations: {
                    favoriteArtists: [...new Set([...artists, ...ctx.favorites.slice(0, 10).map((t: Track) => t.artist)])],
                    favoriteGenres: genres,
                    dislikedArtists: [],
                    dislikedTracks: Array.from(ctx.skippedIds),
                    languages
                },
                affinityVector: FeatureExtractor.getUserAffinityVector(ctx.history, ctx.favorites, ctx.skippedIds, ctx.completedIds),
                languageWeights,
                fatigueScore: 0,
                churnRisk: 0,
                lastActive: now
            };
        }

        this.profileCacheTimestamp = now;
        return this.userProfile;
    }

    public invalidateCache() {
        this.profileCacheTimestamp = 0;
    }
}
