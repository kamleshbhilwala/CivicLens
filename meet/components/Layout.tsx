import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Menu, X, LogOut, LayoutDashboard, Sun, Moon, MessageCircle, ChevronRight, ChevronDown } from 'lucide-react';
import Footer from './Footer';
import AuthModal from './AuthModal';
import LanguageSelector from './LanguageSelector';
import Chatbot from './Chatbot';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal, logout } = useAuth();

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleScrollToSection = (id: string) => {
    setIsMenuOpen(false);
    
    // For Contact button, open Chatbot instead of scrolling
    if (id === 'contact-section') {
       setIsChatOpen(true);
       return;
    }

    // For home-specific sections
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    setIsMenuOpen(false);
    if (user) {
      navigate('/create');
    } else {
      openAuthModal();
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  // Modern Pill-Shaped Nav Link
  const NavLink = ({ to, label, isActive, onClick }: { to?: string, label: string, isActive?: boolean, onClick?: () => void }) => {
    const baseClasses = "relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ease-out flex items-center gap-2 select-none";
    const activeClasses = isActive 
      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800" 
      : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800";
    
    if (to) {
      return (
        <Link to={to} className={`${baseClasses} ${activeClasses}`}>
          {label}
        </Link>
      );
    }
    return (
      <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <AuthModal />
      
      {/* Chatbot Instance - Controlled by Layout State */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Floating Chat Launcher */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 transform group ${
          isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 hover:scale-110 active:scale-95'
        }`}
        aria-label="Open Support Chat"
        title="Chat with AI Support"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950 animate-bounce"></span>
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* Fixed Modern Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled 
            ? 'bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-md py-3' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo with Hover Effect */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group outline-none" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-2.5 rounded-xl shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 group-hover:rotate-6 transition-all duration-300 ease-out">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-primary-400 transition-all duration-300">
              {t('app.name')}
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" label={t('nav.home')} isActive={location.pathname === '/'} />
            
            {user && (
              <NavLink to="/dashboard" label={t('nav.dashboard')} isActive={location.pathname === '/dashboard'} />
            )}

            <NavLink onClick={() => handleScrollToSection('how-it-works')} label={t('nav.howItWorks')} />
            <NavLink onClick={() => setIsChatOpen(true)} label={t('nav.contact')} />

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-3"></div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2.5 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 hover:rotate-12 active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Profile / Auth */}
            {user ? (
              <div className="relative ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`
                    flex items-center gap-3 pl-1 pr-2 py-1.5 rounded-full transition-all duration-300 group
                    ${isProfileMenuOpen 
                      ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary-500/50' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:ring-2 hover:ring-primary-100 dark:hover:ring-primary-900'
                    }
                  `}
                >
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="text-left hidden lg:block">
                     <p className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                       {user.name.split(' ')[0]}
                     </p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 py-2 animate-fade-in-down origin-top-right overflow-hidden z-50">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email || user.phone}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-colors group"
                      >
                        <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" /> {t('nav.dashboard')}
                      </Link>
                      <Link 
                        to="/create" 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-colors group"
                      >
                        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" /> {t('nav.newComplaint')}
                      </Link>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                      >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> {t('btn.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={handleGetStarted}
                className="ml-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ring-2 ring-transparent hover:ring-primary-200 dark:hover:ring-primary-900"
              >
                {t('btn.getStarted')}
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button 
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 animate-pulse" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-2xl absolute w-full left-0 animate-fade-in-down z-40 h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex flex-col p-6 space-y-4">
              
              {user && (
                 <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-2">
                    <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-full shadow-sm" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || user.phone}</p>
                    </div>
                 </div>
              )}

              {/* Mobile Language Selector */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                 <LanguageSelector isMobile />
              </div>

              <nav className="space-y-1">
                <Link 
                  to="/" 
                  onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`flex items-center px-4 py-3.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] group ${location.pathname === '/' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:translate-x-2'}`}
                >
                  <span className="flex-grow">{t('nav.home')}</span>
                  {location.pathname === '/' && <ChevronRight className="w-4 h-4" />}
                </Link>
                
                {user && (
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center px-4 py-3.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] group ${location.pathname === '/dashboard' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:translate-x-2'}`}
                  >
                     <span className="flex-grow">{t('nav.dashboard')}</span>
                     {location.pathname === '/dashboard' && <ChevronRight className="w-4 h-4" />}
                  </Link>
                )}

                <button 
                  onClick={() => handleScrollToSection('how-it-works')}
                  className="w-full text-left flex justify-between items-center px-4 py-3.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:translate-x-2 transition-all duration-200 active:scale-[0.98]"
                >
                  {t('nav.howItWorks')}
                </button>
                <button 
                  onClick={() => { setIsMenuOpen(false); setIsChatOpen(true); }}
                  className="w-full text-left flex justify-between items-center px-4 py-3.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:translate-x-2 transition-all duration-200 active:scale-[0.98]"
                >
                  {t('nav.contact')}
                  <MessageCircle className="w-4 h-4 text-primary-500" />
                </button>
              </nav>

              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                {user ? (
                   <button 
                    onClick={handleLogout}
                    className="w-full text-center border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-5 py-3.5 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-[0.98]"
                   >
                     {t('btn.logout')}
                   </button>
                ) : (
                  <button 
                    onClick={handleGetStarted}
                    className="block w-full text-center bg-primary-600 text-white px-5 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:bg-primary-700 transition-all active:scale-[0.98]"
                  >
                    {t('btn.getStarted')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Added padding-top to compensate for fixed header */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 pt-28">
        {children}
      </main>

      {/* Footer */}
      <Footer onOpenChat={() => setIsChatOpen(true)} />
    </div>
  );
};

export default Layout;