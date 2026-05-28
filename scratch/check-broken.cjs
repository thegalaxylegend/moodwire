const fs = require('fs');
const path = require('path');

const questionDb = JSON.parse(fs.readFileSync('public/question-db.json', 'utf8'));

// Parse SYLLABUS_DATA from constants.ts
const constantsPath = 'src/lib/constants.ts';
const SYLLABUS_DATA = {};
const content = fs.readFileSync(constantsPath, 'utf8');
const subjectRegex = /^\s*(?:['"]?)([\w\s]+)(?:['"]?):\s*\[/gm;
let match;
const subjects = [];
while ((match = subjectRegex.exec(content)) !== null) {
    subjects.push({ name: match[1].trim(), start: match.index });
}
for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    const nextStart = subjects[i + 1] ? subjects[i + 1].start : content.length;
    const block = content.substring(subject.start, nextStart);
    const topics = [];
    const objBlocks = [...block.matchAll(/{[\s\S]*?}/g)].map(m => m[0]);
    objBlocks.forEach(objStr => {
        const topicNameMatch = objStr.match(/topic:\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/);
        const classMatch = objStr.match(/class:\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/);
        if (topicNameMatch) {
            const topic = (topicNameMatch[1] || topicNameMatch[2] || '').replace(/\\"/g, '"').replace(/\\'/g, "'");
            const cls = classMatch ? (classMatch[1] || classMatch[2] || '').replace(/Class\s*/i, '').trim() : '';
            topics.push({ topic, class: cls });
        }
    });
    SYLLABUS_DATA[subject.name] = topics;
}

function check(url, topicName, realSubject) {
    const [, examSlug] = url.split('/');
    const topicList = SYLLABUS_DATA[realSubject] || [];
    const matchedSyllabusTopic = topicList.find(t => {
        const qTopicClean = topicName.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
        const sTopicClean = t.topic.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
        if (qTopicClean !== sTopicClean) return false;
        
        if (t.class) {
            const examClassNum = examSlug.replace('class-', '');
            const isJeeNeet = examSlug === 'jee-mains' || examSlug === 'jee-advanced' || examSlug === 'neet';
            if (isJeeNeet) {
                return t.class === '11' || t.class === '12';
            } else {
                return t.class === examClassNum;
            }
        }
        return true;
    });
    const topicClass = matchedSyllabusTopic ? matchedSyllabusTopic.class : '';

    console.log(`\nURL: ${url} | Topic: "${topicName}" | Class resolved: "${topicClass}"`);

    const relatedQuestions = Object.values(questionDb).filter((q) => {
        if (!q.topic) return false;

        // Strict Subject Filter
        if (realSubject && q.subject) {
            const qSub = q.subject.toLowerCase();
            const subName = realSubject.toLowerCase();
            const isSubjectMatch = qSub === subName || 
                (qSub.includes(subName) && !(subName === 'science' && qSub.includes('social science'))) || 
                (subName.includes(qSub) && !(qSub === 'science' && subName.includes('social science')));
            if (!isSubjectMatch) return false;
        }

        // Class Filter
        if (topicClass) {
            const qTopicList = SYLLABUS_DATA[q.subject] || [];
            const qSyllabusTopic = qTopicList.find(t => {
                const qTopicClean = (q.topic || '').toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                const sTopicClean = t.topic.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                if (qTopicClean !== sTopicClean) return false;
                
                if (t.class && q.canonicalExam) {
                    const examClassNum = q.canonicalExam.replace('class-', '');
                    const isJeeNeet = q.canonicalExam === 'jee-mains' || q.canonicalExam === 'jee-advanced' || q.canonicalExam === 'neet';
                    if (isJeeNeet) {
                        return t.class === '11' || t.class === '12';
                    } else {
                        return t.class === examClassNum;
                    }
                }
                return true;
            });
            const qClass = qSyllabusTopic ? qSyllabusTopic.class : '';
            if (!qSyllabusTopic || (qClass && qClass !== topicClass)) {
                return false;
            }
        }

        if (!q.topic || !q.topic.trim()) return false;
        const qTopic = q.topic.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
        const pTopic = topicName.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
        return qTopic === pTopic;
    });

    console.log(`Matched questions count: ${relatedQuestions.length}`);
    if (relatedQuestions.length > 0) {
        console.log(`Sample matched questions:`);
        relatedQuestions.slice(0, 3).forEach(q => {
            console.log(` - Slug: "${q.slug}" | CanonicalExam: "${q.canonicalExam}" | Topic: "${q.topic}" | Subject: "${q.subject}"`);
        });
    }
}

check('/class-8/science/sound', 'Sound', 'Science');
check('/class-9/mathematics/circles', 'Circles', 'Mathematics');
check('/class-9/mathematics/polynomials', 'Polynomials', 'Mathematics');
check('/class-9/mathematics/surface-areas-and-volumes', 'Surface Areas and Volumes', 'Mathematics');
check('/class-9/mathematics/triangles', 'Triangles', 'Mathematics');
