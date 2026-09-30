import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'dashboard.borrowerRecords': 'Borrower\nRecords',
    'dashboard.lenderRecords': 'Lender\nRecords',
    'dashboard.interestCalculator': 'Interest\nCalculator',
    'dashboard.rateCalculator': 'Rate\nCalculator',
    'dashboard.notifications': 'Notifications',
    'dashboard.search': 'Search',
    'dashboard.profile': 'Profile',
    'dashboard.logout': 'Logout',
    'dashboard.smartInterest': 'Smart Interest Management',
    'dashboard.trackLoans': 'Loans records, calculate rates, and manage your finances seamlessly.',
  },
  te: {
    'dashboard.borrowerRecords': 'అప్పు తీసుకున్నవారి\nవివరాలు',
    'dashboard.lenderRecords': 'అప్పు ఇచ్చినవారి\nవివరాలు',
    'dashboard.interestCalculator': 'వడ్డీ\nకాలిక్యులేటర్',
    'dashboard.rateCalculator': 'రేట్\nకాలిక్యులేటర్',
    'dashboard.notifications': 'నోటిఫికేషన్లు',
    'dashboard.search': 'వెతకండి',
    'dashboard.profile': 'ప్రొఫైల్',
    'dashboard.logout': 'లాగ్అవుట్',
    'dashboard.smartInterest': 'స్మార్ట్ ఇంట్రెస్ట్ మేనేజ్మెంట్',
    'dashboard.trackLoans': 'రుణాలను ట్రాక్ చేయండి, రేట్లను లెక్కించండి మరియు మీ ఆర్థిక విషయాలను నిర్వహించండి.',
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLang = async () => {
      const savedLang = await AsyncStorage.getItem('user_language');
      if (savedLang === 'en' || savedLang === 'te') {
        setLanguageState(savedLang);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('user_language', lang);
  };

  const t = (key: string): string => {
    const keys = translations[language] as Record<string, string>;
    return keys[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
