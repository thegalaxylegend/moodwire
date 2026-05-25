const { SYLLABUS_DB } = require('./src/lib/constants');

console.log("Subjects in SYLLABUS_DB:", Object.keys(SYLLABUS_DB));
for (const sub of Object.keys(SYLLABUS_DB)) {
    const topics = SYLLABUS_DB[sub];
    console.log(`\nSubject: ${sub} (${topics.length} total topics)`);
    const byClass = {};
    topics.forEach(t => {
        byClass[t.class] = (byClass[t.class] || 0) + 1;
    });
    console.log("By Class:", byClass);
}
