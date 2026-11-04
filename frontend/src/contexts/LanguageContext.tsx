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
    // Header & Greeting
    'dashboard.welcomeBack': 'Welcome back,',
    'dashboard.greetingSubtitle': "Here's what's happening with your money today.",
    'dashboard.quickTools': 'Quick Tools',
    
    // Tools
    'tools.simpleInterest': 'Simple\nInterest',
    'tools.compoundInterest': 'Compound\nInterest',
    'tools.emiCalculator': 'EMI\nCalculator',
    'tools.rateCalculator': 'Rate\nCalculator',

    // Transactions Table
    'dashboard.recentTransactions': 'Recent Transactions',
    'dashboard.viewAll': 'View All >',
    'table.name': 'Name',
    'table.type': 'Type',
    'table.amount': 'Amount',
    'table.rate': 'Rate',
    'table.status': 'Status',
    'table.lender': 'Lender',
    'table.borrower': 'Borrower',
    'table.pending': 'Pending',
    'table.completed': 'Completed',
    'dashboard.noTransactions': 'No Transactions Yet',
    'dashboard.noTransactionsSub': 'Tap "+" below to create your first borrower or lender record.',

    // Bottom Navigation
    'nav.dashboard': 'Dashboard',
    'nav.lenders': 'Lenders',
    'nav.borrowers': 'Borrowers',
    'nav.more': 'More',

    // More Options Modal
    'menu.moreOptions': 'More Options',
    'menu.myProfile': 'My Profile',
    'menu.searchUsers': 'Search Users',
    'menu.language': 'Language: English (Switch to తెలుగు)',
    'menu.logout': 'Logout',

    // Quick Add Modal
    'modal.addNewRecord': 'Add New Record',
    'modal.addSubtitle': 'Select the type of record you wish to create',
    'modal.addBorrower': 'Add Borrower Record',
    'modal.addBorrowerDesc': 'Record money given / lent to someone',
    'modal.addLender': 'Add Lender Record',
    'modal.addLenderDesc': 'Record money received / borrowed from a lender',
    'common.cancel': 'Cancel',

    // Legacy keys
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
    'home.emiCalculator': 'EMI\nCalculator',
    'home.signIn': 'Sign In\nAccount',
    'home.createAccount': 'Create\nAccount',
    'home.login': 'Login',
    'home.register': 'Register',
    'home.wantToManage': 'Want to manage your records?',
    'home.wantToManageSubtitle': 'Sign in to save and track your lender & borrower details.',
    'home.lenderRecords': 'Lender Records',
    'home.borrowerRecords': 'Borrower Records',
    'home.signInToAccess': 'Sign in to access',
    'home.signInOrCreate': 'Sign In / Create Account',
    'home.simpleInterestDesc': 'Calculate simple interest easily.',
    'home.compoundInterestDesc': 'Calculate compound interest quickly.',
    'home.rateCalculatorDesc': 'Find interest rate or time easily.',
    'home.emiCalculatorDesc': 'Calculate EMI and total repayment.',
    'home.lenderDetailsDesc': 'Sign in to access your lender details.',
    'home.borrowerDetailsDesc': 'Sign in to access your borrower details.',
    'home.freeCalculators': 'Free calculators • Secure personal records',
    'home.featureSecure': '100% Secure & Private',
    'home.featureSecureDesc': 'Bank-grade encryption keeps your loan data protected.',
    'home.featureCalculators': 'Instant Calculations',
    'home.featureCalculatorsDesc': 'Accurate simple, compound, EMI & rate calculations.',
    'home.featureSync': 'Sync Across Devices',
    'home.featureSyncDesc': 'Access your records seamlessly on mobile and web.',
    'home.trustedPlatform': 'Trusted Financial Management Platform',
  },
  te: {
    // Header & Greeting
    'dashboard.welcomeBack': 'తిరిగి స్వాగతం,',
    'dashboard.greetingSubtitle': 'ఈరోజు మీ డబ్బు లావాదేవీల తాజా వివరాలు.',
    'dashboard.quickTools': 'ముఖ్యమైన సాధనాలు',
    
    // Tools
    'tools.simpleInterest': 'సాధారణ\nవడ్డీ',
    'tools.compoundInterest': 'చక్ర\nవడ్డీ',
    'tools.emiCalculator': 'EMI\nకాలిక్యులేటర్',
    'tools.rateCalculator': 'వడ్డీ రేటు\nకాలిక్యులేటర్',

    // Transactions Table
    'dashboard.recentTransactions': 'ఇటీవలి లావాదేవీలు',
    'dashboard.viewAll': 'అన్నీ చూడండి >',
    'table.name': 'పేరు',
    'table.type': 'రకం',
    'table.amount': 'మొత్తం',
    'table.rate': 'రేటు',
    'table.status': 'స్థితి',
    'table.lender': 'రుణదాత',
    'table.borrower': 'రుణగ్రహీత',
    'table.pending': 'పెండింగ్',
    'table.completed': 'పూర్తయింది',
    'dashboard.noTransactions': 'ఇంకా లావాదేవీలు లేవు',
    'dashboard.noTransactionsSub': 'మీ మొదటి రికార్డును సృష్టించడానికి క్రింద ఉన్న "+" నొక్కండి.',

    // Bottom Navigation
    'nav.dashboard': 'హోమ్',
    'nav.lenders': 'రుణదాతలు',
    'nav.borrowers': 'రుణగ్రహీతలు',
    'nav.more': 'మరిన్ని',

    // More Options Modal
    'menu.moreOptions': 'మరిన్ని ఎంపికలు',
    'menu.myProfile': 'నా ప్రొఫైల్',
    'menu.searchUsers': 'వినియోగదారులను వెతకండి',
    'menu.language': 'భాష: తెలుగు (Switch to English)',
    'menu.logout': 'లాగ్అవుట్',

    // Quick Add Modal
    'modal.addNewRecord': 'కొత్త రికార్డును జోడించండి',
    'modal.addSubtitle': 'మీరు సృష్టించాలనుకుంటున్న రికార్డు రకాన్ని ఎంచుకోండి',
    'modal.addBorrower': 'రుణగ్రహీత రికార్డు జోడించండి',
    'modal.addBorrowerDesc': 'మీరు ఇతరులకు ఇచ్చిన డబ్బు వివరాలు',
    'modal.addLender': 'రుణదాత రికార్డు జోడించండి',
    'modal.addLenderDesc': 'మీరు ఇతరుల నుండి తీసుకున్న డబ్బు వివరాలు',
    'common.cancel': 'రద్దు చేయండి',

    // Legacy keys
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
    'home.emiCalculator': 'EMI\nకాలిక్యులేటర్',
    'home.signIn': 'ఖాతాలోకి\nలాగిన్',
    'home.createAccount': 'ఖాతాను\nసృష్టించండి',
    'home.login': 'లాగిన్',
    'home.register': 'రిజిస్టర్',
    'home.simpleInterestDesc': 'సాధారణ వడ్డీని సులభంగా లెక్కించండి.',
    'home.compoundInterestDesc': 'చక్రవడ్డీని వేగంగా లెక్కించండి.',
    'home.interestCalculatorDesc': 'తేదీలు మరియు కాలపరిమితితో తక్షణ వడ్డీ లెక్కింపు.',
    'home.rateCalculatorDesc': 'వడ్డీ రేటు లేదా సమయాన్ని కనుగొనండి.',
    'home.emiCalculatorDesc': 'EMI మరియు మొత్తం చెల్లింపును లెక్కించండి.',
    'home.accountTitle': 'రుణ రికార్డులను నిర్వహించండి',
    'home.accountSubtitle': 'మీ రుణగ్రహీత మరియు రుణదాత రికార్డులను భద్రంగా ట్రాక్ చేయడానికి లాగిన్ అవ్వండి.',
    'home.signInButton': 'ఖాతాలోకి లాగిన్ అవ్వండి',
    'home.createAccountButton': 'ఉచిత ఖాతాను సృష్టించండి',
    'home.wantToManage': 'మీ రికార్డులను నిర్వహించాలనుకుంటున్నారా?',
    'home.wantToManageSubtitle': 'మీ రుణదాత & రుణగ్రహీత వివరాలను భద్రపరచడానికి లాగిన్ అవ్వండి.',
    'home.lenderRecords': 'రుణదాత రికార్డులు',
    'home.borrowerRecords': 'రుణగ్రహీత రికార్డులు',
    'home.signInToAccess': 'యాక్సెస్ చేయడానికి లాగిన్ అవ్వండి',
    'home.signInOrCreate': 'లాగిన్ / ఖాతాను సృష్టించండి',
    'home.lenderDetailsDesc': 'మీ రుణదాత వివరాలను చూడటానికి లాగిన్ అవ్వండి.',
    'home.borrowerDetailsDesc': 'మీ రుణగ్రహీత వివరాలను చూడటానికి లాగిన్ అవ్వండి.',
    'home.freeCalculators': 'ఉచిత కాలిక్యులేటర్లు • సురక్షితమైన రికార్డులు',
    'home.featureSecure': '100% సురక్షితం & గోప్యమైనది',
    'home.featureSecureDesc': 'మీ రుణ వివరాలు పూర్తిగా సురక్షితంగా ఉంటాయి.',
    'home.featureCalculators': 'తక్షణ లెక్కింపు',
    'home.featureCalculatorsDesc': 'ఖచ్చితమైన సాధారణ, చక్రవడ్డీ & ఈఎమ్‌ఐ లెక్కలు.',
    'home.featureSync': 'ఎక్కడైనా సులభంగా యాక్సెస్',
    'home.featureSyncDesc': 'మొబైల్ మరియు వెబ్‌లో ఎల్లప్పుడూ రికార్డులు అందుబాటులో ఉంటాయి.',
    'home.trustedPlatform': 'నమ్మకమైన ఆర్థిక లెక్కల నిర్వహణ వేదిక',
  },
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
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        if (savedLang === 'en' || savedLang === 'te') {
          setLanguageState(savedLang);
        }
      } catch (e) {
        console.log('Failed to load language', e);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('user_language', lang);
    } catch (e) {
      console.log('Failed to save language', e);
    }
  };

  const t = (key: string): string => {
    const dict = (translations[language] || translations.en) as Record<string, string>;
    return dict[key] || (translations.en as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
