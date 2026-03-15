import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Play, Trash2, Clock, User, Search } from 'lucide-react';
import { getSavedLecturesFromCloud, removeLectureFromCloud } from '../../services/savedLectureService';
import { useUserStore } from '../../store/userStore';
import type { Video } from '../../services/videoService';
import { Loader2 } from 'lucide-react';
import { AuthGate } from '../../components/auth/AuthGate';

export const SavedLectures = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(true);
    const [savedLectures, setSavedLectures] = useState<Video[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLectures = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const cloudLectures = await getSavedLecturesFromCloud(user.id, user.userClass, user.targetExam);
            setSavedLectures(cloudLectures);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLectures();
    }, [user?.id, user?.userClass, user?.targetExam]);

    const handleRemove = async (videoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user?.id) return;

        try {
            await removeLectureFromCloud(user.id, videoId, user.userClass, user.targetExam);
            setSavedLectures(prev => prev.filter(v => v.id !== videoId));
        } catch (e) {
            console.error(e);
        }
    };

    const handlePlayVideo = (video: Video) => {
        // Navigate to video lecture page with the video ID
        // Creating a generic topic ID from video title
        const topicSlug = video.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 50);
        navigate(`/dashboard/lectures/${topicSlug}?videoId=${video.id}`);
    };

    const filteredLectures = savedLectures.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.channelName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="space-y-6 animate-fade-in-up w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-xl">
                                    <Bookmark className="w-6 h-6 text-purple-500" />
                                </div>
                                Saved Lectures
                            </h1>
                            <p className="text-text-muted mt-1">Your bookmarked video lectures for quick access</p>
                        </div>
                    </div>

                    {/* Fallback CTA */}
                    <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Bookmark className="w-8 h-8 text-purple-500" />
                        </div>
                        <h2 className="text-xl font-bold text-text-main">Login to Save Lectures</h2>
                        <p className="text-text-muted max-w-sm mx-auto">
                            Don't lose track of your favorite study materials. Log in to permanently bookmark videos and access them anytime, anywhere.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-xl">
                                <Bookmark className="w-6 h-6 text-purple-500" />
                            </div>
                            Saved Lectures
                        </h1>
                        <p className="text-text-muted mt-1">Your bookmarked video lectures for quick access</p>
                    </div>
                    <div className="text-sm text-text-muted">
                        {savedLectures.length} lecture{savedLectures.length !== 1 ? 's' : ''} saved
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search saved lectures..."
                        className="w-full bg-surface border border-white/10 rounded-xl pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                {/* Lectures Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                        <p className="text-text-muted font-medium">Loading your saved lectures...</p>
                    </div>
                ) : filteredLectures.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <Bookmark className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {searchQuery ? 'No lectures found' : 'No saved lectures yet'}
                        </h3>
                        <p className="text-text-muted text-sm max-w-sm mx-auto">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Save lectures while watching to access them quickly here'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredLectures.map((video) => (
                            <div
                                key={video.id}
                                onClick={() => handlePlayVideo(video)}
                                className="glass-card p-4 cursor-pointer group hover:border-purple-500/30 transition-all duration-300"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-black/50">
                                    <img
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                            <Play size={24} fill="white" className="ml-1" />
                                        </div>
                                    </div>
                                    {/* Duration Badge */}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white font-medium flex items-center gap-1">
                                        <Clock size={10} />
                                        {video.duration}
                                    </div>
                                </div>

                                {/* Info */}
                                <h3 className="text-sm font-semibold text-text-primary mb-2 group-hover:text-purple-400 transition-all flex items-center justify-between gap-2">
                                    <span className="line-clamp-2">{video.title}</span>
                                    {video.user_class && user?.userClass !== video.user_class && (
                                        <span className="shrink-0 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase rounded border border-purple-500/20">
                                            {video.user_class}
                                        </span>
                                    )}
                                </h3>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                        <User size={12} />
                                        {video.channelName}
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => handleRemove(video.id, e)}
                                        className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Remove from saved"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthGate>
    );
};
