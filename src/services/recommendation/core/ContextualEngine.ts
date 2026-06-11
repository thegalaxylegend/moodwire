export const ContextualEngine = {
    getTimeBasedContext: (_location?: any) => {
        const hour = new Date().getHours();

        // Default to global/system if mapping isn't Indian, but
        // for this implementation we assume heavy Indian priority
        const context = {
            timeOfDay: 'Daytime',
            boostedGenres: ['Pop'],
            boostedKeywords: ['Pop']
        };

        if (hour >= 5 && hour < 10) {
            context.timeOfDay = 'Morning';
            context.boostedGenres = ['Acoustic', 'Chill', 'Classical'];
            context.boostedKeywords = ['Devotional', 'Flute', 'Morning Vibes', 'Peaceful'];
        } else if (hour >= 10 && hour < 17) {
            context.timeOfDay = 'Daytime';
            context.boostedGenres = ['Pop', 'Indie', 'Alternative'];
            context.boostedKeywords = ['Bollywood Hits', 'Lofi Bollywood', 'Work Focus'];
        } else if (hour >= 17 && hour < 21) {
            context.timeOfDay = 'Evening';
            context.boostedGenres = ['Dance', 'Party', 'Electronic'];
            context.boostedKeywords = ['Punjabi Dance', 'Upbeat Bollywood', 'Telugu Mass Beats'];
        } else {
            // Night (9PM - 5AM)
            context.timeOfDay = 'Night';
            context.boostedGenres = ['Sad', 'Romance', 'R&B'];
            context.boostedKeywords = ['Late Night Bollywood', 'Ghazal', 'Sad Indie', 'Sleep'];
        }

        return context;
    }
};
