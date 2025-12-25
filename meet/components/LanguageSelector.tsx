import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

interface LanguageSelectorProps {
  isMobile?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isMobile = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
           <Globe className="w-4 h-4 text-primary-600" /> Language
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
             <button
               key={lang.code}
               onClick={() => handleLanguageChange(lang.code)}
               className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                 i18n.language === lang.code
                   ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                   : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700'
               }`}
             >
               {lang.native}
             </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 group border ${
            isOpen 
            ? 'bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-800 shadow-md ring-2 ring-primary-100 dark:ring-primary-900' 
            : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className={`p-1 rounded-full transition-colors duration-300 ${
            isOpen 
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 group-hover:text-primary-600'
        }`}>
            <Globe className="w-4 h-4" />
        </div>
        <div className="text-left hidden lg:block">
            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5 group-hover:text-primary-500 transition-colors">Lang</span>
            <span className="block text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{currentLang.native}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden py-2 animate-fade-in-down z-50 origin-top-right ring-1 ring-black/5">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Language</p>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-all duration-200 border-l-4 group ${
                    i18n.language === lang.code 
                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500' 
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col">
                   <span className={`font-bold transition-colors ${i18n.language === lang.code ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                     {lang.native}
                   </span>
                   <span className="text-xs text-gray-400 font-medium group-hover:text-gray-500">{lang.name}</span>
                </div>
                {i18n.language === lang.code && (
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-1 rounded-full text-primary-600 dark:text-primary-400 animate-fade-in">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;