import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  sendEmailVerification
} from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
  
    const sendVerificationEmail = async (userEmail) => {
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };
      
      try {
        setIsLoading(true);
        await sendSignInLinkToEmail(auth, userEmail, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', userEmail);
        setVerificationSent(true);
        setError('');
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleSignUp = async (e) => {
      e.preventDefault();
      try {
        setIsLoading(true);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          email: email,
          timestamp: new Date()
        });
        await sendVerificationEmail(email);
        navigate('/forum');
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    };
  
    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        setIsLoading(true);
        await signInWithEmailAndPassword(auth, email, password);
        await sendVerificationEmail(email);
        navigate('/forum');
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    };
  
    const handleGoogleSignIn = async () => {
      const provider = new GoogleAuthProvider();
      try {
        setIsLoading(true);
        const result = await signInWithPopup(auth, provider);
        await addDoc(collection(db, 'users'), {
          uid: result.user.uid,
          email: result.user.email,
          timestamp: new Date()
        });
        await sendVerificationEmail(result.user.email);
        navigate('/forum');
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    };
  
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }
  
    if (verificationSent) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md mx-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Check Your Email</h2>
            <p className="mb-4 text-sm sm:text-base">We sent a verification link to {email}. Please check your inbox and click the link to continue.</p>
            <button
              onClick={() => setVerificationSent(false)}
              className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 text-sm sm:text-base"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md mx-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Login/Sign Up</h2>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <form className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLogin}
                className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 transition-colors text-sm sm:text-base"
              >
                Sign Up
              </button>
            </div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full bg-white border border-gray-300 p-3 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    );
  }

export default Login;