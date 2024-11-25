import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

const LoginForm = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </Button>
      <p className="text-sm text-center">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggle}
          className="text-blue-500 hover:underline"
        >
          Sign Up
        </button>
      </p>
    </form>
  );
};

export default LoginForm;