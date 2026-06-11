import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';


interface Event {
    id: string;
    type: string;
    data: any;
    sessionId: string;
    timestamp: any;
    clientTimestamp: number;
}

interface TrainingRow {
    user_id: string;
    session_id: string;
    track_id: string;
    rank_position: number;
    exploration_flag: boolean;
    predicted_score_v3: number;
    action_label: number;
    timestamp: any;
    [key: string]: any;
}

export const dataExportService = {
    /**
     * Fetches raw recommendation events and matches them with subsequent actions
     * to create a labeled dataset for Learning-to-Rank training.
     */
    generateTrainingDataset: async (userId: string) => {
        console.log(`[ML_EXPORT] Starting dataset generation for ${userId}...`);

        try {
            // 1. Fetch recommendation events (The features)
            const recQuery = query(
                collection(db, 'users', userId, 'events'),
                orderBy('timestamp', 'desc'),
                limit(1000)
            );
            const snapshot = await getDocs(recQuery);

            const rawEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

            // 2. Separate recommendations from outcomes (actions)
            const recServed = rawEvents.filter(e => e.type === 'recommendation_served');
            const trackActions = rawEvents.filter(e =>
                ['track_complete', 'track_skip', 'track_play'].includes(e.type)
            );

            const dataset: TrainingRow[] = [];

            // 3. Label matching logic
            // We match a recommendation with an action if the action happened shortly after for the same track_id
            recServed.forEach((rec: any) => {
                const trackId = rec.data.trackId;
                const recTime = rec.clientTimestamp;

                // Find the first action for this track that occurred AFTER the recommendation
                const action = trackActions.find((a: any) =>
                    a.data.trackId === trackId &&
                    a.clientTimestamp > recTime &&
                    a.clientTimestamp < recTime + (10 * 60 * 1000) // Within 10 mins
                );

                let label = 0.0; // Default: saw it but no definitive action recorded (or ignored)
                if (action) {
                    if (action.type === 'track_complete') label = 1.0;
                    else if (action.type === 'track_skip') {
                        // Check skip duration from action data
                        const progress = action.data.progress || 0;
                        label = progress < 20 ? -1.0 : 0.0;
                    }
                    else if (action.type === 'track_play') label = 0.5;
                }

                dataset.push({
                    user_id: userId,
                    session_id: rec.sessionId,
                    track_id: trackId,
                    rank_position: rec.data.rank,
                    exploration_flag: rec.data.explorationFlag,
                    predicted_score_v3: rec.data.predictedScore,
                    action_label: label,
                    timestamp: rec.timestamp,
                    ...rec.data.features
                });
            });

            console.log(`[ML_EXPORT] Generated ${dataset.length} labeled rows.`);
            return dataset;

        } catch (error) {
            console.error('[ML_EXPORT] Error generating dataset:', error);
            throw error;
        }
    },

    downloadAsCSV: (dataset: TrainingRow[]) => {
        if (dataset.length === 0) return;

        const headers = Object.keys(dataset[0]).join(',');
        const rows = dataset.map(row => {
            return Object.values(row).map(val =>
                typeof val === 'object' ? JSON.stringify(val) : val
            ).join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `moodwire_training_data_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getDatasetDiagnostics: async (userId: string) => {
        const dataset = await dataExportService.generateTrainingDataset(userId);
        if (dataset.length === 0) return { totalRows: 0, sessions: 0, labels: {} };

        const sessions = new Set(dataset.map(r => r.session_id));
        const labels: Record<string, number> = {};

        dataset.forEach(row => {
            const key = row.action_label.toString();
            labels[key] = (labels[key] || 0) + 1;
        });

        return {
            totalRows: dataset.length,
            sessions: sessions.size,
            labels,
            avgSessionDepth: dataset.length / sessions.size
        };
    }
};
