import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase config with fallback logs
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "missing_apiKey",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing_authDomain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing_projectId",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "missing_storageBucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "missing_messagingSenderId",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "missing_appId"
};

console.log("Firebase config loaded:", firebaseConfig);

let _app = null;
let _db = null;
let _auth = null;
let _googleProvider = null;

export function isFirebaseAvailable() {
  return (typeof window !== 'undefined') && !!firebaseConfig.apiKey;
}

function initFirebaseOnce() {
  if (!isFirebaseAvailable()) return null;
  if (_app) return _app;

  try {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (err) {
    _app = getApp();
  }

  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _googleProvider = new GoogleAuthProvider();

  return _app;
}

export function getFirebaseApp() {
  return initFirebaseOnce();
}

export function getFirestoreDb() {
  if (!_db) initFirebaseOnce();
  return _db;
}

export function getFirebaseAuth() {
  if (!_auth) initFirebaseOnce();
  return _auth;
}

export function getFirebaseProvider() {
  if (!_googleProvider) initFirebaseOnce();
  return _googleProvider;
}

// New helper function for Google sign-in
export async function signInWithGoogle() {
  try {
    const auth = getFirebaseAuth();
    const provider = getFirebaseProvider();
    const result = await import('firebase/auth').then(m => m.signInWithPopup(auth, provider));
    console.log("User signed in:", result.user);
    return result.user;
  } catch (err) {
    console.error("Google Sign-In error:", err);
    throw err;
  }
}

const firebaseClient = {
  isFirebaseAvailable,
  getFirebaseApp,
  getFirestoreDb,
  getFirebaseAuth,
  getFirebaseProvider,
  signInWithGoogle
};

export default firebaseClient;
