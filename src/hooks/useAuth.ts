import { useEffect, useState } from 'react';
import {
    signInAnonymously,
    onAuthStateChanged,
    type User,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                setUser(null);
                setLoading(false);
                // We will NOT auto-login anonymously here to allow the landing/login page to show
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const signInWithEmail = async (identifier: string, pass: string) => {
        let email = identifier;

        // If it looks like a username (no @), resolve it from Firestore
        if (!identifier.includes('@')) {
            const usernameQuery = query(collection(db, 'usernames'), where('username', '==', identifier.toLowerCase()));
            const querySnapshot = await getDocs(usernameQuery);
            if (querySnapshot.empty) {
                throw new Error('Username not found');
            }
            email = querySnapshot.docs[0].data().email;
        }

        return signInWithEmailAndPassword(auth, email, pass);
    };

    const signUpWithEmail = async (email: string, pass: string, username: string) => {
        // Check if username is taken
        const usernameQuery = query(collection(db, 'usernames'), where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(usernameQuery);
        if (!querySnapshot.empty) {
            throw new Error('Username is already taken');
        }

        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: username });

        // Save username mapping
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
            username: username.toLowerCase(),
            email: email,
            uid: res.user.uid
        });

        return res;
    };

    const signInAsGuest = () => {
        return signInAnonymously(auth);
    };

    const logout = () => {
        return signOut(auth);
    };

    return { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, logout };
};
