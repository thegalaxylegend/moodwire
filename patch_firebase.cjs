const fs = require('fs');
const file = 'src/lib/firebase.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('enableIndexedDbPersistence')) {
    code = code.replace(
        'import { getFirestore } from "firebase/firestore";',
        'import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from "firebase/firestore";'
    );

    code += `
// Enable offline persistence
if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a a time.
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('The current browser does not support all of the features required to enable persistence');
        }
    });
}
`;
    fs.writeFileSync(file, code);
    console.log('Firebase offline persistence added.');
} else {
    console.log('Firebase offline persistence already enabled.');
}
