import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
  RecaptchaVerifier,
} from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          // Enable the sign-up button when captcha is solved
          const signUpButton = document.getElementById('sign-up-button');
          if (signUpButton) {
            signUpButton.disabled = false;
          }
        },
        'expired-callback': () => {
          // Disable the sign-up button when captcha expires
          const signUpButton = document.getElementById('sign-up-button');
          if (signUpButton) {
            signUpButton.disabled = true;
          }
        }
      });
    }

    return () => {
      // Cleanup reCAPTCHA when component unmounts
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [isRegistering]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: displayName.trim()
      });

      await sendEmailVerification(userCredential.user, {
        url: window.location.origin + '/forum',
        handleCodeInApp: false
      });

      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName.trim(),
        timestamp: new Date()
      });

      setError('');
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
        displayName: result.user.displayName,
        timestamp: new Date()
      });
      navigate('/forum');
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBE9D0] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E64833] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBE9D0] flex flex-col items-center justify-center p-4">
      <div className="bg-[#90AEAD] p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#244855] mb-6 uppercase tracking-wider">
          PROMETHEUS
        </h1>
        <h2 className="text-xl font-bold text-[#244855] mb-6 uppercase">
          {isRegistering ? 'Sign Up' : 'Login'}
        </h2>

        {error && (
          <div className="bg-[#E64833] text-[#FBE9D0] p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[#244855] mb-2 text-sm uppercase">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 border-2 border-[#244855] rounded bg-[#FBE9D0] text-[#244855] placeholder-[#874F41]"
                  placeholder="Enter your display name"
                />
              </div>
              <div id="recaptcha-container" className="flex justify-center"></div>
            </>
          )}

          <div>
            <label className="block text-[#244855] mb-2 text-sm uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-[#244855] rounded bg-[#FBE9D0] text-[#244855] placeholder-[#874F41]"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-[#244855] mb-2 text-sm uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-[#244855] rounded bg-[#FBE9D0] text-[#244855] placeholder-[#874F41]"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isRegistering ? (
              <button
                id="sign-up-button"
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full bg-[#E64833] text-[#FBE9D0] p-3 rounded hover:bg-[#874F41] transition-colors text-sm uppercase font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-[#244855] text-[#FBE9D0] p-3 rounded hover:bg-[#874F41] transition-colors text-sm uppercase font-bold tracking-wider"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            )}
          </div>


          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-[#244855] text-sm hover:text-[#E64833]"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#244855]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#90AEAD] text-[#244855] uppercase">Or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full bg-[#FBE9D0] border-2 border-[#244855] p-3 rounded hover:bg-[#90AEAD] transition-colors flex items-center justify-center gap-2 text-sm uppercase font-bold tracking-wider text-[#244855]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#E64833" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#244855" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#874F41" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#E64833" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;