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
    const { user } = useUserStore();
    const [loading, setLoading] = useState(true);
    const [playlists, setPlaylists] = useState<TopicPlaylist[]>([]);

    useEffect(() => {
        if (user) {
            fetchContent();
        }
    }, [user]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            // 1. Get ALL weak topics (or top 10)
            const weakStats = await getWeakTopics(user?.id || '', 10);

            if (weakStats.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Fetch videos for each topic
            const results: TopicPlaylist[] = [];

            for (const stat of weakStats) {
                try {
                    const playlist = await getVideoByTopicIdCached(stat.topic);
                    if (playlist && playlist.videos.length > 0) {
                        results.push({
                            topic: stat.topic,
                            videos: playlist.videos
                        });
                    }
                } catch (err) {
                    console.error(`Failed to fetch videos for ${stat.topic}`, err);
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
            <header>
                <h1 className="text-3xl font-heading font-bold text-text-main">Recommended Lectures</h1>
                <p className="text-text-muted">Curated video lessons based on your weak areas to help you improve.</p>
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
