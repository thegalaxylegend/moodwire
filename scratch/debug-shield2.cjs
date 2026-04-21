const fs = require('fs');
const dir = 'src/content/blogs';
const slugs = [
    'comparing-quantities-class-8-notes',
    'cubes-and-cube-roots-class-8-notes',
    'databases-dbms-class-12-notes',
    'linear-equations-in-one-variable-class-8-notes',
    'number-systems-class-9-notes',
    'physics-mechanics-class-11-revision-notes-jee-neet',
    'rational-numbers-class-8-notes',
    'theory-of-computation-class-12-notes'
];

const shieldRegex = /^\s*\{\s*"heading"\s*:\s*"[^"]*"\s*,\s*"body"\s*:/m;

for (const s of slugs) {
    const c = fs.readFileSync(dir + '/' + s + '.md', 'utf8');
    const hasObj = c.includes('[object Object]');
    const hasJsonSquash = shieldRegex.test(c);
    
    if (hasObj || hasJsonSquash) {
        console.log('\n' + s + ':');
        console.log('  [object Object]:', hasObj);
        console.log('  JSON squash:', hasJsonSquash);
        
        if (hasJsonSquash) {
            const match = c.match(shieldRegex);
            if (match) {
                const idx = match.index;
                console.log('  Match snippet:', JSON.stringify(c.substring(idx, idx + 100)));
            }
        }
        if (hasObj) {
            const idx = c.indexOf('[object Object]');
            console.log('  ObjObj snippet:', JSON.stringify(c.substring(Math.max(0,idx-30), idx + 50)));
        }
    } else {
        console.log(s + ': NO TRIGGER (should register now?!)');
    }
}
