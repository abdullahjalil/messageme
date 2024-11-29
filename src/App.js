import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ForumPage from './components/ForumPage';
import { auth } from './firebase';
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {});

    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailFromStorage = window.localStorage.getItem('emailForSignIn');
      if (!emailFromStorage) {
        emailFromStorage = window.prompt('Please provide your email for confirmation');
      }
      signInWithEmailLink(auth, emailFromStorage, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
        });
    }

    return unsubscribe;
  }, []);

  const ProtectedRoute = ({ children }) => {
    return auth.currentUser ? children : <Navigate to="/" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/forum"
          element={
            <ProtectedRoute>
              <ForumPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;