
const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, '../src/content/blogs');
const blogsDataPath = path.join(__dirname, '../src/data/blogs.ts');

function getShiftedDate(dateCounts, baseDate) {
    let daysBack = 1;
    while (true) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - daysBack);
        if (d.getDay() === 0) { // Optional: skip Sundays if you want
            daysBack++;
            continue;
        }
        const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if ((dateCounts[dateStr] || 0) < 6) {
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
            return dateStr;
        }
        daysBack++;
    }
}

async function rehabilitate() {
    console.log('🧹 Jules: Rehabilitating Blog Dates...');
    
    if (!fs.existsSync(blogsDir)) {
        console.error('❌ Blogs directory not found');
        return;
    }

    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    const dateCounts = {};
    const baseDate = new Date('2026-03-17'); // Current "today" for logic

    for (const file of files) {
        const filePath = path.join(blogsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 1. Clean the date line
        // Match "Last Updated: Month Day, Year | Junk"
        const dateRegex = /\*Last Updated:\s*([A-Za-z]+ \d+, \d{4})(.*?)\*/;
        const match = content.match(dateRegex);
        
        if (match) {
            let originalDateStr = match[1];
            let cleanDate = originalDateStr;

            // 2. Diversify if today or over limit
            if (originalDateStr === 'March 17, 2026' || (dateCounts[originalDateStr] || 0) >= 6) {
                cleanDate = getShiftedDate(dateCounts, baseDate);
            } else {
                dateCounts[originalDateStr] = (dateCounts[originalDateStr] || 0) + 1;
            }

            const newDateLine = `*Last Updated: ${cleanDate}*`;
            content = content.replace(dateRegex, newDateLine);
            fs.writeFileSync(filePath, content);
        }
    }

    console.log('✅ Success: All blog dates cleaned and diversified.');
}

rehabilitate();
