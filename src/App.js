import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import ForumPage from './components/ForumPage';

// function App() {
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, () => {});

//     if (isSignInWithEmailLink(auth, window.location.href)) {
//       let emailFromStorage = window.localStorage.getItem('emailForSignIn');
//       if (!emailFromStorage) {
//         emailFromStorage = window.prompt('Please provide your email for confirmation');
//       }
//       signInWithEmailLink(auth, emailFromStorage, window.location.href)
//         .then(() => {
//           window.localStorage.removeItem('emailForSignIn');
//         });
//     }

//     return unsubscribe;
//   }, []);

//   const ProtectedRoute = ({ children }) => {
//     return auth.currentUser ? children : <Navigate to="/" />;
//   };

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route
//           path="/forum"
//           element={
//             <ProtectedRoute>
//               <ForumPage />
//             </ProtectedRoute>
//           }
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBE9D0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E64833] border-t-transparent"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children }) => {
    if (!authUser) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={authUser ? <Navigate to="/forum" /> : <Login />} 
        />
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