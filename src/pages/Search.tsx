import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, ChevronRight, History, Sparkles, TrendingUp, Music } from 'lucide-react';
import { useVibeStore, type Track } from '../store/vibeStore';
import { audiusService } from '../services/audiusService';
import { youtubeService } from '../services/youtubeService';
import { TrackCard, VibeCard, TrackSkeleton } from '../components/search/SearchComponents';

const SectionHeader = ({ title, icon: Icon, onSeeAll }: { title: string, icon: any, onSeeAll?: () => void }) => (
    <div className="section-header">
        <div className="section-title-group">
            <Icon size={20} className="section-icon" />
            <h3 className="section-title">{title}</h3>
        </div>
        {onSeeAll && (
            <button className="see-all-btn" onClick={onSeeAll}>
                See All <ChevronRight size={16} />
            </button>
        )}
    </div>
);

const HorizontalScroll = ({ children }: { children: React.ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
        <div className="horizontal-scroll-container">
            <div className="scroll-content" ref={scrollRef}>
                {children}
            </div>
        </div>
    );
};

const Search: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [trendingIndia, setTrendingIndia] = useState<any[]>([]);
    const [globalHot, setGlobalHot] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    /* 
      OPTIMIZED STORE SUBSCRIPTION
      We select only what we need to prevent re-renders on 'progress' or unrelated updates.
    */
    const currentTrack = useVibeStore(state => state.currentTrack);
    const isPlaying = useVibeStore(state => state.isPlaying);
    const history = useVibeStore(state => state.history);
    const favorites = useVibeStore(state => state.favorites);
    const skippedTracks = useVibeStore(state => state.skippedTracks);
    const preferences = useVibeStore(state => state.preferences);
    const location = useVibeStore(state => state.location);
    const setTrack = useVibeStore(state => state.setTrack);
    const setIsPlaying = useVibeStore(state => state.setIsPlaying);
    // removed unused setQueue from Search since it wasn't used in destructuring before, 
    // but looking at valid props: Search didn't use setQueue in destructuring previously.


    useEffect(() => {
        const loadDiscoveryContent = async () => {
            try {
                const [recs, india, global] = await Promise.all([
                    audiusService.getSmartRecommendations({
                        history,
                        favorites,
                        skipped: skippedTracks,
                        preferences,
                        currentTrack,
                        location
                    }),
                    audiusService.getTrendingIndianTracks(),
                    audiusService.getTrendingTracks()
                ]);
                setRecommendations((recs || []).filter((t: Track) => t.artwork));
                setTrendingIndia((india || []).filter((t: Track) => t.artwork));
                setGlobalHot((global || []).filter((t: Track) => t.artwork));
            } catch (e) {
                console.error("Failed to load discovery content", e);
            }
        };
        loadDiscoveryContent();
    }, [favorites.length, history.length]);


    // Infinite Scroll State
    const [loadingMore, setLoadingMore] = useState(false);

    const loadMoreResults = async () => {
        if (loadingMore || !query.trim()) return;
        setLoadingMore(true);
        try {
            // Append some variety (e.g., search with a different keyword or just re-fetch and filter)
            const [audiusTracks, youtubeTracks] = await Promise.all([
                audiusService.searchTracks(`${query} hits`), // Slight variation
                youtubeService.searchVideos(`${query} playlist`, location?.country || 'IN')
            ]);

            const combined = [...results];
            const existingIds = new Set(results.map(t => t.id));

            [...youtubeTracks, ...audiusTracks].forEach(t => {
                if (!existingIds.has(t.id) && t.artwork) {
                    combined.push(t);
                    existingIds.add(t.id);
                }
            });

            setResults(combined);
        } catch (e) {
            console.error("Load more failed", e);
        }
        setLoadingMore(false);
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const delayDebounceFn = setTimeout(async () => {
            const ytMatch = query.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                const ytTrack = {
                    id: `yt-${videoId}`,
                    title: 'YouTube Video',
                    artist: 'YouTube',
                    artwork: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    url: query,
                    source: 'youtube',
                    platformId: videoId,
                    duration: 0
                };
                setResults([ytTrack]);
                setLoading(false);
                return;
            }

            try {
                const [audiusTracks, youtubeTracks] = await Promise.all([
                    audiusService.searchTracks(query),
                    youtubeService.searchVideos(query, location?.country || 'IN')
                ]);

                const combined = [];
                const maxLength = Math.max(audiusTracks.length, youtubeTracks.length);
                for (let i = 0; i < maxLength; i++) {
                    if (i < youtubeTracks.length) combined.push(youtubeTracks[i]);
                    if (i < audiusTracks.length) combined.push(audiusTracks[i]);
                }

                setResults(combined.filter((t: any) => t.artwork && t.artwork.trim() !== ''));
                setLoading(false);
            } catch (e) {
                console.error("Search failed", e);
                setResults([]);
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);


    const setQueue = useVibeStore(state => state.setQueue);

    const handleTrackClick = useCallback((track: any) => {
        if (results.length > 0) {
            setQueue(results);
        }

        if (currentTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            setTrack(track);
            setIsPlaying(true);
        }
    }, [currentTrack, isPlaying, results, setIsPlaying, setTrack, setQueue]);

    const handleVibeSelect = useCallback((genre: string) => {
        setQuery(genre);
    }, []);

    return (
        <div 
            className="search-page" 
            style={{ height: '100vh', overflowY: 'auto', paddingBottom: '140px', padding: 0 }}
            onScroll={(e) => {
                const target = e.currentTarget;
                if (query.trim() && target.scrollHeight - target.scrollTop - target.clientHeight < 300 && !loading && !loadingMore) {
                    loadMoreResults();
                }
            }}
        >
            <div className="search-sticky-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-base)', padding: '1.5rem 2rem', margin: 0, pointerEvents: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h1 className="hero-title" style={{ margin: 0, fontSize: '2.5rem' }}>Search</h1>
                <div className="search-input-wrapper glass" style={{ margin: 0, maxWidth: '600px' }}>
                    <SearchIcon size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="search-content" style={{ padding: '0 2rem 2rem 2rem' }}>
                {query.trim() ? (
                    <div className="search-results-grid">
                        {loading ? (
                            <TrackSkeleton count={12} />
                        ) : results.length > 0 ? (
                            results.map(track => (
                                <TrackCard
                                    key={track.id}
                                    track={track}
                                    currentTrackId={currentTrack?.id}
                                    isPlaying={isPlaying}
                                    onPlay={handleTrackClick}
                                />
                            ))
                        ) : (
                            <div className="empty-search">No tracks found for "{query}"</div>
                        )}
                        {loadingMore && <TrackSkeleton count={4} />}
                    </div>
                ) : (
                    <div className="discovery-feed">
                        {history.filter((t: Track) => t.artwork).length > 0 && (
                            <section className="feed-section">
                                <SectionHeader title="Jump Back In" icon={History} />
                                <HorizontalScroll>
                                    {history.filter((t: Track) => t.artwork).slice(0, 8).map(track => (
                                        <TrackCard
                                            key={`hist-${track.id}`}
                                            track={track}
                                            size="small"
                                            currentTrackId={currentTrack?.id}
                                            isPlaying={isPlaying}
                                            onPlay={handleTrackClick}
                                        />
                                    ))}
                                </HorizontalScroll>
                            </section>
                        )}

                        <section className="feed-section">
                            <SectionHeader title="Made For You" icon={Sparkles} />
                            <HorizontalScroll>
                                {recommendations.length > 0 ? (
                                    recommendations.map(track => (
                                        <TrackCard
                                            key={`rec-${track.id}`}
                                            track={track}
                                            currentTrackId={currentTrack?.id}
                                            isPlaying={isPlaying}
                                            onPlay={handleTrackClick}
                                        />
                                    ))
                                ) : (
                                    <TrackSkeleton count={6} />
                                )}
                            </HorizontalScroll>
                        </section>

                        <section className="feed-section">
                            <SectionHeader title="Vibe Check" icon={Music} />
                            <HorizontalScroll>
                                <VibeCard genre="Lofi" color="linear-gradient(135deg, #6366f1, #a855f7)" onSelect={handleVibeSelect} />
                                <VibeCard genre="Pop" color="linear-gradient(135deg, #ec4899, #f43f5e)" onSelect={handleVibeSelect} />
                                <VibeCard genre="Electronic" color="linear-gradient(135deg, #3b82f6, #06b6d4)" onSelect={handleVibeSelect} />
                                <VibeCard genre="Rock" color="linear-gradient(135deg, #ef4444, #b91c1c)" onSelect={handleVibeSelect} />
                                <VibeCard genre="Bollywood" color="linear-gradient(135deg, #f59e0b, #d97706)" onSelect={handleVibeSelect} />
                                <VibeCard genre="Hip-Hop" color="linear-gradient(135deg, #10b981, #059669)" onSelect={handleVibeSelect} />
                            </HorizontalScroll>
                        </section>

                        <section className="feed-section">
                            <SectionHeader title="Trending in India 🇮🇳" icon={TrendingUp} />
                            <HorizontalScroll>
                                {trendingIndia.length > 0 ? (
                                    trendingIndia.map(track => (
                                        <TrackCard
                                            key={`ind-${track.id}`}
                                            track={track}
                                            currentTrackId={currentTrack?.id}
                                            isPlaying={isPlaying}
                                            onPlay={handleTrackClick}
                                        />
                                    ))
                                ) : (
                                    <TrackSkeleton count={6} />
                                )}
                            </HorizontalScroll>
                        </section>

                        <section className="feed-section">
                            <SectionHeader title="Global Hot 50" icon={TrendingUp} />
                            <HorizontalScroll>
                                {globalHot.length > 0 ? (
                                    globalHot.map(track => (
                                        <TrackCard
                                            key={`glob-${track.id}`}
                                            track={track}
                                            currentTrackId={currentTrack?.id}
                                            isPlaying={isPlaying}
                                            onPlay={handleTrackClick}
                                        />
                                    ))
                                ) : (
                                    <TrackSkeleton count={6} />
                                )}
                            </HorizontalScroll>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
