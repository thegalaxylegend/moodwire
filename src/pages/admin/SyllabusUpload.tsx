import { useState } from 'react';
import { SYLLABUS_DB } from '../../lib/constants';
import { db } from '../../lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { slugify } from '../../lib/utils';
import { UploadCloud, AlertTriangle, Loader2 } from 'lucide-react';

export const SyllabusUpload = () => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    const handleUpload = async () => {
        if (!window.confirm("This will OVERWRITE the Syllabus in Firestore. Are you sure?")) return;

        setStatus('uploading');
        setLog([]);

        try {
            const batch = writeBatch(db);
            const syllabusRef = collection(db, 'syllabus_v2'); // V2 for Cloud Syllabus
            let count = 0;

            Object.entries(SYLLABUS_DB).forEach(([subject, topics]) => {
                topics.forEach(topic => {
                    const docId = `${slugify(subject)}-${slugify(topic.topic)}`;
                    const docRef = doc(syllabusRef, docId);

                    batch.set(docRef, {
                        ...topic,
                        subject: subject,
                        updated_at: new Date().toISOString()
                    });

                    count++;
                });
            });

            await batch.commit();
            setLog(prev => [...prev, `Successfully uploaded ${count} topics to Firestore.`]);
            setStatus('success');
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setLog(prev => [...prev, `Error: ${e.message}`]);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-text-main font-heading flex items-center gap-3">
                    <UploadCloud className="text-primary" size={32} />
                    Syllabus Database
                </h1>
                <p className="text-text-muted mt-2">
                    Migrate strict `constants.ts` data to Cloud Firestore for real-time updates.
                </p>
            </header>

            <div className="glass-card p-8 border border-white/10">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3 text-yellow-500 mb-8">
                    <AlertTriangle size={24} className="shrink-0" />
                    <p className="text-sm">
                        <strong>Warning:</strong> This action performs a Batch Write. It will overwrite existing topics with the same ID.
                        Only run this when you want to push code changes to the cloud.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-text-main">Stats Preview:</h3>
                    <ul className="grid grid-cols-2 gap-4">
                        {Object.entries(SYLLABUS_DB).map(([subject, topics]) => (
                            <li key={subject} className="bg-surface p-3 rounded border border-white/5 flex justify-between">
                                <span>{subject}</span>
                                <span className="font-mono text-primary font-bold">{topics.length} Topics</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={status === 'uploading'}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {status === 'uploading' ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                        {status === 'uploading' ? 'Syncing...' : 'Push to Cloud'}
                    </button>
                </div>

                {log.length > 0 && (
                    <div className="mt-8 bg-black/30 p-4 rounded-lg font-mono text-xs text-green-400 border border-white/5">
                        {log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
};
