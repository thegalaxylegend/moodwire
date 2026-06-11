import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'moodwire_cache';
const TRACKS_STORE = 'tracks';
const PREFS_STORE = 'preferences';

let dbPromise: Promise<IDBPDatabase>;

export const initCache = () => {
    dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(TRACKS_STORE)) {
                db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(PREFS_STORE)) {
                db.createObjectStore(PREFS_STORE);
            }
        },
    });
};

export const cacheService = {
    saveTrack: async (track: any) => {
        const db = await dbPromise;
        return db.put(TRACKS_STORE, track);
    },

    getTrack: async (id: string) => {
        const db = await dbPromise;
        return db.get(TRACKS_STORE, id);
    },

    getAllTracks: async () => {
        const db = await dbPromise;
        return db.getAll(TRACKS_STORE);
    },

    setPreference: async (key: string, value: any) => {
        const db = await dbPromise;
        return db.put(PREFS_STORE, value, key);
    },

    getPreference: async (key: string) => {
        const db = await dbPromise;
        return db.get(PREFS_STORE, key);
    }
};
