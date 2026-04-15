import { useState, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { SYLLABUS_DB } from '../../lib/constants';
import { useUserStore } from '../../store/userStore';

import { Network, RefreshCw } from 'lucide-react';
import { getWeakTopics } from '../../services/topicStrengthService';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    }
});

export const ConceptMap = () => {
    const { user } = useUserStore();
    const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
    const [svgCode, setSvgCode] = useState<string>('');
    const [isRendering, setIsRendering] = useState<boolean>(true);
    const [weakTopics, setWeakTopics] = useState<string[]>([]);
    
    // Load weak topics to color code nodes
    useEffect(() => {
        if (user) {
            getWeakTopics(user.id, 50, user.userClass, user.targetExam).then(stats => {
                const weak = stats.map(s => s.topic);
                setWeakTopics(weak);
            }).catch(err => console.error("Failed to load weak stats", err));
        }
    }, [user]);

    // Available subjects based on exam
    const subjects = useMemo(() => {
        return Object.keys(SYLLABUS_DB).filter(subject => SYLLABUS_DB[subject].length > 0);
    }, []);

    // Effect to render mermaid when subject changes
    useEffect(() => {
        let isMounted = true;
        
        const renderGraph = async () => {
            setIsRendering(true);
            try {
                const topics = SYLLABUS_DB[selectedSubject] || [];
                if (topics.length === 0) {
                    setSvgCode('<div>No topics found for this subject.</div>');
                    setIsRendering(false);
                    return;
                }

                // Mermaid doesn't like spaces or special chars in IDs
                const cleanId = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');

                let mermaidDef = 'graph TD\n';
                
                // Add styling for weak vs strong
                mermaidDef += 'classDef strong fill:#10b98120,stroke:#10b981,stroke-width:2px,color:#fff;\n';
                mermaidDef += 'classDef weak fill:#ef444420,stroke:#ef4444,stroke-width:2px,color:#fff;\n';
                mermaidDef += 'classDef neutral fill:#32343e,stroke:#4b5563,stroke-width:2px,color:#fff;\n';

                const addedEdges = new Set<string>();

                topics.forEach(t => {
                    const tId = cleanId(t.id);
                    // Add node text
                    const isWeak = weakTopics.includes(t.topic);
                    const styleClass = isWeak ? 'weak' : 'neutral'; // Defaults to neutral unless marked weak
                    
                    // Simple HTML label for better rendering
                    mermaidDef += `${tId}["${t.topic}"]:::${styleClass}\n`;

                    // Add links
                    if (t.prerequisites && t.prerequisites.length > 0) {
                        t.prerequisites.forEach(prereqId => {
                            const pId = cleanId(prereqId);
                            const edgeKey = `${pId}-${tId}`;
                            if (!addedEdges.has(edgeKey)) {
                                mermaidDef += `${pId} --> ${tId}\n`;
                                addedEdges.add(edgeKey);
                            }
                        });
                    }
                });

                const { svg } = await mermaid.render('mermaid-concept-map', mermaidDef);
                
                if (isMounted) {
                    setSvgCode(svg);
                }
            } catch (error) {
                console.error("Mermaid Render Error:", error);
                if (isMounted) {
                    // Try removing offending code or fallback
                    setSvgCode('<div class="text-red-400 p-4 bg-red-500/10 rounded-lg">Failed to render concept map. Graph may be too complex.</div>');
                }
            } finally {
                if (isMounted) setIsRendering(false);
            }
        };

        // Add a tiny delay to allow React to paint the loading state
        const timeoutId = setTimeout(() => {
            renderGraph();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [selectedSubject, weakTopics]);

    return (
        <div className="min-h-screen bg-[#0a0b10] text-white">
            
            <main className="pt-12 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-cabinet flex items-center gap-3">
                            <Network className="text-purple-500" size={32} />
                            Mastery Map
                        </h1>
                        <p className="text-white/60 mt-2 font-manrope">
                            Visualize topic dependencies. Red nodes indicate weaknesses blocking your progress.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#2a2b36] p-1.5 rounded-xl border border-white/5 overflow-x-auto w-full md:w-auto">
                        {subjects.map(subject => (
                            <button
                                key={subject}
                                onClick={() => setSelectedSubject(subject)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                                    selectedSubject === subject 
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl min-h-[600px] flex items-center justify-center relative">
                    <div className="absolute top-4 left-4 flex gap-4">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div> Weakness
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div> Strong
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-3 h-3 rounded-full bg-[#32343e] border border-gray-600"></div> Neutral
                        </div>
                    </div>

                    {isRendering ? (
                        <div className="flex flex-col items-center justify-center text-white/50 animate-pulse">
                            <RefreshCw size={32} className="animate-spin mb-4 text-purple-500" />
                            <span className="font-manrope">Mapping neural pathways...</span>
                        </div>
                    ) : (
                        <div 
                            className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing flex justify-center py-10"
                            dangerouslySetInnerHTML={{ __html: svgCode }}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};
