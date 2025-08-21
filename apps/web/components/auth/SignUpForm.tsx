'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto pixel-card p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#f2751a]">🎉 Welcome, Adventurer!</h2>
          <p className="text-[#fbbf24] mb-4">
            Check your email to confirm your account and begin your journey!
          </p>
          <div className="bg-[#22c55e] text-white p-3 border-2 border-[#654321]">
            Account created successfully!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pixel-card p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#f2751a]">Join the Adventure</h2>
      
      {error && (
        <div className="bg-[#ef4444] text-white p-3 mb-4 border-2 border-[#654321]">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-[#fbbf24]">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full pixel-input"
            placeholder="Enter your adventurer name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#fbbf24]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pixel-input"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#fbbf24]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pixel-input"
            placeholder="Enter your password (min 6 characters)"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full pixel-button disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Start Adventure'}
        </button>
      </form>
    </div>
  );
}
