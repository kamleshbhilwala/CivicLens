import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X, MessageSquare, Loader } from 'lucide-react';
import { getChatBotResponse } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null); // Ref for "Click Outside" detection

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Wait for animation
    }
  }, [isOpen]);

  // Handle ESC key and Click Outside
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Close if clicking outside the chatbot container
      if (
        isOpen && 
        chatbotRef.current && 
        !chatbotRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Initial Greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingText = user 
        ? `Hello ${user.name.split(' ')[0]}! How can I help you with Civic Lens today?` 
        : "Hello! Welcome to Civic Lens. How can I assist you with your complaint?";
      
      // Simple timeout to simulate "typing" for the first message
      setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'ai',
          text: greetingText,
          timestamp: new Date()
        }]);
      }, 500);
    }
  }, [isOpen, user]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getChatBotResponse(
        userMsg.text, 
        i18n.language, 
        { isLoggedIn: !!user, name: user?.name }
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: "I apologize, but I'm having trouble connecting right now. Please try again or email support@civiclens.ai.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={chatbotRef}
      className={`fixed bottom-0 right-0 z-50 w-full md:w-96 h-[85vh] md:h-[600px] md:bottom-24 md:right-6 flex flex-col bg-white dark:bg-gray-900 shadow-2xl md:rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out transform origin-bottom-right ${
        isOpen 
          ? 'translate-y-0 opacity-100 pointer-events-auto scale-100' 
          : 'translate-y-12 opacity-0 pointer-events-none scale-95'
      }`}
      role="dialog"
      aria-modal="false"
      aria-label="Civic Lens Support Chat"
    >
      
      {/* Header */}
      <div className="bg-primary-600 p-4 flex items-center justify-between text-white shadow-md select-none relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Civic Lens Support</h3>
            <span className="text-xs text-primary-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </span>
          </div>
        </div>
        
        {/* Close Button - Highly Visible */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }} 
          className="p-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white border border-white/10 shadow-sm group" 
          title="Close Chat"
          aria-label="Close Chat"
        >
           <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950/50 scroll-smooth">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`
              max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
              }
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
           <input
             ref={inputRef}
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Type a message..."
             className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-none rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
           />
           <button 
             type="submit" 
             disabled={!input.trim() || isLoading}
             className="absolute right-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors shadow-sm"
           >
             <Send className="w-4 h-4" />
           </button>
        </form>
        <div className="mt-2 text-center">
           <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 select-none">
             Powered by AI <span className="hidden sm:inline">• Can make mistakes.</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
