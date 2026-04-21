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
for (const s of slugs) {
    const c = fs.readFileSync(dir + '/' + s + '.md', 'utf8');
    const hasJson = /\{"heading"\s*:\s*"/.test(c);
    const hasObj = c.includes('[object Object]');
    // Check the shield regex from sync-blogs.js line 33
    const shieldTriggered = c.includes('[object Object]') || /\{[\s\S]*?"heading":[\s\S]*?"body":/.test(c);
    console.log(s + ': shieldBlocked=' + shieldTriggered + ' JSON=' + hasJson + ' ObjObj=' + hasObj + ' Size=' + c.length);
}
