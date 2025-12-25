import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Helper to convert flat keys ("app.name") to nested objects ({ app: { name: ... } })
// This guarantees compatibility with i18next's default lookups.
const nest = (flat: Record<string, string>) => {
  const nested: any = {};
  for (const key in flat) {
    const parts = key.split('.');
    let current = nested;
    for (let i = 0; i < parts.length; i++) {
       const part = parts[i];
       if (i === parts.length - 1) {
         current[part] = flat[key];
       } else {
         current[part] = current[part] || {};
         current = current[part];
       }
    }
  }
  return nested;
};

// Raw Flat Resources
// We define them flat for readability, but convert them to nested objects at runtime.
const flatResources = {
  en: {
    translation: {
      "app.name": "Civic Lens",
      "app.tagline": "Turn Civic Problems into Official Action",
      "app.desc": "Don't just ignore the pothole or the broken streetlight. Use AI to draft a formal, government-style complaint letter in seconds.",
      "btn.create": "Create Complaint Now",
      "btn.getStarted": "Get Started",
      "btn.login": "Log In",
      "btn.signup": "Sign Up",
      "btn.logout": "Sign Out",
      "btn.back": "Back",
      "btn.next": "Next",
      "btn.skip": "Skip & Generate",
      "btn.analyze": "Analyze & Generate",
      "btn.downloadPdf": "Download PDF",
      "btn.downloadDocx": "Download Word",
      "btn.copy": "Copy Text",
      "nav.home": "Home",
      "nav.dashboard": "Dashboard",
      "nav.howItWorks": "How It Works",
      "nav.contact": "Contact",
      "nav.newComplaint": "New Complaint",
      "step.problem": "Problem",
      "step.details": "Details",
      "step.photo": "Photo",
      "step.letter": "Letter",
      "title.problem": "What issue are you facing?",
      "title.details": "Details & Configuration",
      "title.photo": "Add a Photo (Optional)",
      "title.review": "Final Review",
      "lbl.state": "State",
      "lbl.city": "City",
      "lbl.area": "Area / Colony",
      "lbl.ward": "Ward Number (Optional)",
      "lbl.desc": "Problem Description",
      "lbl.addressedTo": "Addressed To (Auto-Suggested)",
      "lbl.language": "Letter Language",
      "lbl.template": "Letter Template",
      "ph.desc": "Describe the issue in detail...",
      "ph.city": "Search City...",
      "ph.area": "e.g. Malviya Nagar",
      "stats.complaints": "Complaints Generated",
      "stats.cities": "Cities Covered",
      "stats.success": "Estimated Success Rate",
      "feat.road": "Road Issues",
      "feat.water": "Water Supply",
      "feat.light": "Street Lights",
      "feat.garbage": "Garbage",
      "auth.title": "Civic Lens",
      "auth.google": "Continue with Google",
      "auth.mobile": "Continue with Mobile",
      "auth.email": "Log in with Email",
      "dashboard.title": "Your Complaints",
      "dashboard.empty": "No Complaints Yet",
      "dashboard.createFirst": "Create your first official complaint letter today.",
      "footer.legal": "Legal",
      "footer.privacy": "Privacy Policy",
      "footer.terms": "Terms & Conditions",
      "footer.madeIn": "Made with ❤️ in India",
      "footer.builtFor": "Built for citizens of India",
      "status.draft": "Draft",
      "status.downloaded": "Downloaded",
      "status.submitted": "Submitted",
      "status.resolved": "Resolved"
    }
  },
  hi: {
    translation: {
      "app.name": "सिविक लेंस",
      "app.tagline": "नागरिक समस्याओं को आधिकारिक कार्रवाई में बदलें",
      "app.desc": "गड्ढों या खराब स्ट्रीट लाइट को नजरअंदाज न करें। AI का उपयोग करके सेकंडों में औपचारिक सरकारी शिकायत पत्र तैयार करें।",
      "btn.create": "शिकायत दर्ज करें",
      "btn.getStarted": "शुरू करें",
      "btn.login": "लॉग इन",
      "btn.signup": "साइन अप",
      "btn.logout": "लॉग आउट",
      "btn.back": "पीछे",
      "btn.next": "अगला",
      "btn.skip": "छोड़ें और जनरेट करें",
      "btn.analyze": "विश्लेषण और जनरेट करें",
      "btn.downloadPdf": "PDF डाउनलोड करें",
      "btn.downloadDocx": "Word डाउनलोड करें",
      "btn.copy": "टेक्स्ट कॉपी करें",
      "nav.home": "होम",
      "nav.dashboard": "डैशबोर्ड",
      "nav.howItWorks": "यह कैसे काम करता है",
      "nav.contact": "संपर्क",
      "nav.newComplaint": "नई शिकायत",
      "step.problem": "समस्या",
      "step.details": "विवरण",
      "step.photo": "फोटो",
      "step.letter": "पत्र",
      "title.problem": "आप किस समस्या का सामना कर रहे हैं?",
      "title.details": "विवरण और कॉन्फ़िगरेशन",
      "title.photo": "फोटो जोड़ें (वैकल्पिक)",
      "title.review": "अंतिम समीक्षा",
      "lbl.state": "राज्य",
      "lbl.city": "शहर",
      "lbl.area": "इलाका / कॉलोनी",
      "lbl.ward": "वार्ड नंबर (वैकल्पिक)",
      "lbl.desc": "समस्या का विवरण",
      "lbl.addressedTo": "प्रति (स्वतः सुझाव)",
      "lbl.language": "पत्र की भाषा",
      "lbl.template": "पत्र का प्रारूप",
      "ph.desc": "समस्या का विस्तार से वर्णन करें...",
      "ph.city": "शहर खोजें...",
      "ph.area": "जैसे मालवीय नगर",
      "stats.complaints": "शिकायतें जनरेट की गईं",
      "stats.cities": "कवर किए गए शहर",
      "stats.success": "अनुमानित सफलता दर",
      "feat.road": "सड़क की समस्याएं",
      "feat.water": "जल आपूर्ति",
      "feat.light": "स्ट्रीट लाइट",
      "feat.garbage": "कचरा / सफाई",
      "auth.title": "सिविक लेंस",
      "auth.google": "Google के साथ जारी रखें",
      "auth.mobile": "मोबाइल के साथ जारी रखें",
      "auth.email": "ईमेल से लॉग इन करें",
      "dashboard.title": "आपकी शिकायतें",
      "dashboard.empty": "अभी कोई शिकायत नहीं",
      "dashboard.createFirst": "आज ही अपना पहला आधिकारिक शिकायत पत्र बनाएँ।",
      "footer.legal": "कानूनी",
      "footer.privacy": "गोपनीयता नीति",
      "footer.terms": "नियम और शर्तें",
      "footer.madeIn": "भारत में ❤️ के साथ बनाया गया",
      "footer.builtFor": "भारत के नागरिकों के लिए",
      "status.draft": "प्रारूप",
      "status.downloaded": "डाउनलोड किया गया",
      "status.submitted": "जमा किया गया",
      "status.resolved": "हल किया गया"
    }
  },
  gu: {
    translation: {
      "app.name": "સિવિક લેન્સ",
      "app.tagline": "નાગરિક સમસ્યાઓને સત્તાવાર કાર્યવાહીમાં ફેરવો",
      "app.desc": "ખાડાઓ અથવા તૂટેલી સ્ટ્રીટ લાઈટને અવગણશો નહીં. AI નો ઉપયોગ કરીને સેકંડમાં ઔપચારિક સરકારી ફરિયાદ પત્ર તૈયાર કરો.",
      "btn.create": "ફરિયાદ બનાવો",
      "btn.getStarted": "શરૂ કરો",
      "btn.login": "લોગ ઇન",
      "btn.signup": "સાઇન અપ",
      "nav.home": "હોમ",
      "nav.dashboard": "ડેશબોર્ડ",
      "nav.howItWorks": "કેવી રીતે કામ કરે છે",
      "nav.contact": "સંપર્ક",
      "nav.newComplaint": "નવી ફરિયાદ",
      "step.problem": "સમસ્યા",
      "step.details": "વિગતો",
      "step.photo": "ફોટો",
      "step.letter": "પત્ર",
      "title.problem": "તમે કઈ સમસ્યાનો સામનો કરી રહ્યા છો?",
      "title.details": "વિગતો",
      "lbl.state": "રાજ્ય",
      "lbl.city": "શહેર",
      "lbl.area": "વિસ્તાર",
      "lbl.desc": "સમસ્યાનું વર્ણન",
      "feat.road": "રસ્તાની સમસ્યા",
      "feat.water": "પાણી પુરવઠો",
      "dashboard.title": "તમારી ફરિયાદો",
      "stats.complaints": "ફરિયાદો",
      "stats.cities": "શહેરો",
      "stats.success": "સફળતા દર"
    }
  },
  mr: {
    translation: {
      "app.name": "सिव्हिक लेन्स",
      "app.tagline": "नागरी समस्यांचे अधिकृत तक्रारीत रूपांतर करा",
      "app.desc": "खड्डे किंवा तुटलेल्या पथदिव्यांकडे दुर्लक्ष करू नका. AI वापरून काही सेकंदात औपचारिक सरकारी तक्रार पत्र तयार करा.",
      "btn.create": "तक्रार नोंदवा",
      "nav.home": "मुख्य पृष्ठ",
      "nav.dashboard": "डॅशबोर्ड",
      "step.problem": "समस्या",
      "step.details": "तपशील",
      "title.problem": "तुम्हाला कोणती समस्या भेडसावत आहे?",
      "lbl.state": "राज्य",
      "lbl.city": "शहर",
      "lbl.area": "क्षेत्र",
      "feat.road": "रस्त्यांच्या समस्या",
      "feat.water": "पाणी पुरवठा",
      "dashboard.title": "तुमच्या तक्रारी"
    }
  },
  ta: {
    translation: {
      "app.name": "சிவிக் லென்ஸ்",
      "app.tagline": "குடிமைப் பிரச்சினைகளை அதிகாரப்பூர்வ நடவடிக்கையாக மாற்றவும்",
      "btn.create": "புகாரை உருவாக்கவும்",
      "nav.home": "முகப்பு",
      "nav.dashboard": "டாஷ்போர்டு",
      "step.problem": "சிக்கல்",
      "step.details": "விவரங்கள்",
      "title.problem": "நீங்கள் என்ன சிக்கலை எதிர்கொள்கிறீர்கள்?",
      "lbl.state": "மாநிலம்",
      "lbl.city": "நகரம்",
      "lbl.desc": "விளக்கம்",
      "dashboard.title": "உங்கள் புகார்கள்"
    }
  },
  te: {
    translation: {
      "app.name": "సివిక్ లెన్స్",
      "app.tagline": "పౌర సమస్యలను అధికారిక చర్యగా మార్చండి",
      "btn.create": "ఫిర్యాదు చేయండి",
      "nav.home": "హోమ్",
      "nav.dashboard": "డ్యాష్‌బోర్డ్",
      "step.problem": "సమస్య",
      "step.details": "వివరాలు",
      "lbl.state": "రాష్ట్రం",
      "lbl.city": "నగరం",
      "dashboard.title": "మీ ఫిర్యాదులు"
    }
  },
  kn: {
    translation: {
      "app.name": "ಸಿವಿಕ್ ಲೆನ್ಸ್",
      "app.tagline": "ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ಅಧಿಕೃತ ದೂರುಗಳಾಗಿ ಪರಿವರ್ತಿಸಿ",
      "btn.create": "ದೂರು ರಚಿಸಿ",
      "nav.home": "ಮುಖಪುಟ",
      "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      "step.problem": "ಸಮಸ್ಯೆ",
      "step.details": "ವಿವರಗಳು",
      "lbl.state": "ರಾಜ್ಯ",
      "lbl.city": "ನಗರ",
      "dashboard.title": "ನಿಮ್ಮ ದೂರುಗಳು"
    }
  },
  ml: {
    translation: {
      "app.name": "സിവിക് ലെൻസ്",
      "app.tagline": "പൗരപ്രശ്നങ്ങൾ ഔദ്യോഗിക പരാതികളാക്കി മാറ്റുക",
      "btn.create": "പരാതി നൽകുക",
      "nav.home": "ഹോം",
      "nav.dashboard": "ഡാഷ്ബോർഡ്",
      "step.problem": "പ്രശ്നം",
      "step.details": "വിശദാംശങ്ങൾ",
      "lbl.state": "സംസ്ഥാനം",
      "lbl.city": "നഗരം",
      "dashboard.title": "നിങ്ങളുടെ പരാതികൾ"
    }
  },
  bn: {
    translation: {
      "app.name": "সিভিক লেন্স",
      "app.tagline": "নাগরিক সমস্যাগুলিকে অফিসিয়াল অ্যাকশনে রূপান্তর করুন",
      "btn.create": "অভিযোগ তৈরি করুন",
      "nav.home": "হোম",
      "nav.dashboard": "ড্যাশবোর্ড",
      "step.problem": "সমস্যা",
      "step.details": "বিবরণ",
      "lbl.state": "রাজ্য",
      "lbl.city": "শহর",
      "dashboard.title": "আপনার অভিযোগগুলি"
    }
  },
  pa: {
    translation: {
      "app.name": "ਸਿਵਿਕ ਲੈਨਜ",
      "app.tagline": "ਨਾਗਰਿਕ ਸਮੱਸਿਆਵਾਂ ਨੂੰ ਸਰਕਾਰੀ ਕਾਰਵਾਈ ਵਿੱਚ ਬਦਲੋ",
      "btn.create": "ਸ਼ਿਕਾਇਤ ਬਣਾਓ",
      "nav.home": "ਘਰ",
      "nav.dashboard": "ਡੈਸ਼ਬੋਰਡ",
      "step.problem": "ਸਮੱਸਿਆ",
      "step.details": "ਵੇਰਵੇ",
      "lbl.state": "ਰਾਜ",
      "lbl.city": "ਸ਼ਹਿਰ",
      "dashboard.title": "ਤੁਹਾਡੀਆਂ ਸ਼ਿਕਾਇਤਾਂ"
    }
  }
};

// Process resources to nest them at runtime.
const resources = Object.keys(flatResources).reduce((acc: any, lang) => {
  acc[lang] = {
    translation: nest((flatResources as any)[lang].translation)
  };
  return acc;
}, {});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true, 
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng' // Default key used by detector
    }
  });

export default i18n;
