import { useState } from 'react';
import MessageForum from './components/MessageForum';
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Button } from './components/ui/button';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="fixed inset-0 bg-msme-sage/50 flex items-center justify-center p-4 z-50">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center text-msme-sage">
          {isLogin ? 'Log In' : 'Sign Up'}
        </h2>
        {isLogin ? (
          <LoginForm onToggle={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggle={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

const AuthHeader = () => {
  const { currentUser, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {currentUser ? (
        <>
          <span className="text-sm text-msme-sage">u/{currentUser.displayName}</span>
          <Button 
            onClick={() => logout()}
            className="bg-msme-olive hover:bg-msme-olive/90 text-white"
          >
            Log Out
          </Button>
        </>
      ) : (
        <Button 
          onClick={() => setShowAuth(true)}
          className="bg-msme-gold hover:bg-msme-gold/90 text-white"
        >
          Log In
        </Button>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-msme-cream pt-4 px-4">
        <Toaster position="top-center" />
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between bg-white p-2 rounded-md mb-4 shadow-md relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-msme-sage flex items-center justify-center text-white font-bold">
                M
              </div>
              <h1 className="text-xl font-medium text-msme-sage">MSME</h1>
            </div>
            <AuthHeader />
          </header>
          <MessageForum />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;