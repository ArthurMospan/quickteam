import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, language })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed. Is the server running?');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F2] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[28px] shadow-sm w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-2xl shadow-sm mb-4" />
          <span className="font-bold text-2xl tracking-tight italic">QuickTeam</span>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50 focus:bg-white"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50 focus:bg-white"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50 focus:bg-white"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50 focus:bg-white"
            >
              <option value="en">English (US)</option>
              <option value="uk">Ukrainian (Українська)</option>
            </select>
          </div>
          <button 
            type="submit"
            className="w-full bg-black text-white py-3.5 rounded-full font-medium flex items-center justify-center gap-2 mt-2 hover:bg-gray-800 transition-colors"
          >
            Create Account <ArrowRight size={18} />
          </button>
        </form>
        
        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account? <Link to="/login" className="text-black font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
