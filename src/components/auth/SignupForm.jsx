import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

const SignupForm = ({ onToggle }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password || !username) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password should be at least 6 characters');
            return;
        }

        if (username.length < 3) {
            toast.error('Username should be at least 3 characters');
            return;
        }

        try {
            setLoading(true);
            await signup(email, password, username);
        } catch (error) {
            console.error('Signup error:', error);
            // Error is handled in AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                    minLength={3}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-msme-gold focus:border-transparent"
                />
            </div>
            <div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-msme-gold focus:border-transparent"
                />
            </div>
            <div>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-msme-gold focus:border-transparent"
                />
            </div>
            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-msme-gold hover:bg-msme-gold/90 text-white"
            >
                {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center text-msme-sage">
                Already have an account?{' '}
                <button
                    type="button"
                    onClick={onToggle}
                    className="text-msme-gold hover:underline"
                >
                    Log In
                </button>
            </p>
        </form>
    );
};

export default SignupForm;