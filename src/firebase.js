import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // your config
  apiKey: "AIzaSyDzCSjzr3gEo9IM1LF8BwAGeJ67Ghky_DY",
  authDomain: "message-me-edf75.firebaseapp.com",
  projectId: "message-me-edf75",
  storageBucket: "message-me-edf75.firebasestorage.app",
  messagingSenderId: "200999120986",
  appId: "1:200999120986:web:ffa0173f0c5ea35c842863"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);
const db = getFirestore(app);
const storage = getStorage(app);

// Set up activity tracking
let inactivityTimeout;
const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const resetInactivityTimer = () => {
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
  }
  inactivityTimeout = setTimeout(() => {
    if (auth.currentUser) {
      signOut(auth);
    }
  }, TIMEOUT_DURATION);
};

// Track user activity
if (typeof window !== 'undefined') {
  // Reset timer on user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(
    event => {
      document.addEventListener(event, resetInactivityTimer, true);
    }
  );

  // Set up auth state listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      resetInactivityTimer();
    } else if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
  });
}

export { auth, db, storage };
