import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAQEVox8-3pJgXeGXeinEq16ArlxYfM4Qw",
    authDomain: "message-me-d3294.firebaseapp.com",
    projectId: "message-me-d3294",
    storageBucket: "message-me-d3294.firebasestorage.app",
    messagingSenderId: "375457975652",
    appId: "1:375457975652:web:e80481abf8fa7ac55efe71"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);