
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useVibeStore } from '../store/vibeStore';
import { audiusService } from '../services/audiusService';
import MoodTransitioner from '../components/MoodTransitioner';
import {
  SectionHeader,
  AlbumCard,
  GridCard,
  FilterChip
} from '../components/streaming/StreamingComponents';
import '../styles/streaming.css';

import { RefreshCw, Heart } from 'lucide-react';

const Home: React.FC = () => {
  /* 
    OPTIMIZED STORE SUBSCRIPTION
    We select only what we need to prevent re-renders on 'progress' or unrelated updates.
  */
  const currentTrack = useVibeStore(state => state.currentTrack);
  const isPlaying = useVibeStore(state => state.isPlaying);
  const history = useVibeStore(state => state.history);
  const favorites = useVibeStore(state => state.favorites);
  const skippedTracks = useVibeStore(state => state.skippedTracks);
  const completedTracks = useVibeStore(state => state.completedTracks);
  const setQueue = useVibeStore(state => state.setQueue);
  const preferences = useVibeStore(state => state.preferences);
  const location = useVibeStore(state => state.location);
  const setTrack = useVibeStore(state => state.setTrack);
  const setIsPlaying = useVibeStore(state => state.setIsPlaying);

  /* New State for 8 Sections */
  const [feed, setFeed] = useState<{
    section1: any[],
    section2: any[],
    section3: any[],
    section4: any[],
    section5: any[],
    section6: any[],
    section7: any[],
    section8: any[],
    section3Title: string,
    section5Title: string,
    section6Title: string
  }>({
    section1: [],
    section2: [],
    section3: [],
    section4: [],
    section5: [],
    section6: [],
    section7: [],
    section8: [],
    section3Title: 'More for you',
    section5Title: 'Trending Now',
    section6Title: 'Perfect for right now'
  });

  const [extraSections, setExtraSections] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChip, setActiveChip] = useState('All');
  const [pullProgress, setPullProgress] = useState(0);

  const chips = ['All', 'Music', 'Podcasts', 'Audiobooks', 'Concerts'];

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const homeFeed = await audiusService.getHomeFeed({
        history,
        favorites,
        skipped: skippedTracks,
        completed: completedTracks,
        preferences,
        currentTrack,
        location,
        forceRefresh: isManual
      });
      setFeed(homeFeed as any);
      setExtraSections([]); // Reset extra sections on full refresh

      if (homeFeed.section1.length > 0) setQueue(homeFeed.section1);
      else if (homeFeed.section5.length > 0) setQueue(homeFeed.section5);

    } catch (error) {
      console.error('Failed to fetch home data:', error);
    }

    setLoading(false);
    setIsRefreshing(false);
    setPullProgress(0);
  };

  const fetchMore = async () => {
    if (loadingMore || loading) return;
    setLoadingMore(true);

    try {
      // Mock more sections for now by fetching variety
      // In a real app, you'd call a specific "more" endpoint or different keywords
      const varietyQuery = ['deep cuts', 'forgotten gems', 'trending global', 'new arrivals'][extraSections.length % 4];
      const moreTracks = await audiusService.searchTracks(`${varietyQuery} music`);

      const newSection = {
        title: varietyQuery.charAt(0).toUpperCase() + varietyQuery.slice(1),
        tracks: moreTracks.slice(0, 15),
        key: `extra-${Date.now()}`
      };

      setExtraSections(prev => [...prev, newSection]);
    } catch (e) {
      console.error("Failed to load more home content", e);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;

    // Pull to Refresh (Negative scroll)
    if (target.scrollTop < 0) {
      const progress = Math.min(Math.abs(target.scrollTop) / 80, 1.2);
      setPullProgress(progress);
      if (progress >= 1 && !isRefreshing) {
        fetchData(true);
      }
    } else {
      if (pullProgress > 0) setPullProgress(0);

      // Infinite Scroll (Positive scroll at bottom)
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (scrollBottom < 400 && !loadingMore && !loading && feed.section1.length > 0) {
        fetchMore();
      }
    }
  };


  const currentTrackRef = React.useRef(currentTrack);
  const isPlayingRef = React.useRef(isPlaying);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
    isPlayingRef.current = isPlaying;
  }, [currentTrack, isPlaying]);

  const handleTrackClick = useCallback((track: any, list: any[]) => {
    const playableList = list.filter((t: any) => t.artwork);
    setQueue(playableList);

    // Use refs to check current state without adding dependencies
    if (currentTrackRef.current?.id === track.id) {
      setIsPlaying(!isPlayingRef.current);
    } else {
      setTrack(track);
      setIsPlaying(true);
    }
  }, [setQueue, setTrack, setIsPlaying]);

  // Render Helpers
  const renderSection = (title: string, tracks: any[], keyPrefix: string) => {
    if (loading) {
      return (
        <section style={{ marginTop: '2.5rem' }}>
          <SectionHeader title={title} />
          <div className="horizontal-carousel">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skel-${keyPrefix}-${i}`} className="skeleton" style={{ width: '160px', height: '220px', borderRadius: '12px' }} />
            ))}
          </div>
        </section>
      );
    }
    if (!tracks || tracks.length === 0) return null;
    return (
      <section style={{ marginTop: '2.5rem' }}>
        <SectionHeader title={title} />
        <div className="horizontal-carousel">
          {tracks.filter((t: any) => t.artwork).map((track, index) => (
            <AlbumCard
              key={`${keyPrefix}-${track.id}`}
              title={track.title}
              subtitle={track.artist}
              imageUrl={track.artwork || ''}
              onClick={() => handleTrackClick(track, tracks)}
              index={index}
            />
          ))}
        </div>
      </section>
    );
  };

  // Quick Access Generation
  const quickAccessItems = useMemo(() => {
    const items: any[] = [];

    // 1. Liked Songs
    if (favorites.length > 0) {
      items.push({
        id: 'liked-playlist',
        title: 'Liked Songs',
        imageUrl: '',
        icon: Heart,
        colors: 'linear-gradient(135deg, #450af5, #c4efd9)',
        tracks: favorites.filter((t: any) => t.artwork),
        isSpecial: true
      });
    }

    // 2. Recommended Video/Mix (Using Section 2 - Made For You)
    const recommendedTracks = feed.section2.filter((t: any) => t.artwork);
    if (recommendedTracks.length > 0) {
      items.push({
        id: 'rec-playlist',
        title: 'Recommended Mix',
        imageUrl: recommendedTracks[0]?.artwork,
        tracks: recommendedTracks,
        colors: 'linear-gradient(135deg, #FF7B54, #FFD56F)',
        isSpecial: true
      });
    }

    // 3. Custom Playlist 1 (Using Section 4 - Punjabi Pop / Regional)
    const customTracks1 = feed.section4.filter((t: any) => t.artwork);
    if (customTracks1.length > 0) {
      items.push({
        id: 'custom-playlist-1',
        title: 'Punjabi Pop Mix',
        imageUrl: customTracks1[0]?.artwork,
        tracks: customTracks1,
        colors: 'linear-gradient(135deg, #e52d27, #b31217)',
        isSpecial: true
      });
    }

    // 4. Custom Playlist 2 (Using Section 7 - LoFi / Chill)
    const customTracks2 = feed.section7.filter((t: any) => t.artwork);
    if (customTracks2.length > 0) {
      items.push({
        id: 'custom-playlist-2',
        title: 'Desi Lo-Fi & Chill',
        imageUrl: customTracks2[0]?.artwork,
        tracks: customTracks2,
        colors: 'linear-gradient(135deg, #2b5876, #4e4376)',
        isSpecial: true
      });
    }

    // Fallbacks if we don't have enough data
    const fallbacks = [...feed.section1, ...feed.section3, ...feed.section5].filter((t: any) => t.artwork);
    let fallbackIndex = 0;
    while (items.length < 8 && fallbackIndex < fallbacks.length) {
      const fb = fallbacks[fallbackIndex];
      // Avoid duplicate single tracks if we can
      if (!items.some(i => i.id === fb.id)) {
        items.push({
          id: fb.id,
          title: fb.title,
          imageUrl: fb.artwork,
          tracks: [fb, ...fallbacks.slice(fallbackIndex + 1)],
          isSpecial: false
        });
      }
      fallbackIndex++;
    }

    // Ensure we only render a maximum of 8
    return items.slice(0, 8).map((item, index) => (
      <GridCard
        key={`qa-${item.id}`}
        title={item.title || item.name}
        imageUrl={item.imageUrl || item.artwork || ''}
        icon={item.icon}
        colors={item.colors}
        onClick={() => {
          if (item.tracks && item.tracks.length > 0) {
            handleTrackClick(item.tracks[0], item.tracks);
          } else if (!item.isSpecial) {
            handleTrackClick(item, fallbacks);
          }
        }}
        index={index}
      />
    ));
  }, [favorites, feed, handleTrackClick]);

  return (
    <motion.div
      className="spotify-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onScroll={handleScroll}
      style={{
        paddingBottom: '140px',
        backgroundColor: '#000000',
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        opacity: pullProgress,
        zIndex: 200,
        pointerEvents: 'none'
      }}>
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : pullProgress * 360 }}
          transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: "linear" }}
        >
          <RefreshCw size={24} color="#1DB954" />
        </motion.div>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1DB954', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '1rem 0',
        margin: '0 -2rem 0.5rem -2rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        backgroundColor: 'transparent',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <div className="filter-chips-container" style={{ padding: 0, overflow: 'hidden' }}>
            {chips.map(chip => (
              <FilterChip
                key={chip}
                label={chip}
                active={activeChip === chip}
                onClick={() => setActiveChip(chip)}
              />
            ))}
          </div>
        </div>
      </header>

      <main style={{ position: 'relative' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{(() => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; })()}</h2>
          <motion.button
            className="refresh-feed-btn"
            onClick={() => fetchData(true)}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              padding: '12px',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Refresh Recommendations"
          >
            <RefreshCw size={20} className={isRefreshing ? 'spin' : ''} />
          </motion.button>
        </div>

        <div className="quick-access-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`skel-qa-${i}`} className="skeleton" style={{ height: '56px', borderRadius: '8px' }} />
            ))
          ) : quickAccessItems}
        </div>

        {/* Section 1: Start Here / Jump Back In */}
        {renderSection(history.length === 0 ? "🎵 Start Here" : "Jump Back In", feed.section1, "s1")}

        {/* Section 2: Discover Your Vibe / Made For You */}
        {renderSection(history.length === 0 ? "Discover Your Vibe" : "Made For You", feed.section2, "s2")}

        {/* Section 3: Artist Focus */}
        {renderSection(feed.section3Title, feed.section3, "s3")}

        {/* Section 4: Regional Discovery */}
        {renderSection(history.length === 0 ? "Regional Picks For You" : "Regional Discovery", feed.section4, "s4")}

        {/* Section 5: Trending */}
        {renderSection(feed.section5Title, feed.section5, "s5")}

        {/* Section 6: Contextual */}
        {renderSection(feed.section6Title, feed.section6, "s6")}

        {/* Section 7: Lofi */}
        {renderSection("Desi Lo-Fi & Chill", feed.section7, "s7")}

        {/* Section 8: Global / Discovery */}
        {renderSection(history.length === 0 ? "Something New" : "Global Hits", feed.section8, "s8")}

        {/* Dynamic Infinite Scroll Sections */}
        {extraSections.map((section, idx) =>
          renderSection(section.title, section.tracks, `extra-${idx}`)
        )}

        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <RefreshCw className="spin" size={24} color="var(--accent-primary)" />
          </div>
        )}

      </main>
      <MoodTransitioner />
    </motion.div>
  );
};

export default Home;
