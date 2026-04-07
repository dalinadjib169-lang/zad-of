import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, Mail, Lock, User, LogIn, RefreshCw, AlertCircle } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (loading) return;
    
    // Check connectivity first
    if (!navigator.onLine) {
      setError('لا يوجد اتصال بالإنترنت. يرجى التأكد من اتصالك بالشبكة.');
      return;
    }

    // Check if user is already logged in
    if (auth.currentUser) {
      console.log("User already logged in, no need to authenticate again.");
      return;
    }

    const provider = new GoogleAuthProvider();
    // Force account selection screen
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    setError('');
    setLoading(true);
    
    try {
      // Ensure window has focus to help with popup blockers
      window.focus();
      
      console.log("Starting Google Login popup...");
      // Using a timeout to detect if the popup is hanging or blocked in a way that doesn't throw immediately
      const result = await signInWithPopup(auth, provider);
      
      console.log("Google Login successful for user:", result.user.email);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked! Please allow popups for this site in your browser settings to sign in with Google.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('خطأ في الاتصال: فشل طلب الشبكة. هذا غالباً بسبب مانع إعلانات (Ad-blocker) أو VPN أو جدار حماية يمنع خدمات جوجل. يرجى تعطيلها والمحاولة مرة أخرى، أو استخدام تسجيل الدخول بالبريد الإلكتروني كبديل.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`هذا النطاق (${currentDomain}) غير مصرح به. يرجى إضافته إلى Authorized Domains في Firebase Console.`);
      } else if (err.code === 'auth/cancelled-popup-request' || err.message?.includes('INTERNAL ASSERTION FAILED')) {
        setError('Authentication state error. Please refresh the page and try again.');
        // Force a reload after a short delay if this happens repeatedly
        setTimeout(() => window.location.reload(), 2000);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('The login window was closed before completion. Please try again.');
      } else if (err.code === 'auth/internal-error') {
        setError('An internal authentication error occurred. Please refresh the page and try again.');
      } else {
        setError(err.message || 'Failed to login with Google. Please try again.');
      }
    } finally {
      // Small delay before allowing another attempt to avoid race conditions
      setTimeout(() => setLoading(false), 1500);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      // Set persistence based on "Remember Me"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userPassword');
      await signOut(auth);
      setEmail('');
      setPassword('');
      setRememberMe(false);
      setError('Signed out. You can now log in with a different account.');
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden rounded-3xl p-4">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/user_uploads/input_file_0.png")' }}
      >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-slate-900/90 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] shadow-2xl border border-slate-800/50 flex flex-col gap-y-6"
        >
          {/* Religious Header Section */}
          <div className="text-center border-b border-slate-800/50 pb-6">
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black text-amber-400 drop-shadow-[0_2px_15px_rgba(251,191,36,0.5)] mb-3"
              style={{ fontFamily: "var(--font-amiri)", color: '#FFD700' }}
            >
              بسم الله الرحمن الرحيم
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl font-bold text-white/90 italic"
              style={{ fontFamily: "var(--font-amiri)" }}
            >
              اللهم صلي و سلم على سيدنا محمد
            </motion.p>
          </div>

          {/* App Branding Section */}
          <div className="flex flex-col items-center">
            <div className="bg-purple-600 p-4 rounded-[2rem] mb-4 shadow-xl shadow-purple-500/20 relative group">
              <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-white" />
              <div className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden border-2 border-slate-900 shadow-lg">
                <img src="https://flagcdn.com/w40/dz.png" className="w-full h-full object-cover" alt="Algeria" />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Teac DZ</h1>
              <img 
                src="https://flagcdn.com/w40/dz.png" 
                className="w-7 h-4 md:w-8 md:h-5 rounded-sm shadow-md border border-white/10" 
                alt="Algeria" 
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <p className="text-amber-400 font-black text-base md:text-lg" style={{ fontFamily: "var(--font-amiri)" }}>مرحبا بك في تطبيق Teac</p>
              <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">The Algerian Teachers Network</p>
            </div>
          </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="Email address"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-white placeholder:text-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-white placeholder:text-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-purple-600 border-purple-600' : 'border-slate-700 bg-slate-950 group-hover:border-slate-600'}`}>
                {rememberMe && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={rememberMe} 
                onChange={() => setRememberMe(!rememberMe)} 
              />
              <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Remember Me</span>
            </label>
            <button 
              type="button"
              onClick={handleSwitchAccount}
              className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Switch Account
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800"></div>
          <span className="text-slate-600 text-sm font-medium uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full py-3.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          )}
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <p className="mt-8 text-center text-slate-500 font-medium">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-purple-500 hover:text-purple-400 font-bold underline decoration-2 underline-offset-4"
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </p>

        {/* Login Help */}
        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 mb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Troubleshooting / حل المشاكل
            </h4>
            <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 text-left">
              <li>Allow popups in your browser / اسمح بالنوافذ المنبثقة</li>
              <li>Disable Ad-blockers or VPN / عطل مانع الإعلانات أو VPN</li>
              <li>Ensure your internet is stable / تأكد من استقرار الإنترنت</li>
              <li>Try a different browser / جرب متصفحاً آخر</li>
            </ul>
          </div>
          <p className="text-[10px] font-black text-slate-700 text-center uppercase tracking-[0.2em]">
            Developer Dali Nadjib
          </p>
        </div>
      </motion.div>
    </div>
  </div>
  );
}
