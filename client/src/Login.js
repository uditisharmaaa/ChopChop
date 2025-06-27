import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else onLogin();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else alert('Check your email to confirm sign-up!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 max-w-md w-full bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-2">🥗 Welcome to ChopChop</h2>
        <p className="text-center text-gray-600 mb-6">Log in or sign up to start managing your fridge!</p>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full bg-emerald-800 text-white p-2 rounded-lg font-semibold hover:bg-emerald-900 transition"
          >
            Log In
          </button>

          <button
            onClick={handleSignup}
            className="w-full border border-emerald-800 text-emerald-800 p-2 rounded-lg font-semibold hover:bg-emerald-50 transition"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
