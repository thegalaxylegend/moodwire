import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getWeakTopics } from '../../services/topicStrengthService';
import { getVideoByTopicIdCached, type Video } from '../../services/videoService';
import { Loader2, Play, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopicPlaylist {
    topic: string;
    videos: Video[];
}

export const Lectures = () => {
    const { user, authResolved } = useUserStore();
    const [loading, setLoading] = useState(true);
    const [playlists, setPlaylists] = useState<TopicPlaylist[]>([]);
    const [weakStatsCount, setWeakStatsCount] = useState(0);

    useEffect(() => {
        if (authResolved) {
            fetchContent();
        }
    }, [user, authResolved]); // Re-fetch only when user changes, but wait for auth to resolve

    const fetchContent = async () => {
        setLoading(true);
        try {
            // 1. Get weak topics
            let topicsToFetch: string[] = [];
            const weakStats = await getWeakTopics(user?.id || 'guest', 10, user?.userClass, user?.targetExam);
            setWeakStatsCount(weakStats.length);

            if (weakStats.length > 0) {
                topicsToFetch = weakStats.map(s => s.topic);
            } else {
                // FALLBACK: If no weak topics, show "Trending Core Topics" based on exam
                console.log("[Lectures] No weak topics found. Showing trending core topics.");
                const exam = user?.targetExam?.toLowerCase() || 'jee';
                if (exam.includes('neet')) {
                    topicsToFetch = ['Cell Cycle and Division', 'Human Physiology', 'Organic Chemistry Basics', 'Genetics'];
                } else if (exam.includes('clat')) {
                    topicsToFetch = ['Legal Reasoning', 'Current Affairs', 'Logical Reasoning', 'English Vocabulary'];
                } else {
                    // Default JEE/General
                    topicsToFetch = ['Physics Kinematics', 'Chemical Bonding', 'Mathematical Induction', 'Modern Physics'];
                }
            }

            // 2. Fetch videos for each topic
            const results: TopicPlaylist[] = [];

            // Limit to top 6 topics for performance
            const limitedTopics = topicsToFetch.slice(0, 6);

            for (const topic of limitedTopics) {
                try {
                    const examName = user?.targetExam || 'JEE';
                    // Use cached results to avoid API quota depletion
                    const playlist = await getVideoByTopicIdCached(topic, examName);

                    if (playlist && playlist.videos.length > 0) {
                        results.push({
                            topic: topic,
                            videos: playlist.videos
                        });
                    }
                } catch (err) {
                    console.error(`Failed to fetch videos for ${topic}`, err);
                }
            }

            setPlaylists(results);
        } catch (e) {
            console.error("Error fetching lectures:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-text-muted animate-pulse">Curating your personal playlist...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            <header className="mb-8 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent border border-white/10">
                <div className="relative z-10">
                    <h1 className="text-4xl font-heading font-bold text-white mb-2">
                        {playlists.length > 0 && !user?.isGuest && weakStatsCount > 0
                            ? 'Recommended for You'
                            : 'Trending Core Topics'}
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl">
                        {playlists.length > 0 && !user?.isGuest && weakStatsCount > 0
                            ? "We've curated these video lessons based on your mock test performance to help you master your weak areas."
                            : `Start your ${user?.targetExam || 'JEE'} preparation with these essential high-weightage topics selected by experts.`}
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
            </header>

            {playlists.length === 0 ? (
                <div className="glass-card oxygen-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center">
                        <BookOpen size={32} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-text-main">No Recommendations Yet</h3>
                    <p className="text-text-muted max-w-md">
                        We need more data to recommend lectures. Take some mock tests so we can identify your weak topics!
                    </p>
                    <Link to="/dashboard/mock" className="px-6 py-2 bg-primary text-white rounded-lg font-bold oxygen-button">
                        Take a Mock Test
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {playlists.map((playlist, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-400" />
                                <h2 className="text-xl font-bold text-text-main">{playlist.topic}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {playlist.videos.slice(0, 4).map((video) => (
                                    <Link
                                        key={video.id}
                                        to={`/dashboard/lectures/${playlist.topic.toLowerCase().replace(/\s+/g, '-')}?videoId=${video.id}`}
                                        className="group glass-card oxygen-card overflow-hidden"
                                    >
                                        <div className="relative aspect-video bg-black/50">
                                            <img
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-black/50">
                                                    <Play size={24} className="text-white ml-1" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white font-mono flex items-center gap-1">
                                                <Clock size={10} /> {video.duration}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-medium text-sm text-text-main line-clamp-2 group-hover:text-primary transition-colors">
                                                {video.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                                                <span className="truncate max-w-[120px]">{video.channelName}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
