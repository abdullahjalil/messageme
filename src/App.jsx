import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import MessageForum from './components/MessageForum';
import UserProfile from './components/profile/UserProfile';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Button } from './components/ui/button';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import { Search } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);

    if (searchQuery.trim().length > 0) {
      setLoading(true);
      setShowResults(true);
      
      // Here you would typically call your search function
      // For now, we'll just simulate a search delay
      setTimeout(() => {
        // Mock results - replace with actual Firebase query
        const mockResults = [
          { id: 1, name: 'Technology', memberCount: 1200 },
          { id: 2, name: 'Programming', memberCount: 850 },
          { id: 3, name: 'Design', memberCount: 650 },
        ].filter(topic => 
          topic.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setResults(mockResults);
        setLoading(false);
      }, 300);
    } else {
      setShowResults(false);
      setResults([]);
    }
  };

  const handleClickOutside = () => {
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative flex-1 max-w-2xl mx-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-msme-sage/50" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onBlur={handleClickOutside}
          placeholder="Search topics"
          className="w-full pl-10 pr-4 py-2 bg-msme-cream/30 border border-msme-sage/10 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-msme-gold/50 focus:border-transparent
                    placeholder:text-msme-sage/50 text-msme-sage"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-msme-sage/10 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-msme-sage/70">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-msme-gold mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((topic) => (
                <button
                  key={topic.id}
                  className="w-full px-4 py-2 text-left hover:bg-msme-cream/30 flex items-center justify-between group"
                  onClick={() => {
                    navigate(`/topic/${topic.name.toLowerCase()}`);
                    setShowResults(false);
                  }}
                >
                  <span className="text-msme-sage group-hover:text-msme-gold transition-colors">
                    {topic.name}
                  </span>
                  <span className="text-xs text-msme-sage/50">
                    {topic.memberCount.toLocaleString()} members
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-msme-sage/70">
              No topics found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
          <Link 
            to={`/user/${currentUser.displayName}`}
            className="text-sm text-msme-sage hover:text-msme-gold transition-colors"
          >
            u/{currentUser.displayName}
          </Link>
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
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-msme-cream pt-4 px-4">
          <Toaster position="top-center" />
          <div className="max-w-7xl mx-auto">
            <header className="flex items-center justify-between bg-white p-2 rounded-md mb-4 shadow-md">
              <div className="flex items-center flex-1">
                <Link to="/" className="flex items-center gap-2 min-w-max">
                  <div className="w-8 h-8 rounded-full bg-msme-sage flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <h1 className="text-xl font-medium text-msme-sage">MSME</h1>
                </Link>
                <SearchBar />
              </div>
              <AuthHeader />
            </header>
            
            <Routes>
              <Route path="/" element={<MessageForum />} />
              <Route path="/user/:username" element={<UserProfile />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;