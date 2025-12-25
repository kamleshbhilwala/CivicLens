import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ComplaintType, ComplaintLanguage, 
  ComplaintTemplate, ComplaintStatus, LocationDetails, ComplaintData 
} from '../types';
import { generateFormalLetter, generateComplaintDescription } from '../services/geminiService';
import { saveComplaint, updateComplaintStatus } from '../services/storageService';
import { INDIAN_STATES_CITIES } from '../data/indian_states_cities';
import { 
  Upload, FileDown, 
  Edit2, CheckCircle, MapPin, Building2, Languages, FileText,
  AlertCircle, Clock, Mic, MicOff, Crosshair, Loader, Copy, Save, Calendar as CalendarIcon, RefreshCw, Sparkles,
  AlertTriangle, Droplets, Lightbulb, Truck, PenTool, Type, Eraser, Trash2
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------
// TYPES FOR WEB SPEECH API
// ----------------------------------------------------------------------
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ----------------------------------------------------------------------
// UTILS
// ----------------------------------------------------------------------

// Fix Leaflet Default Icon in Webpack/Vite/ESM environments
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

const getVoiceLocale = (langCode: string) => {
  const map: Record<string, string> = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'gu': 'gu-IN',
    'mr': 'mr-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'kn': 'kn-IN',
    'ml': 'ml-IN',
    'bn': 'bn-IN',
    'pa': 'pa-IN'
  };
  return map[langCode] || 'en-IN';
};

const LANGUAGE_OPTIONS = [
  { value: ComplaintLanguage.ENGLISH, label: 'English', native: 'English' },
  { value: ComplaintLanguage.HINDI, label: 'Hindi', native: 'हिंदी' },
  { value: ComplaintLanguage.GUJARATI, label: 'Gujarati', native: 'ગુજરાતી' },
  { value: ComplaintLanguage.MARATHI, label: 'Marathi', native: 'मराठी' },
  { value: ComplaintLanguage.PUNJABI, label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { value: ComplaintLanguage.TAMIL, label: 'Tamil', native: 'தமிழ்' },
  { value: ComplaintLanguage.TELUGU, label: 'Telugu', native: 'తెలుగు' },
  { value: ComplaintLanguage.KANNADA, label: 'Kannada', native: 'ಕನ್ನಡ' },
  { value: ComplaintLanguage.MALAYALAM, label: 'Malayalam', native: 'മലയാളം' },
  { value: ComplaintLanguage.BENGALI, label: 'Bengali', native: 'বাংলা' },
];

// Helper to convert DD-MM-YYYY or similar text to YYYY-MM-DD for input
const parseDateFromText = (text: string): string => {
  // Try to match DD-MM-YYYY or DD/MM/YYYY
  const match = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return '';
};

// Helper to format YYYY-MM-DD to DD-MM-YYYY for letter
const formatDateForLetter = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
};

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

