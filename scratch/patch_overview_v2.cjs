const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Admin/Downloads/Desktop/src/pages/dashboard/Overview.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF temporarily for easier matching
let normalized = content.replace(/\r\n/g, '\n');

// Replacement 1: Cache buster in the first useEffect
const regex1 = /useEffect\(\(\) => \{\s*if \(user && authResolved\) \{\s*fetchStats\(\);\s*\} else if \(!user\) \{\s*setLoading\(false\);\s*\}\s*\}, \[user, authResolved\]\);/;

const replacement1 = `useEffect(() => {
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

if (regex1.test(normalized)) {
    normalized = normalized.replace(regex1, replacement1);
    console.log("Successfully replaced Target 1!");
} else {
    console.log("Error: Target 1 Regex did not match!");
}

// Replacement 3: Second recommended video Link (if not already replaced)
const regex3 = /<Link key=\{idx\} to=\{\`\/dashboard\/lectures\/\$\{rec\.topic\.toLowerCase\(\)\.replace\(\/\\s\+\/g, '-'\)\}\`\} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary\/40 transition-all">/;
const replacement3 = `<Link key={idx} to={\`/dashboard/lectures/\${rec.topic.toLowerCase().replace(/\\s+/g, '-')}?videoId=\${rec.video.id}\`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/40 transition-all">`;

if (regex3.test(normalized)) {
    normalized = normalized.replace(regex3, replacement3);
    console.log("Successfully replaced Target 3!");
} else {
    // Let's check if it already has ?videoId=
    if (normalized.includes('?videoId=${rec.video.id}') && normalized.includes('key={idx}')) {
        console.log("Target 3 is already updated!");
    } else {
        console.log("Error: Target 3 Regex did not match!");
    }
}

// Restore CRLF line endings
const restored = normalized.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, restored, 'utf8');
console.log("Finished patching Overview.tsx cleanly!");
