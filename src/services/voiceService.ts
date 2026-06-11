export const voiceService = {
    speak: (text: string, voiceName: string = 'Sweet') => {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a nice voice
        const voices = window.speechSynthesis.getVoices();

        // Note: 'Sweet' is a preferred name, we'll try to find a female/soft voice as fallback
        const preferredVoice = voices.find(v =>
            v.name.includes(voiceName) ||
            (voiceName === 'Sweet' && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English')))
        );

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for 'Sweet' effect
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    },

    announceMood: (mood: string) => {
        const phrases = [
            `Setting the vibe to ${mood}.`,
            `Switching to ${mood} energy.`,
            `Let's get ${mood}.`,
            `Time for some ${mood} music.`
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        voiceService.speak(randomPhrase);
    },

    welcome: () => {
        voiceService.speak("Welcome back to MoodWire. Your personalized vibe is ready.");
    }
};

// Initialize voices (some browsers need this)
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
}
