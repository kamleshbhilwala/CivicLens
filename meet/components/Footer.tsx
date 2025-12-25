import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Twitter, Facebook, Github, Heart, MessageCircle, Shield, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  onOpenChat?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenChat }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (id: string) => {
    if (id === 'home') {
        scrollToTop();
        if (location.pathname !== '/') navigate('/');
    } else if (id === 'how-it-works') {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
        }
    } else if (id === 'contact') {
        if (onOpenChat) {
          onOpenChat();
        } else {
          document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  // Prevent default for placeholder links to avoid jumping
  const handleDummyLink = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const linkClass = "hover:text-primary-400 hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1 font-medium group cursor-pointer";

  return (
    <footer className="bg-gray-950 text-white pt-20 pb-10 border-t border-gray-900" id="contact-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Section 1: About */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 font-sans">
              {t('app.name')}
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t('app.desc')}
            </p>
            <div className="flex space-x-3 pt-4">
                <a href="#" onClick={handleDummyLink} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-gray-800" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
                <a href="#" onClick={handleDummyLink} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:bg-[#4267B2] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-gray-800" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
                <a href="#" onClick={handleDummyLink} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:bg-[#333] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-gray-800" aria-label="Github"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest border-b border-gray-800 pb-2 inline-block">Platform</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <button onClick={() => handleNavClick('home')} className={linkClass}>
                   {t('nav.home')}
                </button>
              </li>
              <li>
                <Link to="/create" onClick={scrollToTop} className={linkClass}>
                   {t('nav.newComplaint')}
                </Link>
              </li>
              <li>
                 <button onClick={() => handleNavClick('how-it-works')} className={linkClass}>
                    {t('nav.howItWorks')}
                 </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('contact')} className={linkClass}>
                    {t('nav.contact')}
                </button>
              </li>
            </ul>
          </div>

          {/* Section 3: Legal */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest border-b border-gray-800 pb-2 inline-block">{t('footer.legal')}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="#" onClick={handleDummyLink} className={linkClass}>
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#" onClick={handleDummyLink} className={linkClass}>
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="#" onClick={handleDummyLink} className={linkClass}>
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" onClick={handleDummyLink} className={linkClass}>
                  <Shield className="w-3 h-3 mr-1" /> Security
                </a>
              </li>
            </ul>
          </div>

          {/* Section 4: Contact */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest border-b border-gray-800 pb-2 inline-block">Contact</h3>
            <div className="space-y-4 text-sm text-gray-400">
              <button 
                onClick={() => onOpenChat && onOpenChat()} 
                className="w-full text-left flex items-center gap-4 group hover:text-white transition-colors p-4 rounded-2xl bg-gray-900 border border-gray-800 hover:border-primary-500/50 hover:bg-gray-800/80 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-gray-800 p-2.5 rounded-xl group-hover:bg-primary-600 transition-colors duration-300 shadow-sm relative z-10">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="relative z-10">
                   <span className="font-bold block text-base group-hover:text-primary-400 transition-colors">Live Chat Support</span>
                   <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Available 24/7 AI
                   </span>
                </div>
                <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-gray-600 group-hover:text-primary-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </button>

              <a href="mailto:support@civiclens.ai" className="flex items-center gap-3 group hover:text-white transition-colors p-3 px-4 rounded-xl bg-transparent border border-gray-800 hover:border-gray-600">
                <Mail className="w-4 h-4 text-gray-500 group-hover:text-primary-400" />
                <span className="font-medium">support@civiclens.ai</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <p className="hover:text-gray-300 transition-colors">© 2025 Civic Lens. All rights reserved.</p>
          <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-full border border-gray-800 hover:border-gray-700 transition-all duration-300">
            <span className="font-medium text-gray-400 flex items-center gap-1">
               Built for Citizens <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
            <span className="text-lg leading-none grayscale hover:grayscale-0 transition-all duration-300 cursor-default" title="India">🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;