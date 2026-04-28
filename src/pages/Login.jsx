import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        
        toast.success('Password reset link sent to your email!');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Supabase sometimes requires email verification depending on your project settings
        if (data.user && !data.session) {
          toast.success('Please check your email for a confirmation link!');
        } else {
          toast.success('Account created successfully!');
          navigate('/');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-6 sm:p-10 rounded-lg shadow-xl border-t-8 border-brand-yellow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-dark uppercase">
            Dev Property
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isForgotPassword ? 'Reset your password' : (isSignUp ? 'Create a new account' : 'Sign in to access the DPR Portal')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            <input type="email" required className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-brand-yellow focus:border-brand-yellow focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            
            {!isForgotPassword && (
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength={6} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-brand-yellow focus:border-brand-yellow focus:z-10 sm:text-sm pr-10" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-brand-dark bg-brand-yellow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow disabled:opacity-50">
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In'))}
          </button>
        </form>
        
        <div className="flex flex-col items-center gap-3 mt-4">
          {!isForgotPassword && !isSignUp && (
            <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm font-medium text-gray-500 hover:text-yellow-600 focus:outline-none">
              Forgot your password?
            </button>
          )}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); }} className="text-lg font-bold text-brand-dark hover:text-yellow-600 focus:outline-none transition-colors">
            {isForgotPassword ? 'Back to sign in' : (isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up")}
          </button>
        </div>
      </div>
    </div>
  );
}