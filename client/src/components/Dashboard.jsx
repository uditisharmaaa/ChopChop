import React from 'react';
import Fridge from './Fridge';
import RecipeList from './RecipeList';
import { supabase } from '../supabaseClient';

export default function Dashboard({ onAddReceipt, onLogout }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white shadow sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-blue-800">🍳 ChopChop Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={onAddReceipt}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg shadow hover:bg-emerald-800 transition"
          >
            + Add Receipt
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Fridge */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">🥬 Your Fridge</h2>
            <Fridge />
          </div>
        </div>

        {/* Right: Recipes */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">🍴 Generate Recipes</h2>
            <RecipeList />
          </div>
        </div>
      </div>
    </div>
  );
}
