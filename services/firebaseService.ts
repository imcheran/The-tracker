
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import type { User, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyBliJyouiIZ0opeozDFvjUkcFBzVruOBzI",
  authDomain: "tracker-8fefe.firebaseapp.com",
  projectId: "tracker-8fefe",
  storageBucket: "tracker-8fefe.firebasestorage.app",
  messagingSenderId: "965709257556",
  appId: "1:965709257556:web:956f5086d934ad2ed946c1",
  measurementId: "G-131FE9F98E"
};

// --- Singleton Instances ---
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;

// --- Safe Initialization Logic ---
const initializeFirebase = () => {
  try {
    // 1. Initialize App (Modular & Idempotent)
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    // 2. Initialize Auth
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(e =>
      console.warn("Auth Persistence Warning:", e)
    );

    // 3. Initialize Firestore
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      console.warn("Firestore advanced persistence failed, falling back to default:", e);
      db = getFirestore(app);
    }

    // 4. Initialize Analytics (Client-side only)
    if (typeof window !== 'undefined') {
      getAnalytics(app);
    }

    // 5. Initialize Capacitor Google Auth (Native Only)
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '965709257556-i7958klip6ut3mb5fgaffh2p55q3attn.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
        grantOfflineAccess: false,
      });
    }

    return true;
  } catch (error) {
    console.error("CRITICAL: Firebase Initialization Error", error);
    return false;
  }
};

// Run initialization immediately on module load
initializeFirebase();

// --- Public API ---
export const loginWithGoogle = async (): Promise<{ user: any; accessToken: string }> => {
  if (!auth) throw new Error("Authentication service not available");

  try {
    if (Capacitor.isNativePlatform()) {
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      return {
        user: {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        },
        accessToken: googleUser.authentication.accessToken || ''
      };
    } else {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
      }

      return {
        user: {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        },
        accessToken: credential?.accessToken || ''
      };
    }
  } catch (error: any) {
    console.error("Google login error", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Login cancelled.");
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error("Domain not authorized in Firebase Console.");
    }
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  try {
    localStorage.removeItem('google_access_token');
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error", error);
  }
};

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
};

export const saveUserDataToFirestore = async (uid: string, data: any) => {
  if (!db) return;
  try {
    const sanitized = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, "users", uid), sanitized, { merge: true });
  } catch (e) {
    console.error("Error saving data to Firestore", e);
  }
};

export const loadUserDataFromFirestore = async (uid: string) => {
  if (!db) return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error("Error loading data from Firestore", e);
    return null;
  }
};

export const subscribeToDataChanges = (uid: string, callback: (data: any) => void) => {
  if (!db) return () => {};
  return onSnapshot(
    doc(db, "users", uid),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    },
    (error) => {
      console.error("Snapshot listener error:", error);
    }
  );
};
