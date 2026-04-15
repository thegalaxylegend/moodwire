
import * as fs from 'fs';

const filePath = 'c:\\Users\\Admin\\Downloads\\Desktop\\src\\lib\\constants.ts';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

const subjectPrefixes: Record<string, string> = {
    'Physics': 'phy',
    'Chemistry': 'che',
    'Mathematics': 'math',
    'Biology': 'bio',
    'Computer Science': 'cs',
    'Science': 'sci',
    'Social Science': 'ss',
    'English': 'eng'
};

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 15) // Keep it short
        .replace(/_$/, '');
}

let currentPrefix = '';
const outLines = [];

for (let line of lines) {
    // Detect subject section
    for (const [subject, prefix] of Object.entries(subjectPrefixes)) {
        if (line.trim().startsWith(`${subject}: [`)) {
            currentPrefix = prefix;
            break;
        }
    }

    // Detect topic without ID
    if (currentPrefix && line.includes('topic: "') && !line.includes('id: "')) {
        const topicMatch = line.match(/topic: "([^"]+)"/);
        const classMatch = line.match(/class: "Class (\d+)"/);
        if (topicMatch && classMatch) {
            const topicName = topicMatch[1];
            const classNum = classMatch[1];
            const id = `${currentPrefix}_${classNum}_${slugify(topicName)}`;
            line = line.replace('{ topic:', `{ id: "${id}", topic:`);
        }
    }
    outLines.push(line);
}

fs.writeFileSync(filePath, outLines.join('\n'));
console.log("Harden constants.ts completed.");
