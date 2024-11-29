// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

    apiKey: "AIzaSyDzCSjzr3gEo9IM1LF8BwAGeJ67Ghky_DY",
  
    authDomain: "message-me-edf75.firebaseapp.com",
  
    projectId: "message-me-edf75",
  
    storageBucket: "message-me-edf75.firebasestorage.app",
  
    messagingSenderId: "200999120986",
  
    appId: "1:200999120986:web:ffa0173f0c5ea35c842863"
  
  };
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

