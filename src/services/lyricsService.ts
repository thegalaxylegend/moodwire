export interface LyricLine {
    time: number;
    text: string;
}

const mockLyrics: Record<string, LyricLine[]> = {
    'default': [
        { time: 0, text: "🎶 (Music playing)" },
        { time: 5, text: "Feel the vibe of MoodWire" },
        { time: 10, text: "Synchronized in every wire" },
        { time: 15, text: "From the cosmic heights to neon lights" },
        { time: 20, text: "We're dancing through the digital nights" },
        { time: 25, text: "Hindi tracks or lo-fi beats" },
        { time: 30, text: "Rhythms echo through the city streets" },
        { time: 35, text: "MoodWire, the sound of now" },
        { time: 40, text: "Taking you where you don't know how" },
        { time: 45, text: "✨" }
    ],
    'hindi': [
        { time: 0, text: "🎵 (संगीत)" },
        { time: 5, text: "दिल की धड़कन, सुरों का मेला" },
        { time: 10, text: "MoodWire के संग हर पल निराला" },
        { time: 15, text: "खुशियों की लहर, यादों का सफ़र" },
        { time: 20, text: "संगीत ही है अब अपना हमसफ़र" }
    ],
    'mann mera': [
        { time: 0, text: "🎶 (Intro Music)" },
        { time: 14, text: "Sari raat aahen bharta hai" },
        { time: 18, text: "Pal pal yaadon mein marta hai" },
        { time: 22, text: "Maane na meri mann mera" },
        { time: 26, text: "Thode thode hosh udaaye" },
        { time: 30, text: "Thode thode sapne dikhaye" },
        { time: 34, text: "Maane na meri mann mera" },
        { time: 38, text: "Zinda hai tujhse" },
        { time: 42, text: "Ye meri awaaraagi" }
    ],
    'hasi ban gaye': [
        { time: 0, text: "🎵 (Music)" },
        { time: 10, text: "Haan hasi ban gaye" },
        { time: 14, text: "Haan nami ban gaye" },
        { time: 18, text: "Tum mere aasmaan" },
        { time: 22, text: "Meri zameen ban gaye" },
        { time: 26, text: "Ooo... hmmm..." }
    ],
    'kya mujhe pyar hai': [
        { time: 0, text: "🎸 (Guitar Intro)" },
        { time: 12, text: "Kyun aaj kal neend kam khwaab zyada hai" },
        { time: 18, text: "Kya mujhe pyar hai yaara?" },
        { time: 24, text: "Kyun aaj kal dhal rahi shaam zyada hai" },
        { time: 30, text: "Kya mujhe pyar hai yaara?" }
    ],
    'saiba': [
        { time: 0, text: "🎵 (Music)" },
        { time: 8, text: "Saiba... Saiba..." },
        { time: 14, text: "Tere bina jeena bhi kya jeena" },
        { time: 20, text: "O saiba... mere saiba..." },
        { time: 26, text: "Mili jo teri nazar se nazar" },
        { time: 32, text: "To hum bhi hosh gawa baithe" }
    ]
};

export const lyricsService = {
    getLyrics: (_trackId: string, trackTitle: string = ''): LyricLine[] => {
        const title = trackTitle.toLowerCase();

        if (title.includes('mann mera')) return mockLyrics['mann mera'];
        if (title.includes('hasi ban') || title.includes('hasi ban gaye')) return mockLyrics['hasi ban gaye'];
        if (title.includes('pyar hai')) return mockLyrics['kya mujhe pyar hai'];
        if (title.includes('saiba')) return mockLyrics['saiba'];

        const isHindi = title.includes('hindi') || title.includes('bollywood');
        return isHindi ? mockLyrics['hindi'] : mockLyrics['default'];
    }
};
