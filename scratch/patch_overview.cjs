const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Admin/Downloads/Desktop/src/pages/dashboard/Overview.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replacement 1: Cache buster in the first useEffect
const target1 = `    useEffect(() => {
        if (user && authResolved) {
            fetchStats();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, authResolved]);`;

const replacement1 = `    useEffect(() => {
        if (user && authResolved) {
            // One-time cache buster to clear old recommendations and force real working videos
            const busterKey = \`recs_buster_v8_\${user.id}\`;
            if (!localStorage.getItem(busterKey)) {
                const keys = Object.keys(localStorage);
                keys.forEach(k => {
                    if (k.startsWith('exam_compass_recommended_videos_') || k.startsWith('vid_cache_v5_')) {
                        localStorage.removeItem(k);
                    }
                });
                localStorage.setItem(busterKey, 'true');
                console.log('[Overview] Curated DB cleanup: cleared recommendations cache.');
            }
            fetchStats();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, authResolved]);`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log("Successfully replaced Target 1 (Cache buster)!");
} else {
    console.log("Error: Target 1 not found!");
}

// Replacement 2: First recommended video Link
const target2 = `<Link to={\`/dashboard/lectures/\${rec.topic.toLowerCase().replace(/\\s+/g, '-')}\`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col w-full">`;
const replacement2 = `<Link to={\`/dashboard/lectures/\${rec.topic.toLowerCase().replace(/\\s+/g, '-')}?videoId=\${rec.video.id}\`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col w-full">`;

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    console.log("Successfully replaced Target 2 (First Link)!");
} else {
    console.log("Error: Target 2 not found!");
}

// Replacement 3: Second recommended video Link
const target3 = `<Link key={idx} to={\`/dashboard/lectures/\${rec.topic.toLowerCase().replace(/\\s+/g, '-')}\`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/40 transition-all">`;
const replacement3 = `<Link key={idx} to={\`/dashboard/lectures/\${rec.topic.toLowerCase().replace(/\\s+/g, '-')}?videoId=\${rec.video.id}\`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/40 transition-all">`;

if (content.includes(target3)) {
    content = content.replace(target3, replacement3);
    console.log("Successfully replaced Target 3 (Second Link)!");
} else {
    console.log("Error: Target 3 not found!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Finished patching Overview.tsx successfully!");
