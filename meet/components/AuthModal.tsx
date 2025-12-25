import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { X, Smartphone, Loader, AlertTriangle, Mail, User as UserIcon, CheckCircle, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AuthStep = 'landing' | 'google-chooser' | 'phone-otp' | 'email-form';
type AuthTab = 'login' | 'signup';

const AuthModal: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isAuthModalOpen, closeAuthModal, 
    loginWithGoogle, fetchGoogleAccountsMock, loginWithGoogleAccountMock,
    loginWithEmail, signupWithEmail,
    sendPhoneOtp, verifyPhoneOtp 
  } = useAuth();
  
  const navigate = useNavigate();

  // Component State
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [step, setStep] = useState<AuthStep>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data State
  const [mockGoogleAccounts, setMockGoogleAccounts] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (isAuthModalOpen) {
      resetState();
    }
  }, [isAuthModalOpen]);

  const resetState = () => {
    setStep('landing');
    setActiveTab('login');
    setLoading(false);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setOtp('');
    setGeneratedOtp(null);
  };

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    if (step !== 'landing') {
        setStep('landing');
    }
  };

  // --- GOOGLE FLOW ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Attempt Real Google Popup First
      const success = await loginWithGoogle();
      if (success) {
        handleSuccess();
      } else {
        // Fallback: If no real client ID, show Mock Account Chooser
        const accounts = await fetchGoogleAccountsMock();
        setMockGoogleAccounts(accounts);
        setStep('google-chooser');
      }
    } catch (e: any) {
      setError(e.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  const selectMockGoogleAccount = async (accountId: string) => {
    setLoading(true);
    try {
      await loginWithGoogleAccountMock(accountId);
      handleSuccess();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  // --- PHONE FLOW ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit Indian number");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = await sendPhoneOtp(phone);
      setGeneratedOtp(code);
      setStep('phone-otp');
      alert(`[Demo SMS] Your OTP for Civic Lens is ${code}`); 
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, otp, generatedOtp || '');
      handleSuccess();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  // --- EMAIL FLOW ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'signup') {
        await signupWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      handleSuccess();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/create');
  };

  // --- RENDER HELPERS ---
  const BackButton = () => (
    <button 
      onClick={() => { setError(''); setStep('landing'); }}
      className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 mb-4"
    >
      ← {t('btn.back')}
    </button>
  );

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] transition-all">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white font-serif">
             {t('auth.title')}
          </h2>
          <button 
            onClick={closeAuthModal} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS (Only on landing or email form) */}
        {(step === 'landing' || step === 'email-form') && (
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'login' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/30 dark:bg-primary-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {t('btn.login')}
            </button>
            <button 
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'signup' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/30 dark:bg-primary-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {t('btn.signup')}
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-5 p-3 text-xs font-semibold rounded-lg border bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW: LANDING */}
          {step === 'landing' && (
            <div className="space-y-4 animate-fade-in">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold text-gray-700 dark:text-gray-200 shadow-sm relative overflow-hidden group"
              >
                {/* Google Logo SVG */}
                <svg className="w-5 h-5 z-10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="z-10 relative">{loading ? 'Connecting...' : t('auth.google')}</span>
                {/* Loading overlay */}
                {loading && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-20"><Loader className="w-5 h-5 animate-spin text-primary-600" /></div>}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Or</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              <button 
                onClick={() => setStep('email-form')}
                className="w-full flex items-center justify-center gap-3 p-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold shadow-md"
              >
                <Mail className="w-5 h-5" />
                {t('auth.email')}
              </button>

              <button 
                onClick={() => setStep('phone-otp')}
                className="w-full flex items-center justify-center gap-3 p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold text-gray-700 dark:text-gray-200"
              >
                <Smartphone className="w-5 h-5" />
                {t('auth.mobile')}
              </button>
            </div>
          )}

          {/* VIEW: MOCK GOOGLE CHOOSER (FALLBACK) */}
          {step === 'google-chooser' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="text-center mb-6">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white">Choose an account</h3>
              </div>
              <div className="space-y-3">
                {mockGoogleAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => selectMockGoogleAccount(acc.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <img src={acc.avatar} alt={acc.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{acc.name}</p>
                      <p className="text-sm text-gray-500">{acc.email}</p>
                    </div>
                  </button>
                ))}
                
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Use another account</p>
                </button>
              </div>
              {loading && (
                <div className="mt-4 flex justify-center text-primary-600 gap-2 items-center text-sm font-medium">
                  <Loader className="w-4 h-4 animate-spin" /> Signing in...
                </div>
              )}
            </div>
          )}

          {/* VIEW: EMAIL FORM */}
          {step === 'email-form' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white p-3.5 rounded-xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : (activeTab === 'login' ? t('btn.login') : t('btn.signup'))}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep('landing')}
                className="w-full text-center text-sm text-gray-500 mt-2 hover:underline"
              >
                Use other methods
              </button>
            </form>
          )}

          {/* VIEW: PHONE OTP FLOW */}
          {step === 'phone-otp' && !generatedOtp && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-fade-in">
              <BackButton />
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-2 text-primary-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Mobile Verification</h3>
                <p className="text-sm text-gray-500">We'll send a code to your phone</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 font-bold rounded-l-lg text-base">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-r-lg p-3 focus:ring-2 focus:ring-primary-500 outline-none text-lg tracking-wide"
                    placeholder="98765 43210"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white p-3.5 rounded-xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'phone-otp' && generatedOtp && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
              <button 
                type="button" 
                onClick={() => setGeneratedOtp(null)} 
                className="text-sm text-gray-500 flex items-center gap-1"
              >
                ← Change Number
              </button>

              <div className="text-center">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white">Enter OTP</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                   Sent to <span className="font-bold text-gray-800 dark:text-white">+91 {phone}</span>
                 </p>
                 <div className="mt-2 inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" /> SMS Sent
                 </div>
               </div>

              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl p-4 text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-primary-500 outline-none text-gray-800 dark:text-white"
                placeholder="------"
                maxLength={6}
                autoFocus
                required
              />

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white p-3.5 rounded-xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>

              <p className="text-xs text-center text-gray-400">
                Didn't receive code? <button type="button" onClick={() => handleSendOtp({ preventDefault: () => {} } as any)} className="text-primary-600 font-bold hover:underline">Resend</button>
              </p>
            </form>
          )}

        </div>
        
        {/* Footer (Terms) */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center border-t border-gray-100 dark:border-gray-700">
           <div className="flex justify-center items-center gap-2 text-gray-400 text-xs mb-1">
             <Shield className="w-3 h-3" />
             <span>Secure Authentication</span>
           </div>
           <p className="text-xs text-gray-400">
             By continuing, you agree to our Terms of Service & Privacy Policy.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;