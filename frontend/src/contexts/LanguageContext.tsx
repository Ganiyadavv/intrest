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
    'dashboard.compoundInterest': 'Compound\nInterest',
    'dashboard.rateCalculator': 'Rate\nCalculator',
    'dashboard.notifications': 'Notifications',
    'dashboard.search': 'Search',
    'dashboard.profile': 'Profile',
    'dashboard.logout': 'Logout',
    'dashboard.smartInterest': 'Smart Interest Management',
    'dashboard.trackLoans': 'Loans records, calculate rates, and manage your finances seamlessly.',
    'home.tagline': 'Fast & Accurate Financial Calculators',
    'home.heroDesc': 'Calculate interest freely without login. Sign in anytime to manage borrower & lender records.',
    'home.simpleInterest': 'Simple\nInterest',
    'home.compoundInterest': 'Compound\nInterest',
    'home.interestCalculator': 'Interest\nCalculator',
    'home.rateCalculator': 'Rate\nCalculator',
    'home.signIn': 'Sign In\nAccount',
    'home.createAccount': 'Create\nAccount',
    'home.login': 'Login',
    'home.register': 'Register',
  },
  te: {
    'dashboard.borrowerRecords': 'అప్పు తీసుకున్నవారి\nవివరాలు',
    'dashboard.lenderRecords': 'అప్పు ఇచ్చినవారి\nవివరాలు',
    'dashboard.interestCalculator': 'వడ్డీ\nకాలిక్యులేటర్',
    'dashboard.compoundInterest': 'చక్ర\nవడ్డీ',
    'dashboard.rateCalculator': 'రేట్\nకాలిక్యులేటర్',
    'dashboard.notifications': 'నోటిఫికేషన్లు',
    'dashboard.search': 'వెతకండి',
    'dashboard.profile': 'ప్రొఫైల్',
    'dashboard.logout': 'లాగ్అవుట్',
    'dashboard.smartInterest': 'స్మార్ట్ ఇంట్రెస్ట్ మేనేజ్మెంట్',
    'dashboard.trackLoans': 'రుణాలను ట్రాక్ చేయండి, రేట్లను లెక్కించండి మరియు మీ ఆర్థిక విషయాలను నిర్వహించండి.',
    'home.simpleInterest': 'సాధారణ\nవడ్డీ',
    'home.compoundInterest': 'చక్ర\nవడ్డీ',
    'home.interestCalculator': 'వడ్డీ\nకాలిక్యులేటర్',
    'home.rateCalculator': 'రేట్\nకాలిక్యులేటర్',
    'home.signIn': 'ఖాతాలోకి\nలాగిన్',
    'home.createAccount': 'ఖాతాను\nసృష్టించండి',
    'home.login': 'లాగిన్',
    'home.register': 'రిజిస్టర్',
    'home.compoundInterestDesc': 'నెలవారీ, త్రైమాసిక, అర్ధ వార్షిక లేదా వార్షిక చక్రవడ్డీని లెక్కించండి.',
    'home.interestCalculatorDesc': 'తేదీలు మరియు కాలపరిమితితో తక్షణ వడ్డీ లెక్కింపు.',
    'home.rateCalculatorDesc': 'అసలు మరియు వడ్డీ ఆధారంగా ఖచ్చితమైన వడ్డీ రేటును కనుగొనండి.',
    'home.login': 'లాగిన్',
    'home.register': 'రిజిస్టర్',
    'home.accountTitle': 'రుణ రికార్డులను నిర్వహించండి',
    'home.accountSubtitle': 'మీ రుణగ్రహీత మరియు రుణదాత రికార్డులను భద్రంగా ట్రాక్ చేయడానికి లాగిన్ అవ్వండి.',
    'home.signInButton': 'ఖాతాలోకి లాగిన్ అవ్వండి',
    'home.createAccountButton': 'ఉచిత ఖాతాను సృష్టించండి',
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
