import { useState, useRef } from 'react';
import { SYLLABUS_DB } from '../../lib/constants';
import { db } from '../../lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { slugify } from '../../lib/utils';
import { UploadCloud, AlertTriangle, Loader2, FileUp, FileJson, CheckCircle2, X } from 'lucide-react';

interface ImportedTopic {
    subject: string;
    topic: string;
    chapter?: string;
    class?: string;
    weightage?: number;
}

export const SyllabusUpload = () => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [importedData, setImportedData] = useState<ImportedTopic[]>([]);
    const [importMode, setImportMode] = useState<'constants' | 'file'>('constants');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                let parsed: ImportedTopic[] = [];

                if (file.name.endsWith('.json')) {
                    // JSON Import
                    const json = JSON.parse(text);
                    if (Array.isArray(json)) {
                        parsed = json.map((item: any) => ({
                            subject: item.subject || 'General',
                            topic: item.topic || item.name || item.title,
                            chapter: item.chapter || item.unit,
                            class: item.class || item.grade,
                            weightage: item.weightage || item.weight || 0
                        })).filter(t => t.topic);
                    } else if (typeof json === 'object') {
                        // Handle { "Physics": ["topic1", "topic2"] } format
                        Object.entries(json).forEach(([subject, topics]: [string, any]) => {
                            if (Array.isArray(topics)) {
                                topics.forEach(t => {
                                    parsed.push({
                                        subject,
                                        topic: typeof t === 'string' ? t : (t.topic || t.name),
                                        chapter: typeof t === 'object' ? (t.chapter || t.unit) : undefined,
                                        weightage: typeof t === 'object' ? (t.weightage || 0) : 0
                                    });
                                });
                            }
                        });
                    }
                } else if (file.name.endsWith('.csv')) {
                    // CSV Import (Subject, Topic, Chapter, Class, Weightage)
                    const lines = text.split('\n').filter(l => l.trim());
                    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

                    const subjectIdx = headers.findIndex(h => h.includes('subject'));
                    const topicIdx = headers.findIndex(h => h.includes('topic') || h.includes('name'));
                    const chapterIdx = headers.findIndex(h => h.includes('chapter') || h.includes('unit'));
                    const classIdx = headers.findIndex(h => h.includes('class') || h.includes('grade'));
                    const weightIdx = headers.findIndex(h => h.includes('weight'));

                    for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',').map(c => c.trim());
                        if (cols.length >= 2) {
                            parsed.push({
                                subject: subjectIdx >= 0 ? cols[subjectIdx] : 'General',
                                topic: topicIdx >= 0 ? cols[topicIdx] : cols[1],
                                chapter: chapterIdx >= 0 ? cols[chapterIdx] : undefined,
                                class: classIdx >= 0 ? cols[classIdx] : undefined,
                                weightage: weightIdx >= 0 ? Number(cols[weightIdx]) || 0 : 0
                            });
                        }
                    }
                }

                setImportedData(parsed);
                setImportMode('file');
                setLog([`Parsed ${parsed.length} topics from ${file.name}`]);
            } catch (err: any) {
                setLog([`Failed to parse file: ${err.message}`]);
                setStatus('error');
            }
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        const source = importMode === 'constants' ? 'constants.ts' : 'imported file';
        if (!window.confirm(`This will sync topics from ${source} to Firestore. Continue?`)) return;

        setStatus('uploading');

        try {
            const batch = writeBatch(db);
            const syllabusRef = collection(db, 'syllabus_v2');
            let count = 0;

            if (importMode === 'constants') {
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
            } else {
                importedData.forEach(item => {
                    const docId = `${slugify(item.subject)}-${slugify(item.topic)}`;
                    const docRef = doc(syllabusRef, docId);
                    batch.set(docRef, {
                        topic: item.topic,
                        subject: item.subject,
                        chapter: item.chapter || '',
                        class: item.class || '',
                        weightage: item.weightage || 0,
                        updated_at: new Date().toISOString()
                    });
                    count++;
                });
            }

            await batch.commit();
            setLog(prev => [...prev, `✅ Successfully uploaded ${count} topics to Firestore.`]);
            setStatus('success');
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setLog(prev => [...prev, `❌ Error: ${e.message}`]);
        }
    };

    // Group imported data by subject for preview
    const groupedImport = importedData.reduce((acc, item) => {
        if (!acc[item.subject]) acc[item.subject] = [];
        acc[item.subject].push(item);
        return acc;
    }, {} as Record<string, ImportedTopic[]>);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-text-main font-heading flex items-center gap-3">
                    <UploadCloud className="text-primary" size={32} />
                    Syllabus Database
                </h1>
                <p className="text-text-muted mt-2">
                    Sync syllabus data to Cloud Firestore. Import from code constants or upload a CSV/JSON file.
                </p>
            </header>

            {/* Import Mode Toggle */}
            <div className="flex gap-3">
                <button
                    onClick={() => { setImportMode('constants'); setImportedData([]); }}
                    className={`flex-1 p-4 rounded-xl border text-sm font-bold transition-all ${
                        importMode === 'constants' 
                            ? 'bg-primary/10 border-primary/40 text-primary' 
                            : 'bg-surface border-white/10 text-text-muted hover:border-white/20'
                    }`}
                >
                    <FileJson size={20} className="mx-auto mb-2" />
                    From Code (constants.ts)
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 p-4 rounded-xl border text-sm font-bold transition-all ${
                        importMode === 'file' 
                            ? 'bg-primary/10 border-primary/40 text-primary' 
                            : 'bg-surface border-white/10 text-text-muted hover:border-white/20'
                    }`}
                >
                    <FileUp size={20} className="mx-auto mb-2" />
                    Import CSV / JSON
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                />
            </div>

            <div className="glass-card p-8 border border-white/10">
                {importMode === 'constants' ? (
                    <>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3 text-yellow-500 mb-8">
                            <AlertTriangle size={24} className="shrink-0" />
                            <p className="text-sm">
                                <strong>Warning:</strong> This performs a Batch Write. It will overwrite topics with the same ID.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold text-text-main">Built-in Syllabus Preview:</h3>
                            <ul className="grid grid-cols-2 gap-4">
                                {Object.entries(SYLLABUS_DB).map(([subject, topics]) => (
                                    <li key={subject} className="bg-surface p-3 rounded border border-white/5 flex justify-between">
                                        <span>{subject}</span>
                                        <span className="font-mono text-primary font-bold">{topics.length} Topics</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                ) : (
                    <>
                        {importedData.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-text-main flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-400" />
                                        Imported: {importedData.length} topics
                                    </h3>
                                    <button 
                                        onClick={() => { setImportedData([]); setImportMode('constants'); setLog([]); }}
                                        className="text-xs text-text-muted hover:text-red-400 flex items-center gap-1"
                                    >
                                        <X size={12} /> Clear
                                    </button>
                                </div>
                                <ul className="grid grid-cols-2 gap-4">
                                    {Object.entries(groupedImport).map(([subject, topics]) => (
                                        <li key={subject} className="bg-surface p-3 rounded border border-white/5 flex justify-between">
                                            <span>{subject}</span>
                                            <span className="font-mono text-primary font-bold">{topics.length} Topics</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="max-h-48 overflow-y-auto bg-black/20 rounded-lg p-3 border border-white/5">
                                    {importedData.slice(0, 20).map((t, i) => (
                                        <div key={i} className="text-xs text-text-muted py-1 border-b border-white/5 last:border-0">
                                            <span className="text-primary font-bold">{t.subject}</span> → {t.topic}
                                            {t.chapter && <span className="text-white/30"> ({t.chapter})</span>}
                                        </div>
                                    ))}
                                    {importedData.length > 20 && (
                                        <p className="text-xs text-white/30 pt-2">...and {importedData.length - 20} more</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-text-muted">
                                <FileUp size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm">Upload a .csv or .json file to preview topics</p>
                                <p className="text-xs text-white/30 mt-2">CSV columns: subject, topic, chapter, class, weightage</p>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={status === 'uploading' || (importMode === 'file' && importedData.length === 0)}
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