// SIGNATURE PAD COMPONENT
const SignaturePad: React.FC<{
  onSave: (data: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Drawing Logic
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      }
    }
  }, [mode]);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawn(false);
    }
  };

  // Convert Type/Draw to Image
  const handleSave = () => {
    if (mode === 'draw') {
      if (canvasRef.current && hasDrawn) {
        onSave(canvasRef.current.toDataURL('image/png'));
      }
    } else {
      if (typedName.trim() && hiddenCanvasRef.current) {
        const canvas = hiddenCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Set cursive font
          ctx.font = "italic 48px 'Great Vibes', cursive"; 
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
          onSave(canvas.toDataURL('image/png'));
        }
      }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-fade-in-down">
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setMode('draw')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${mode === 'draw' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'}`}
        >
          <PenTool className="w-4 h-4" /> Draw
        </button>
        <button 
          onClick={() => setMode('type')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${mode === 'type' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'}`}
        >
          <Type className="w-4 h-4" /> Type
        </button>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden relative h-48 flex items-center justify-center">
        {mode === 'draw' ? (
          <>
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 select-none">
                Sign here
              </div>
            )}
            <button 
              onClick={clearCanvas} 
              className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-200 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Clear"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
             <input
               type="text"
               value={typedName}
               onChange={(e) => setTypedName(e.target.value)}
               placeholder="Type your name..."
               className="w-full text-center border-b-2 border-primary-200 focus:border-primary-500 outline-none text-3xl font-signature py-2 text-gray-800 bg-transparent placeholder-gray-300"
               autoFocus
             />
             <canvas ref={hiddenCanvasRef} width={500} height={200} className="hidden" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
        <button 
          onClick={handleSave} 
          disabled={mode === 'draw' ? !hasDrawn : !typedName.trim()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use Signature
        </button>
      </div>
    </div>
  );
};


// VOICE INPUT COMPONENT
const VoiceInput: React.FC<{ 
  onResult: (text: string) => void;
  langCode: string; // Passed from parent (e.g., 'en', 'hi')
  isCompact?: boolean;
}> = ({ onResult, langCode, isCompact = false }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Update locale dynamically when prop changes
      recognitionRef.current.lang = getVoiceLocale(langCode);

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onResult, langCode]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    // Always ensure current lang is set before starting
    recognitionRef.current.lang = getVoiceLocale(langCode);

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null;

  return (
    <div className="relative group/voice z-10">
      <button
        type="button"
        onClick={toggleListening}
        className={`
          relative flex items-center justify-center transition-all duration-300 outline-none overflow-hidden
          ${isCompact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-full'}
          ${isListening 
            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500/30 shadow-lg shadow-red-500/20' 
            : 'bg-white/50 dark:bg-gray-800/50 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
          }
        `}
        aria-label={isListening ? "Stop Recording" : "Start Voice Input"}
      >
         {isListening && (
            <span className="absolute inset-0 rounded-full bg-red-400/10 animate-ping"></span>
         )}

         {isListening ? (
             <div className="flex items-center gap-[2px] h-3">
                 <div className="w-0.5 bg-current animate-[bounce_1s_infinite] h-full"></div>
                 <div className="w-0.5 bg-current animate-[bounce_1.2s_infinite] h-2/3"></div>
                 <div className="w-0.5 bg-current animate-[bounce_0.8s_infinite] h-full"></div>
                 <div className="w-0.5 bg-current animate-[bounce_1.1s_infinite] h-1/2"></div>
             </div>
         ) : (
            <Mic className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} transition-transform group-hover/voice:scale-110`} />
         )}
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold rounded-md opacity-0 group-hover/voice:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg transform translate-y-1 group-hover/voice:translate-y-0 duration-200">
        {isListening ? 'Stop' : 'Voice Input'}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </div>
  );
};

// STEP 1: SELECT PROBLEM
const StepProblemSelection: React.FC<{ 
  onSelect: (type: ComplaintType) => void;
  selectedType: ComplaintType | null; 
}> = ({ onSelect, selectedType }) => {
  const { t } = useTranslation();

  // Helper to get config based on type
  const getProblemConfig = (type: ComplaintType) => {
    switch (type) {
      case ComplaintType.ROAD:
        return { 
          Icon: AlertTriangle, 
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-100 dark:bg-amber-900/30",
          desc: "Potholes, broken roads, speed breakers"
        };
      case ComplaintType.DRAINAGE:
        return { 
          Icon: Droplets, 
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          desc: "Clogged drains, overflow, sewing issues"
        };
      case ComplaintType.STREET_LIGHT:
        return { 
          Icon: Lightbulb, 
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          desc: "Lights not working, broken poles"
        };
      case ComplaintType.WATER:
        return { 
          Icon: Droplets, 
          color: "text-cyan-600 dark:text-cyan-400",
          bg: "bg-cyan-100 dark:bg-cyan-900/30",
          desc: "No supply, dirty water, leakage"
        };
      case ComplaintType.GARBAGE:
        return { 
          Icon: Truck, 
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          desc: "Garbage piles, no pickup, dustbins"
        };
      default:
        return { 
          Icon: AlertCircle, 
          color: "text-gray-600 dark:text-gray-400",
          bg: "bg-gray-100 dark:bg-gray-800",
          desc: "General civic grievances"
        };
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{t('title.problem')}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Select the category that best describes the issue you are facing to get the right format.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.values(ComplaintType).map((type) => {
          const isSelected = selectedType === type;
          const { Icon, color, bg, desc } = getProblemConfig(type);
          
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`
                group relative flex flex-col items-start p-5 text-left border-2 rounded-2xl transition-all duration-300 ease-out w-full outline-none
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg shadow-primary-500/10 scale-[1.02] z-10 ring-1 ring-primary-500' 
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1'
                }
              `}
            >
              {/* Header: Icon + Check */}
              <div className="w-full flex justify-between items-start mb-4">
                 <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isSelected 
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 scale-110 rotate-3' 
                      : `${bg} ${color} group-hover:scale-110 group-hover:rotate-3`
                    }
                 `}>
                    <Icon className="w-6 h-6" />
                 </div>
                 
                 {/* Selection Check Circle */}
                 <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isSelected
                       ? 'bg-primary-600 border-primary-600 text-white opacity-100 scale-100'
                       : 'border-gray-200 dark:border-gray-700 bg-transparent opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 group-hover:border-gray-300 text-gray-300'
                    }
                 `}>
                    <CheckCircle className="w-3.5 h-3.5" />
                 </div>
              </div>

              {/* Text Content */}
              <div>
                <span className={`
                  block text-base font-bold transition-colors duration-200 mb-1
                  ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-800 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-300'}
                `}>
                  {type}
                </span>
                <span className={`
                  text-xs font-medium leading-relaxed block
                  ${isSelected ? 'text-primary-600 dark:text-primary-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}
                `}>
                  {desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// STEP 2: DETAILS & CONFIG
const StepDetailsConfig: React.FC<{
  location: LocationDetails;
  setLocation: React.Dispatch<React.SetStateAction<LocationDetails>>;
  description: string;
  setDescription: (desc: string) => void;
  language: ComplaintLanguage;
  setLanguage: (lang: ComplaintLanguage) => void;
  template: ComplaintTemplate;
  setTemplate: (temp: ComplaintTemplate) => void;
  complaintType: ComplaintType;
  authority: string;
  setAuthority: (auth: string) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ 
  location, setLocation, 
  description, setDescription,
  language, setLanguage, 
  template, setTemplate, 
  complaintType, 
  authority, setAuthority,
  onNext, onBack 
}) => {
  
  const { t, i18n } = useTranslation();
  const [areaType, setAreaType] = useState<'urban'|'rural'>('urban');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  // Map State
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Map
  useEffect(() => {
    fixLeafletIcon();
    
    if (mapContainerRef.current && !mapRef.current) {
      // Default center (India center approx)
      const defaultCenter: [number, number] = [20.5937, 78.9629]; 
      const initialCoords = mapCoords || defaultCenter;
      const initialZoom = mapCoords ? 15 : 4;

      mapRef.current = L.map(mapContainerRef.current).setView(initialCoords, initialZoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapRef.current);

      if (mapCoords) {
        markerRef.current = L.marker(mapCoords).addTo(mapRef.current);
      }
    }
  }, []);

  // Sync Map with Coordinates
  useEffect(() => {
    if (mapRef.current && mapCoords) {
      mapRef.current.setView(mapCoords, 15);
      if (markerRef.current) {
        markerRef.current.setLatLng(mapCoords);
      } else {
        markerRef.current = L.marker(mapCoords).addTo(mapRef.current!);
      }
    }
  }, [mapCoords]);

  // Forward Geocoding (Text -> Coords)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only geocode if we have at least City and Area, or just City to start
      if (location.city && !isLocating) {
        const query = `${location.area ? location.area + ', ' : ''}${location.city}${location.state ? ', ' + location.state : ''}, India`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setMapCoords([lat, lon]);
          }
        } catch (e) {
          console.error("Geocoding failed", e);
        }
      }
    }, 1500); // 1.5s debounce to avoid spamming while typing

    return () => clearTimeout(timer);
  }, [location.city, location.area, location.state]);

  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        // Extract Details
        const state = addr.state || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
        
        // Update State
        setLocation(prev => ({
          ...prev,
          state: state || prev.state,
          city: city || prev.city,
          area: area || prev.area
        }));
        
        // Determine area type basic logic
        if (addr.village) setAreaType('rural');
        else setAreaType('urban');
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    }
  };

  // Handle Current Location (GPS)
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCoords([latitude, longitude]); // Immediate visual feedback
        await fetchAddressFromCoords(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert('Unable to retrieve your location. Please check permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // AI Description Generation
  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      // Use the selected language for generation context
      const text = await generateComplaintDescription(complaintType, location, language);
      if (text) {
        setDescription(text);
      }
    } catch (e) {
      console.error("Auto-fill failed", e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Logic for Authority Auto-Suggestion
  useEffect(() => {
    const deptMap: Record<string, string> = {
      [ComplaintType.ROAD]: 'Public Works Department (PWD)',
      [ComplaintType.DRAINAGE]: 'Drainage & Sewerage Department',
      [ComplaintType.STREET_LIGHT]: 'Electricity Department / Street Light Wing',
      [ComplaintType.WATER]: 'Water Supply Department',
      [ComplaintType.GARBAGE]: 'Department of Sanitation & Solid Waste Management',
      [ComplaintType.OTHER]: 'Public Grievance Cell'
    };
    
    const dept = deptMap[complaintType] || 'General Administration Department';
    
    // Construct the suggestion
    let suggestedAuth = "";
    const placeName = location.city.trim() || (areaType === 'urban' ? '[City Name]' : '[Village Name]');
    
    // Clean Place Name (Remove 'City' or 'Town' suffix for matching)
    const placeNameClean = placeName.replace(/\s+(City|Town|Village)$/i, '').trim();

    if (areaType === 'urban') {
        const municipalCorporations = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Ahmedabad", "Pune", "Surat", "Jaipur"];
        const isCorporation = municipalCorporations.some(c => placeNameClean.toLowerCase() === c.toLowerCase());

        if (isCorporation) {
             suggestedAuth = `The Municipal Commissioner,\n${placeName} Municipal Corporation,\n${dept}`;
        } else {
             suggestedAuth = `The Chief Officer / Chairman,\n${placeName} Municipal Council (Nagar Palika),\n${dept}`;
        }
    } else {
      suggestedAuth = `The Sarpanch / Gram Sevak,\nGram Panchayat ${placeName},\n${dept}`;
    }

    setAuthority(suggestedAuth);
  }, [location.city, complaintType, areaType, setAuthority]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setLocation(prev => ({ ...prev, state: newState, city: '' }));
    setCitySuggestions([]);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(prev => ({ ...prev, city: value }));

    if (location.state && INDIAN_STATES_CITIES[location.state]) {
      const cities = INDIAN_STATES_CITIES[location.state];
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setCitySuggestions(filtered);
      setShowCitySuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setLocation(prev => ({ ...prev, city }));
    setShowCitySuggestions(false);
  };

  const getTemplateConfig = (tKey: ComplaintTemplate) => {
    switch(tKey) {
      case ComplaintTemplate.URGENT: 
        return { 
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />, 
          desc: "For hazardous issues needing immediate fix.",
          activeClass: "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-200 ring-1 ring-red-500"
        };
      case ComplaintTemplate.REMINDER: 
        return { 
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />, 
          desc: "If you have already complained but saw no action.",
          activeClass: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-200 ring-1 ring-amber-500"
        };
      default: 
        return { 
          icon: <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />, 
          desc: "Standard format for reporting a new issue.",
          activeClass: "border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-200 ring-1 ring-primary-500"
        };
    }
  };

  // Require description to be at least a few chars
  const isFormValid = location.area && location.city && location.state && description.length > 5;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center pb-2">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{t('title.details')}</h2>
         <p className="text-gray-500 dark:text-gray-400">Fill in the necessary information for the authorities.</p>
      </div>

      {/* Location Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
               <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Location</h3>
          </div>
          {/* Area Type Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
             <button 
               onClick={() => setAreaType('urban')}
               className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${areaType === 'urban' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
             >
               Urban
             </button>
             <button 
               onClick={() => setAreaType('rural')}
               className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${areaType === 'rural' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
             >
               Rural
             </button>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-semibold text-sm shadow-sm"
        >
          {isLocating ? <Loader className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
          {isLocating ? 'Detecting Location...' : 'Auto-Detect Location (GPS)'}
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Inputs Column */}
          <div className="flex-1 grid grid-cols-1 gap-6">
            
            {/* State Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('lbl.state')} *</label>
              <div className="relative">
                <select
                  value={location.state}
                  onChange={handleStateChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none transition-all font-medium"
                >
                  <option value="">Select State</option>
                  {Object.keys(INDIAN_STATES_CITIES).sort().map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                  {/* Allow custom state if fetched and not in list */}
                  {location.state && !Object.keys(INDIAN_STATES_CITIES).includes(location.state) && (
                     <option value={location.state}>{location.state}</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* City Selection with Autocomplete */}
            <div ref={cityInputRef} className="relative">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{areaType === 'urban' ? t('lbl.city') + ' *' : 'Village / Taluka *'}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={location.city}
                  onChange={handleCityChange}
                  onFocus={() => {
                     if (location.state && location.city) setShowCitySuggestions(true);
                  }}
                  disabled={!location.state && !location.city} 
                  placeholder={!location.state ? "Select State first" : (areaType === 'urban' ? t('ph.city') : "e.g. Rampur")}
                  className={`w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium ${!location.state && !location.city ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                />
                <div className="absolute right-2 top-2">
                  <VoiceInput isCompact langCode={i18n.language} onResult={(text) => {
                     setLocation(prev => ({...prev, city: text}));
                  }} />
                </div>
              </div>
              
              {/* Suggestions Dropdown */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2 animate-fade-in-down">
                  {citySuggestions.map((city) => (
                    <li 
                      key={city}
                      onClick={() => selectCity(city)}
                      className="px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-700 last:border-none"
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('lbl.area')} *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={location.area}
                    onChange={(e) => setLocation(prev => ({...prev, area: e.target.value}))}
                    placeholder={t('ph.area')}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium"
                  />
                  <div className="absolute right-2 top-2">
                    <VoiceInput isCompact langCode={i18n.language} onResult={(text) => setLocation(prev => ({...prev, area: text}))} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('lbl.ward')}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={location.ward || ''}
                    onChange={(e) => setLocation(prev => ({...prev, ward: e.target.value}))}
                    placeholder="e.g. 12"
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium"
                  />
                  <div className="absolute right-2 top-2">
                    <VoiceInput isCompact langCode={i18n.language} onResult={(text) => setLocation(prev => ({...prev, ward: text}))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="w-full md:w-5/12 flex flex-col gap-3">
            <div 
              ref={mapContainerRef}
              className="w-full h-full min-h-[300px] bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 relative overflow-hidden shadow-inner z-0"
            >
               {/* Map rendered here by Leaflet */}
            </div>
            <div className="flex justify-between items-center px-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {isLocating ? "Detecting location..." : "Map Preview"}
              </p>
              {mapCoords && (
                 <p className="text-[10px] font-mono text-gray-400">{mapCoords[0].toFixed(4)}, {mapCoords[1].toFixed(4)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Authority Auto-Suggestion Box */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
           <div className="flex items-center gap-2 mb-3">
             <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
             <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('lbl.addressedTo')}</h4>
           </div>
           <div className="relative">
             <textarea 
               value={authority}
               onChange={(e) => setAuthority(e.target.value)}
               rows={3}
               className="w-full bg-blue-50/50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-blue-300 resize-none transition-all"
             />
             <p className="text-[10px] text-gray-400 mt-2 text-right">Auto-suggested based on your location. You can edit this.</p>
           </div>
        </div>
      </div>

      {/* NEW PROBLEM DESCRIPTION */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
           <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
             <FileText className="w-5 h-5" />
           </div>
           <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('lbl.desc')}</h3>
        </div>
        <div className="relative">
          <textarea
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             placeholder={t('ph.desc')}
             className="w-full h-40 p-5 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium leading-relaxed"
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isAutoFilling 
                  ? 'bg-purple-100 text-purple-400' 
                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
              }`}
              title="AI Suggestion"
            >
              {isAutoFilling ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
            <VoiceInput isCompact langCode={i18n.language} onResult={(text) => setDescription(description ? description + ' ' + text : text)} />
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
          {description.length < 10 ? 'Minimum 10 characters required' : `${description.length} characters`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="text-primary-600 dark:text-primary-400 w-5 h-5" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('lbl.language')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border text-center ${
                  language === opt.value 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 border-primary-600' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="block">{opt.native}</span>
                <span className={`text-xs block mt-0.5 ${language === opt.value ? 'text-primary-200' : 'text-gray-400'}`}>
                   {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Template Selection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-primary-600 dark:text-primary-400 w-5 h-5" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('lbl.template')}</h3>
          </div>
          <div className="space-y-3">
            {Object.values(ComplaintTemplate).map((temp) => {
              const config = getTemplateConfig(temp);
              const isActive = template === temp;
              return (
                <button
                  key={temp}
                  onClick={() => setTemplate(temp)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all border ${
                    isActive 
                      ? config.activeClass + ' shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`mt-0.5 ${isActive ? '' : 'text-gray-400 dark:text-gray-500'}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {temp}
                    </p>
                    <p className={`text-xs mt-1 ${isActive ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {config.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <button onClick={onBack} className="px-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold transition-all">{t('btn.back')}</button>
        <button 
          onClick={onNext} 
          disabled={!isFormValid}
          className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all hover:-translate-y-0.5"
        >
          {t('btn.next')}: {t('step.photo')}
        </button>
      </div>
    </div>
  );
};

// STEP 3: PHOTO & GENERATE
const StepPhotoAndGenerate: React.FC<{
  image: string | null;
  setImage: (img: string | null) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}> = ({ image, setImage, onBack, onGenerate, isGenerating }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center pb-2">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{t('title.photo')}</h2>
         <p className="text-gray-500 dark:text-gray-400">Evidence strengthens your complaint significantly.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
         {image ? (
            <div className="relative w-full max-w-md">
              <img src={image} alt="Evidence" className="w-full h-64 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-600" />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-3 -right-3 p-2 bg-red-100 text-red-600 rounded-full shadow-md hover:bg-red-200 transition-colors"
              >
                <Upload className="w-4 h-4 rotate-45" />
              </button>
            </div>
         ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:border-primary-400 transition-all group"
            >
               <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Upload className="w-8 h-8" />
               </div>
               <p className="font-bold text-gray-700 dark:text-gray-300">Click to Upload Photo</p>
               <p className="text-xs text-gray-400 mt-2">JPG, PNG (Max 5MB)</p>
            </div>
         )}
         <input 
           ref={fileInputRef}
           type="file" 
           accept="image/*" 
           onChange={handleFileChange}
           className="hidden" 
         />
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <button onClick={onBack} disabled={isGenerating} className="px-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold transition-all disabled:opacity-50">{t('btn.back')}</button>
        <button 
          onClick={onGenerate} 
          disabled={isGenerating}
          className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/30 font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
        >
          {isGenerating ? (
             <>
               <Loader className="w-5 h-5 animate-spin" />
               Generating Letter...
             </>
          ) : (
             <>
               <FileText className="w-5 h-5" />
               {image ? t('btn.analyze') : t('btn.skip')}
             </>
          )}
        </button>
      </div>
    </div>
  );
};

// STEP 4: REVIEW & DOWNLOAD
const StepReview: React.FC<{
  letter: string;
  onUpdate: (val: string) => void;
  onBack: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  signature: string | null;
  setSignature: (sig: string | null) => void;
}> = ({ letter, onUpdate, onBack, onDownloadPdf, onDownloadDocx, signature, setSignature }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showSigPad, setShowSigPad] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Date State
  const [dateInput, setDateInput] = useState('');
  const [highlightDate, setHighlightDate] = useState(false);

  // Regex for finding the Date line in supported languages
  const dateLineRegex = /((?:Date|दिनांक|તારીખ|तारीख|தேதி|తేదీ|ದಿನಾಂಕ|തിയതി|তারিখ|ਮਿਤੀ)\s*[:\-]\s*)([^\n]*)/i;

  useEffect(() => {
    const match = letter.match(dateLineRegex);
    if (match && match[2]) {
      const parsed = parseDateFromText(match[2].trim());
      if (parsed) setDateInput(parsed);
    } else {
      setDateInput(new Date().toISOString().split('T')[0]);
    }
  }, []); 

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateInput(newDate);
    updateLetterDate(newDate);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateInput(today);
    updateLetterDate(today);
  };

  const updateLetterDate = (isoDate: string) => {
    if (!isoDate) return;
    const formattedDate = formatDateForLetter(isoDate);
    
    if (dateLineRegex.test(letter)) {
      const newLetter = letter.replace(dateLineRegex, `$1${formattedDate}`);
      onUpdate(newLetter);
    } else {
      const newLetter = `Date: ${formattedDate}\n\n${letter}`;
      onUpdate(newLetter);
    }

    setHighlightDate(true);
    setTimeout(() => setHighlightDate(false), 1000);
  };

  const handleCopy = async () => {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
        setIsEditing(false);
    } else {
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
       {/* Toast Notification */}
       <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-sm">
            <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600" />
            Text copied successfully
          </div>
       </div>

       <div className="text-center pb-2">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{t('title.review')}</h2>
         <p className="text-gray-500 dark:text-gray-400">Review, edit, and download your official complaint.</p>
      </div>

      <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border transition-all duration-300 relative group shadow-sm ${
        isEditing 
          ? 'border-primary-500 ring-2 ring-primary-500/20' 
          : highlightDate 
            ? 'border-green-500 ring-2 ring-green-500/30' 
            : 'border-gray-100 dark:border-gray-700'
      }`}>
         
         {/* Date Toolbar */}
         <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-sm transition-opacity opacity-100">
            <div className="flex items-center gap-2 px-2 border-r border-gray-200 dark:border-gray-700">
               <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
               <span className="text-xs font-bold text-gray-600 dark:text-gray-300 hidden sm:inline">Letter Date:</span>
            </div>
            <input 
              type="date" 
              value={dateInput}
              onChange={handleDateChange}
              className="bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 outline-none cursor-pointer w-32"
            />
            <button 
              onClick={setToday}
              className="p-1.5 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-500 hover:text-primary-600 rounded-md transition-colors border border-gray-200 dark:border-gray-700"
              title="Set to Today"
            >
               <RefreshCw className="w-3.5 h-3.5" />
            </button>
         </div>

         {/* Edit Mode Indicator */}
         {isEditing && (
             <div className="absolute top-4 right-4 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-fade-in z-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                Editing Mode
             </div>
         )}

         <textarea 
           ref={textareaRef}
           readOnly={!isEditing}
           value={letter}
           onChange={(e) => onUpdate(e.target.value)}
           className={`w-full h-[500px] p-6 pt-16 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none resize-none font-serif text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-base transition-all ${
             isEditing 
               ? 'border-gray-300 dark:border-gray-600 cursor-text' 
               : 'border-transparent cursor-default focus:border-transparent'
           }`}
         />
      </div>

      {/* Signature Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
         <div className="flex items-center justify-between">
           <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
             <PenTool className="w-4 h-4 text-primary-600" />
             Sign this Complaint (Optional)
           </h3>
           {signature && (
             <button 
               onClick={() => { setSignature(null); setShowSigPad(false); }}
               className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
             >
               <Trash2 className="w-3 h-3" /> Remove Signature
             </button>
           )}
         </div>

         {!signature && !showSigPad && (
           <button 
             onClick={() => setShowSigPad(true)}
             className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all font-medium flex items-center justify-center gap-2"
           >
             <Edit2 className="w-4 h-4" /> Add Digital Signature
           </button>
         )}

         {showSigPad && !signature && (
           <SignaturePad 
             onSave={(data) => {
               setSignature(data);
               setShowSigPad(false);
             }}
             onCancel={() => setShowSigPad(false)}
           />
         )}

         {signature && (
           <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
             <img src={signature} alt="Digital Signature" className="h-16 object-contain" />
             <p className="text-[10px] text-gray-400 mt-2">Will be attached at the bottom of the document</p>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
         {/* Edit Button */}
         <button 
           onClick={toggleEdit}
           className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${
             isEditing 
               ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20' 
               : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
           }`}
         >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? "Save Changes" : "Edit Text"}
         </button>

         {/* Copy Button */}
         <button 
           onClick={handleCopy}
           className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
         >
            <Copy className="w-4 h-4" />
            Copy Text
         </button>

         {/* PDF Button */}
         <button 
           onClick={onDownloadPdf}
           className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-1"
         >
            <FileDown className="w-4 h-4" />
            {t('btn.downloadPdf')}
         </button>

         {/* Docx Button */}
         <button 
           onClick={onDownloadDocx}
           className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
         >
            <FileText className="w-4 h-4" />
            {t('btn.downloadDocx')}
         </button>

         {/* Done Button */}
         <button 
           onClick={() => navigate('/dashboard')}
           className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
         >
            <CheckCircle className="w-4 h-4" />
            Done
         </button>
      </div>
    </div>
  );
};

const ComplaintWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [complaintType, setComplaintType] = useState<ComplaintType>(ComplaintType.ROAD);
  const [location, setLocation] = useState<LocationDetails>({ area: '', city: '', state: '' });
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [language, setLanguage] = useState<ComplaintLanguage>(ComplaintLanguage.ENGLISH);
  const [template, setTemplate] = useState<ComplaintTemplate>(ComplaintTemplate.NORMAL);
  const [authority, setAuthority] = useState('');
  
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const letter = await generateFormalLetter(
        complaintType, description, image, location, language, template, authority
      );
      setGeneratedLetter(letter);

      const newId = Date.now().toString();
      const newComplaint: ComplaintData = {
        id: newId,
        type: complaintType,
        dateCreated: new Date().toISOString(),
        description,
        image,
        generatedLetter: letter,
        locationDetails: location,
        language,
        template,
        authority,
        status: ComplaintStatus.DRAFT
      };
      saveComplaint(newComplaint);
      setComplaintId(newId);
      nextStep();
    } catch (e) {
      console.error(e);
      alert("Error generating letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateLetter = (text: string) => {
    setGeneratedLetter(text);
    if (complaintId) {
       const existing = localStorage.getItem('civic_lens_complaints');
       if (existing) {
         const complaints = JSON.parse(existing) as ComplaintData[];
         const updated = complaints.map(c => c.id === complaintId ? { ...c, generatedLetter: text } : c);
         localStorage.setItem('civic_lens_complaints', JSON.stringify(updated));
       }
    }
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(generatedLetter, 180);
    
    // Add text
    doc.text(splitText, 15, 20);
    
    // Add Signature if exists
    if (signature) {
       // Estimate Y position based on text length (basic estimation)
       // 1.15 is default line height factor for jsPDF, font size 16 (default 16? no usually 16 points is 5.64mm? No default is 16 units usually points)
       // Actually jsPDF default font size is 16.
       const lineHeight = 7; // Approx height per line in mm
       let yPos = 20 + (splitText.length * lineHeight) + 10;
       
       // Check if new page needed
       if (yPos > 250) {
         doc.addPage();
         yPos = 20;
       }
       
       doc.addImage(signature, 'PNG', 15, yPos, 40, 20);
    }

    doc.save(`Complaint_${complaintType}_${location.city}.pdf`);
    if (complaintId) updateComplaintStatus(complaintId, ComplaintStatus.DOWNLOADED);
  };

  const downloadDocx = async () => {
    const children: any[] = generatedLetter.split('\n').map(line => 
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 200 }
      })
    );

    // Add Signature if exists
    if (signature) {
       try {
         // Convert Base64 to ArrayBuffer/Uint8Array
         const base64Data = signature.split(',')[1];
         const binaryString = window.atob(base64Data);
         const len = binaryString.length;
         const bytes = new Uint8Array(len);
         for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
         }
         
         children.push(
            new Paragraph({
               children: [
                 new ImageRun({
                   data: bytes,
                   transformation: { width: 150, height: 75 },
                   type: "png"
                 })
               ],
               spacing: { before: 400 }
            })
         );
       } catch (e) {
         console.error("Error adding signature to docx", e);
       }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });
    
    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Complaint_${complaintType}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      if (complaintId) updateComplaintStatus(complaintId, ComplaintStatus.DOWNLOADED);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-2">
           {['Problem', 'Details', 'Evidence', 'Review'].map((label, idx) => (
             <span key={idx} className={`text-xs font-bold uppercase tracking-wider ${step > idx ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
               {label}
             </span>
           ))}
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
           <div 
             className="h-full bg-primary-600 transition-all duration-500 ease-out"
             style={{ width: `${(step / 4) * 100}%` }}
           ></div>
        </div>
      </div>

      {step === 1 && <StepProblemSelection selectedType={complaintType} onSelect={(type) => { setComplaintType(type); nextStep(); }} />}
      
      {step === 2 && (
        <StepDetailsConfig 
          location={location} setLocation={setLocation}
          description={description} setDescription={setDescription}
          language={language} setLanguage={setLanguage}
          template={template} setTemplate={setTemplate}
          complaintType={complaintType}
          authority={authority} setAuthority={setAuthority}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 3 && (
        <StepPhotoAndGenerate 
          image={image} setImage={setImage}
          onBack={prevStep}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}

      {step === 4 && (
        <StepReview 
          letter={generatedLetter}
          onUpdate={handleUpdateLetter}
          onBack={prevStep}
          onDownloadPdf={downloadPdf}
          onDownloadDocx={downloadDocx}
          signature={signature}
          setSignature={setSignature}
        />
      )}
    </div>
  );
};

export default ComplaintWizard;