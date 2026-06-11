
export class DisplayTransformer {
    private static readonly NOISE_PATTERNS = [
        /\[.*?official.*?\]/gi,
        /\(.*?official.*?\)/gi,
        /\[.*?lyric.*?\]/gi,
        /\(.*?lyric.*?\)/gi,
        /\[.*?hd.*?\]/gi,
        /\[.*?1080p.*?\]/gi,
        /\[.*?4k.*?\]/gi,
        /\|.*$/g, // Remove everything after pipe
        /\(.*?video.*?\)/gi,
        /\[.*?video.*?\]/gi,
        /video official/gi,
        /official video/gi,
        /full song/gi,
        /full video/gi,
        /lyrical video/gi,
        /- topic$/gi,
        /- vEVO$/gi
    ];

    /**
     * Cleans a track title for display.
     * Example: "Song Name [Official Video] HD" -> "Song Name"
     */
    public static cleanTitle(title: string): string {
        let clean = title;
        this.NOISE_PATTERNS.forEach(pattern => {
            clean = clean.replace(pattern, '');
        });

        // Clean up excess whitespace
        return clean.replace(/\s+/g, ' ').trim();
    }

    /**
     * Cleans an artist name for display.
     * Example: "Arijit Singh - Topic" -> "Arijit Singh"
     */
    public static cleanArtist(artist: string): string {
        let clean = artist;
        clean = clean.replace(/- topic$/gi, '');
        clean = clean.replace(/- vEVO$/gi, '');
        clean = clean.replace(/official/gi, '');

        return clean.replace(/\s+/g, ' ').trim();
    }
}
