🔒 Fix hardcoded Firebase credentials in fallback config

🎯 **What:**
The `src/lib/firebase.ts` file previously contained hardcoded Firebase API keys and project identifiers as fallbacks in the `firebaseConfig` object. This PR replaces these hardcoded values with empty strings (`''`).

⚠️ **Risk:**
Hardcoded credentials pose a security risk because they expose the development or production project's keys in version control, allowing unauthorized users to potentially access or abuse the Firebase resources. Even if the environment variables are intended to override them, the presence of the keys in source code is bad security hygiene.

🛡️ **Solution:**
The fallbacks are updated to empty strings. The application will now strictly rely on environment variables (`VITE_FIREBASE_API_KEY`, etc.). If the variables are missing, Firebase initialization will throw an appropriate error rather than silently defaulting to exposed keys.
