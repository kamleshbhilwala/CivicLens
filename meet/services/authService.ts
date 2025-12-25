import { User } from '../contexts/AuthContext';

// Safe access to window.google
declare global {
  interface Window {
    google: any;
  }
}

// Safely access env var without crashing if process is undefined (e.g. browser ESM)
// Support both REACT_APP_ and VITE_ prefixes for compatibility
const GOOGLE_CLIENT_ID = 
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_CLIENT_ID) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_CLIENT_ID) || 
  '';

// Mock Data for Google Accounts (Fallback)
const MOCK_GOOGLE_ACCOUNTS = [
  {
    id: 'g_1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=0D8ABC&color=fff'
  },
  {
    id: 'g_2',
    name: 'Priya Patel',
    email: 'priya.official@work.com',
    avatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=F44336&color=fff'
  }
];

const waitForGoogleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    // Timeout after 3s to allow fallback handling
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 3000);
  });
};

export const authService = {
  // --- REAL GOOGLE AUTH ---
  // Triggers the actual Google Popup with Account Chooser
  initRealGoogleAuth: async (): Promise<User> => {
    // Ensure script is loaded
    await waitForGoogleScript();

    return new Promise((resolve, reject) => {
      // If no client ID or script not loaded, reject to trigger fallback
      if (!window.google || !GOOGLE_CLIENT_ID) {
        reject(new Error("GOOGLE_AUTH_NOT_CONFIGURED"));
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          // Force account chooser every time to show all device accounts
          prompt: 'select_account', 
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              try {
                // Fetch User Profile
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                }).then(res => res.json());

                resolve({
                  id: userInfo.sub,
                  name: userInfo.name,
                  email: userInfo.email,
                  avatar: userInfo.picture,
                });
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error("Google Sign-In was cancelled."));
            }
          },
          error_callback: (err: any) => {
            reject(new Error("Google Auth Error: " + err.message));
          }
        });

        // Open the Popup
        client.requestAccessToken();

      } catch (e) {
        reject(e);
      }
    });
  },

  // --- MOCK SIMULATION (Fallback) ---
  getGoogleAccountsMock: async (): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Network delay
    return MOCK_GOOGLE_ACCOUNTS;
  },

  signInWithGoogleAccountMock: async (accountId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Auth delay
    const account = MOCK_GOOGLE_ACCOUNTS.find(a => a.id === accountId);
    if (!account) throw new Error("Account not found");
    
    return {
      id: `google_${Date.now()}`,
      name: account.name,
      email: account.email,
      avatar: account.avatar
    };
  },

  // --- Phone Auth Simulation ---
  sendOtp: async (phone: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Mock SMS Gateway] SMS sent to +91 ${phone}: ${otp}`);
    return otp; 
  },

  verifyOtp: async (phone: string, inputOtp: string, actualOtp: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (inputOtp !== actualOtp && inputOtp !== '123456') {
       throw new Error("Incorrect OTP. Please try again.");
    }
    return {
      id: `phone_${Date.now()}`,
      name: 'Verified Citizen',
      phone: `+91 ${phone}`,
      avatar: 'https://ui-avatars.com/api/?name=Verified+Citizen&background=4CAF50&color=fff'
    };
  },

  // --- Email Auth Simulation ---
  loginEmail: async (email: string, pass: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (pass.length < 6) throw new Error("Password must be at least 6 characters");
    return {
      id: `email_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
    };
  },

  signupEmail: async (name: string, email: string, pass: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (!name || !email || !pass) throw new Error("All fields are required");
    return {
      id: `email_${Date.now()}`,
      name: name,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
  }
};