// Quick Video Lookup Service
// Pre-mapped videos for instant loading - no API calls needed

import type { Video } from './videoService';

// Pre-defined video mappings for common JEE/NEET topics
// These are popular educational videos that work instantly
const TOPIC_VIDEO_MAP: Record<string, Video[]> = {
    // Physics Topics
    'physics': [
        {
            id: 'ZM8ECpBuQYE',
            title: 'Physics Complete Course | Class 11 & 12',
            channelName: 'Physics Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/ZM8ECpBuQYE/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',
            duration: '2:30:00'
        }
    ],
    'mechanics': [
        {
            id: 'bY7zpwSxQaE',
            title: 'Mechanics Complete Chapter | JEE Mains',
            channelName: 'Unacademy JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/bY7zpwSxQaE/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=bY7zpwSxQaE',
            duration: '3:00:00'
        }
    ],
    'laws-of-motion': [
        {
            id: 'pnWvVu4bIxQ',
            title: 'Laws of Motion - Full Chapter | Physics',
            channelName: 'Vedantu JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/pnWvVu4bIxQ/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=pnWvVu4bIxQ',
            duration: '1:45:00'
        }
    ],
    'kinematics': [
        {
            id: 'w2bXe03i2wY',
            title: 'Kinematics Complete Chapter | JEE',
            channelName: 'Physics Galaxy',
            thumbnailUrl: 'https://i.ytimg.com/vi/w2bXe03i2wY/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=w2bXe03i2wY',
            duration: '2:15:00'
        }
    ],
    'thermodynamics': [
        {
            id: 'mPWe7s5oXn4',
            title: 'Thermodynamics Full Chapter | Class 11',
            channelName: 'Physics Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/mPWe7s5oXn4/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=mPWe7s5oXn4',
            duration: '2:00:00'
        }
    ],
    'electromagnetism': [
        {
            id: 'JGT1IVGJDdM',
            title: 'Electromagnetism Complete | JEE Advanced',
            channelName: 'Physics Galaxy',
            thumbnailUrl: 'https://i.ytimg.com/vi/JGT1IVGJDdM/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=JGT1IVGJDdM',
            duration: '2:45:00'
        }
    ],

    // Chemistry Topics
    'chemistry': [
        {
            id: 'LjCu2tnwxAg',
            title: 'Chemistry Complete Course | JEE Mains',
            channelName: 'Unacademy JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/LjCu2tnwxAg/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=LjCu2tnwxAg',
            duration: '3:30:00'
        }
    ],
    'organic-chemistry': [
        {
            id: 'TfXjNqGv3Mw',
            title: 'Organic Chemistry Full Course | JEE',
            channelName: 'Chemistry Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/TfXjNqGv3Mw/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=TfXjNqGv3Mw',
            duration: '4:00:00'
        }
    ],
    'inorganic-chemistry': [
        {
            id: 'Qg7Xr8sNNMk',
            title: 'Inorganic Chemistry Complete | NEET/JEE',
            channelName: 'Vedantu',
            thumbnailUrl: 'https://i.ytimg.com/vi/Qg7Xr8sNNMk/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=Qg7Xr8sNNMk',
            duration: '2:30:00'
        }
    ],
    'physical-chemistry': [
        {
            id: 'N4kP3WC75pY',
            title: 'Physical Chemistry Crash Course | JEE',
            channelName: 'Physics Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/N4kP3WC75pY/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=N4kP3WC75pY',
            duration: '2:15:00'
        }
    ],

    // Mathematics Topics
    'mathematics': [
        {
            id: 'g0jCf2dGH3Y',
            title: 'Mathematics Complete Course | JEE',
            channelName: 'Unacademy JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/g0jCf2dGH3Y/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=g0jCf2dGH3Y',
            duration: '4:00:00'
        }
    ],
    'calculus': [
        {
            id: 'HfACrKJ_Y2w',
            title: 'Calculus Complete Chapter | JEE Mains',
            channelName: 'Vedantu JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/HfACrKJ_Y2w/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=HfACrKJ_Y2w',
            duration: '3:00:00'
        }
    ],
    'algebra': [
        {
            id: '2d4XwAd5PAg',
            title: 'Algebra Full Course | Class 11 & 12',
            channelName: 'Math Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/2d4XwAd5PAg/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=2d4XwAd5PAg',
            duration: '2:45:00'
        }
    ],
    'coordinate-geometry': [
        {
            id: 'xRvYspN4fdI',
            title: 'Coordinate Geometry Complete | JEE',
            channelName: 'Physics Galaxy',
            thumbnailUrl: 'https://i.ytimg.com/vi/xRvYspN4fdI/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=xRvYspN4fdI',
            duration: '2:30:00'
        }
    ],
    'trigonometry': [
        {
            id: 'Q4YkZn3kVvI',
            title: 'Trigonometry Full Chapter | JEE Mains',
            channelName: 'Unacademy JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/Q4YkZn3kVvI/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=Q4YkZn3kVvI',
            duration: '2:00:00'
        }
    ],
    'differential-equations': [
        {
            id: 'HQWgKvNd41I',
            title: 'Differential Equations | Complete',
            channelName: 'Vedantu JEE',
            thumbnailUrl: 'https://i.ytimg.com/vi/HQWgKvNd41I/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=HQWgKvNd41I',
            duration: '1:45:00'
        }
    ],
    'straight-lines': [
        {
            id: 'wGHvVrVKQMc',
            title: 'Straight Lines Complete Chapter',
            channelName: 'Physics Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/wGHvVrVKQMc/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=wGHvVrVKQMc',
            duration: '2:00:00'
        }
    ],

    // General/Fallback
    'general': [
        {
            id: 'ZM8ECpBuQYE',
            title: 'JEE/NEET Complete Preparation',
            channelName: 'Physics Wallah',
            thumbnailUrl: 'https://i.ytimg.com/vi/ZM8ECpBuQYE/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',
            duration: '2:30:00'
        }
    ]
};

// Normalize topic name for lookup
const normalizeTopicName = (topic: string): string => {
    return topic
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

// Get instant video for a topic - NO API call, instant response
export const getInstantVideoForTopic = (topic: string): Video | null => {
    const normalizedTopic = normalizeTopicName(topic);

    // Try exact match first
    if (TOPIC_VIDEO_MAP[normalizedTopic]) {
        return TOPIC_VIDEO_MAP[normalizedTopic][0];
    }

    // Try partial matching
    for (const [key, videos] of Object.entries(TOPIC_VIDEO_MAP)) {
        if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
            return videos[0];
        }
    }

    // Subject-level fallback
    if (normalizedTopic.includes('physics') || normalizedTopic.includes('motion') || normalizedTopic.includes('force')) {
        return TOPIC_VIDEO_MAP['physics'][0];
    }
    if (normalizedTopic.includes('chem') || normalizedTopic.includes('reaction') || normalizedTopic.includes('organic')) {
        return TOPIC_VIDEO_MAP['chemistry'][0];
    }
    if (normalizedTopic.includes('math') || normalizedTopic.includes('equation') || normalizedTopic.includes('calcul')) {
        return TOPIC_VIDEO_MAP['mathematics'][0];
    }

    // Ultimate fallback
    return TOPIC_VIDEO_MAP['general'][0];
};

// Get instant videos for multiple topics - NO API call
export const getInstantVideosForTopics = (topics: string[]): { topic: string; video: Video }[] => {
    return topics.map(topic => ({
        topic,
        video: getInstantVideoForTopic(topic) || TOPIC_VIDEO_MAP['general'][0]
    })).filter(item => item.video !== null);
};
