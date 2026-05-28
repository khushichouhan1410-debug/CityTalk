import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, User as UserIcon, UserCheck, Eye, EyeOff, Loader2, Navigation, AlertCircle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onAuthComplete: (userSession: any) => void;
  onContinueAsGuest?: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200',
];

export default function Auth({ onAuthComplete, onContinueAsGuest }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Simple client side validation
    if (!email || !password) {
      setErrorMessage('Please fill in all mandatory fields.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!fullName || !username) {
        setErrorMessage('Please provide your Full Name and a unique Username.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }

      const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '_');

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: formattedUsername,
              avatar_url: avatar,
            },
          },
        });

        if (error) throw error;

        // If signup was successful
        if (data.user) {
          const hasSession = data.session;
          if (hasSession) {
            // direct signup sign-in if email confirmation is disabled
            setSuccessMessage('Registration successful! Logging you in...');
            setTimeout(() => {
              onAuthComplete(hasSession);
            }, 1000);
          } else {
            // Confirmation email sent
            setSuccessMessage(
              'Account created successfully! We sent a confirmation link to your email. Please check your inbox (and spam folder) to verify your account, and then log in.'
            );
            setIsSignUp(false); // Switch to sign-in screen
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || String(err));
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In mode
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage('Welcome back! Loading your profile...');
          setTimeout(() => {
            onAuthComplete(data.session);
          }, 800);
        } else {
          setErrorMessage('Failed to retrieve active session. Check your credentials.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectAvatar = (url: string) => {
    setAvatar(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 bg-indigo-550/5 rounded-3xl blur-3xl -z-10" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 mb-4 animate-bounce-slow">
            <Navigation className="w-8 h-8 text-indigo-400 fill-indigo-400 rotate-45" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            CityTalk <span className="text-xs bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Authentication</span>
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-semibold">
            Join your verified neighborhood circle, promote events, and coordinate civic activities!
          </p>
        </div>

        {/* main Form Card */}
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xl space-y-5">
          {/* Sign In vs register slider tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-100">
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Success Alerts */}
          {successMessage && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 border border-emerald-250 text-emerald-850 p-3 rounded-2xl text-[11px] font-bold leading-normal flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Error Alerts */}
          {errorMessage && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-50 border border-rose-250 text-rose-850 p-3 rounded-2xl text-[11px] font-bold leading-normal flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Full name & Username */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-550 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                      Username
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="john_doe"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-550 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar Selection Picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 block">
                    Choose Local Neighborhood Avatar
                  </label>
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                    {AVATAR_OPTIONS.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectAvatar(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-all border-2 ${
                          avatar === url ? 'border-indigo-650 scale-110 shadow-md p-0.5' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img src={url} alt={`Avatar option ${index + 1}`} className="w-full h-full object-cover rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-550 focus:bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 flex justify-between items-center">
                <span>Password</span>
                {isSignUp && <span className="text-[9px] text-slate-400 font-bold lowercase">min 6 chars</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-550 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 p-1 cursor-pointer rounded"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Call to action action buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-indigo-650 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow-indigo-100 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {isSignUp ? 'Creating your account...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Complete Registration' : 'Log In Securely'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Browsing Fallback option */}
          {onContinueAsGuest && (
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-150" />
              </div>
              <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Or
              </span>
            </div>
          )}

          {onContinueAsGuest && (
            <button
              onClick={onContinueAsGuest}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-2xs active:scale-95"
            >
              Continue Browsing as a Guest
            </button>
          )}
        </div>

        {/* Security / Dev Hint Info */}
        <div className="mt-4 flex items-center justify-center gap-1 bg-slate-100/60 p-2.5 rounded-2xl border border-slate-150 text-[10px] text-slate-500 font-medium text-center">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span>SSL Encryption active. Accounts are securely persisted in Supabase.</span>
        </div>
      </div>
    </div>
  );
}
