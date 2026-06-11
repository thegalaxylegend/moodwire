
export interface GeoData {
    ip: string;
    city: string;
    region: string;
    country: string;
    country_name: string;
    postal: string;
    latitude: number;
    longitude: number;
    timezone: string;
}

export const geoLocationService = {
    getLocation: async (): Promise<GeoData | null> => {
        try {
            // Priority: ipapi.co
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) return await response.json();
            throw new Error('ipapi failed');
        } catch (error) {
            console.warn('GeoLocationService using fallback logic due to CORS/Network error');
            // Hardcoded fallback or just let it be null. The store handles null by defaulting to 'IN' if needed.
            return null;
        }
    }
};
