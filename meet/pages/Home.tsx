import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Droplets, Lightbulb, Truck, Users, Map, FileCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreateClick = () => {
    if (user) {
      navigate('/create');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="space-y-20 lg:space-y-32">
      {/* Hero Section */}
      <div className="relative text-center space-y-8 py-12 md:py-24 animate-fade-in">
        {/* Subtle Background Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-primary-100/40 to-transparent dark:from-primary-900/10 pointer-events-none -z-10 blur-3xl rounded-full"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300 text-sm font-semibold mb-4 animate-fade-in-up">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            AI-Powered Civic Action
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white font-sans tracking-tight leading-tight max-w-4xl mx-auto">
          {t('app.tagline')}
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
          {t('app.desc')}
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={handleCreateClick}
            className="group flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white transition-all duration-300 bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-1 w-full sm:w-auto"
          >
            {t('btn.create')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 text-lg font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 w-full sm:w-auto"
          >
            {t('nav.howItWorks')}
          </button>
        </div>
      </div>

      {/* Stats Section - Clean & Modern */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl -rotate-1 shadow-2xl opacity-80 transform scale-[0.98] translate-y-2"></div>
        <div className="relative bg-gray-900 dark:bg-gray-950 rounded-3xl p-10 md:p-16 text-white shadow-2xl border border-gray-800 overflow-hidden">
           {/* Decorative circles */}
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-gray-800/50">
            <div className="p-4 space-y-2 group">
              <div className="flex justify-center mb-4 text-primary-400 group-hover:scale-110 transition-transform duration-300"><FileCheck className="w-10 h-10"/></div>
              <div className="text-5xl font-extrabold mb-2 tracking-tight">1,248+</div>
              <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('stats.complaints')}</div>
            </div>
            <div className="p-4 space-y-2 group">
              <div className="flex justify-center mb-4 text-primary-400 group-hover:scale-110 transition-transform duration-300"><Map className="w-10 h-10"/></div>
              <div className="text-5xl font-extrabold mb-2 tracking-tight">120+</div>
              <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('stats.cities')}</div>
            </div>
            <div className="p-4 space-y-2 group">
              <div className="flex justify-center mb-4 text-primary-400 group-hover:scale-110 transition-transform duration-300"><Users className="w-10 h-10"/></div>
              <div className="text-5xl font-extrabold mb-2 tracking-tight">85%</div>
              <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('stats.success')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid - Professional Cards */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Covering All Civic Issues</h2>
           <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">We help you draft professional complaints for a wide range of public service problems.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<AlertTriangle className="w-6 h-6" />} 
            title={t('feat.road')} 
            desc="Potholes, broken pavement, illegal speed breakers."
            color="text-amber-500"
            bg="bg-amber-50 dark:bg-amber-900/10"
          />
          <FeatureCard 
            icon={<Droplets className="w-6 h-6" />} 
            title={t('feat.water')} 
            desc="Leakage, contaminated water, irregular supply."
            color="text-blue-500"
            bg="bg-blue-50 dark:bg-blue-900/10"
          />
          <FeatureCard 
            icon={<Lightbulb className="w-6 h-6" />} 
            title={t('feat.light')} 
            desc="Street lights not working, broken poles, dark spots."
            color="text-yellow-500"
            bg="bg-yellow-50 dark:bg-yellow-900/10"
          />
          <FeatureCard 
            icon={<Truck className="w-6 h-6" />} 
            title={t('feat.garbage')} 
            desc="Overflowing bins, irregular pickup, dumping."
            color="text-emerald-500"
            bg="bg-emerald-50 dark:bg-emerald-900/10"
          />
        </div>
      </div>

      {/* How it works - Step Process */}
      <div id="how-it-works" className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800 p-8 md:p-16 text-center space-y-12">
        <div className="space-y-4">
           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{t('nav.howItWorks')}</h2>
           <p className="text-gray-500 dark:text-gray-400">Generate a formal letter in 3 simple steps.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-100 dark:bg-gray-800 -z-10"></div>
          
          <Step number="1" title={t('step.problem')} desc="Select the issue type from our comprehensive list." />
          <Step number="2" title={t('step.details')} desc="Add location & photo to provide solid evidence." />
          <Step number="3" title={t('step.letter')} desc="Receive a professionally drafted PDF ready to submit." />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string; bg: string }> = ({ icon, title, desc, color, bg }) => (
  <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className={`w-14 h-14 ${bg} ${color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const Step: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
  <div className="relative flex flex-col items-center">
    <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-primary-50 dark:border-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm z-10">
      <div className="w-16 h-16 bg-primary-600 text-white font-bold rounded-full flex items-center justify-center text-2xl shadow-lg shadow-primary-500/30">
        {number}
      </div>
    </div>
    <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white tracking-tight">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{desc}</p>
  </div>
);

export default Home;