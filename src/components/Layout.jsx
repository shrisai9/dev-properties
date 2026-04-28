import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, FileText, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-brand-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-brand-yellow font-bold text-xl flex items-center gap-2">
                <FileText /> Dev Property DPR
              </span>
              <div className="hidden md:flex space-x-4 ml-8">
                <Link to="/" className="hover:text-brand-yellow flex items-center gap-1"><LayoutDashboard size={18}/> Dashboard</Link>
                <Link to="/new" className="hover:text-brand-yellow flex items-center gap-1"><PlusCircle size={18}/> New Report</Link>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      
    </div>
  );
}