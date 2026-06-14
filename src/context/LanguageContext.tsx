import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'kn' | 'ta';

type Translations = {
  [key: string]: string;
};

const dictionary: Record<Language, Translations> = {
  en: {
    // Layout
    'layout.skip_main': 'Skip to main content',
    'layout.screen_reader': 'Screen Reader Access',
    'layout.sub': 'प्रजातंत्र ई-वोटिंग प्लेटफॉर्म',
    'layout.title': 'Prajatantra e-Voting Platform',
    'layout.desc': 'Multi-Model Blockchain-Based Voting System • Pilot 2026',
    'layout.btn': 'Languages ▾',
    'layout.voter_portal': 'Voter Portal',
    'layout.admin_login': 'Admin Login',
    'layout.cast_vote': 'Cast Vote',
    'layout.admin': 'Administration',
    'layout.logout': 'Logout',
    // VoterLogin
    'voter.title': 'Voter Authentication',
    'voter.subtitle': 'Official Citizen Portal',
    'voter.id_label': 'Voter Identification Number',
    'voter.id_placeholder': 'e.g. VTR-84291',
    'voter.step2': 'Identity Verification (Step 2)',
    'voter.align_face': 'Please align your face within the frame to verify your identity.',
    'voter.cam_inactive': 'Camera Inactive',
    'voter.status': 'Status:',
    'voter.enable_cam': 'Enable Camera',
    'voter.verify_btn': 'Verify Identity & Login',
    'voter.processing': 'Processing...',
    // AdminLogin
    'adminlogin.title': 'Administrator Access',
    'adminlogin.subtitle': 'Provide your secure administrative credentials to access the system.',
    'adminlogin.id_label': 'Administrator ID',
    'adminlogin.id_placeholder': 'e.g. ADM-991',
    'adminlogin.login_btn': 'Secure Admin Login',
    // Admin
    'admin.title': 'System Administration',
    'admin.subtitle': 'Manage official election parameters and candidates.',
    'admin.reg_candidate': 'Register Candidate',
    'admin.cand_name': 'Candidate Full Name',
    'admin.cand_party': 'Political Party / Faction',
    'admin.add_btn': 'Add to Official Record',
    'admin.schedule': 'Election Schedule',
    'admin.start_date': 'Voting Start Date',
    'admin.end_date': 'Voting End Date',
    'admin.update_btn': 'Update Official Schedule',
    // Voting (General/Shared)
    'voting.title': 'Official Ballot',
    'voting.subtitle': 'Cast your vote securely using blockchain technology.',
    'voting.cand_name': 'Candidate Name',
    'voting.party': 'Party',
    'voting.action': 'Action',
    'voting.vote_btn': 'Vote',
    'voting.confirm': 'Confirm Vote',
  },
  hi: {
    'layout.skip_main': 'मुख्य सामग्री पर जाएं',
    'layout.screen_reader': 'स्क्रीन रीडर एक्सेस',
    'layout.sub': 'Prajatantra e-Voting Platform',
    'layout.title': 'प्रजातंत्र ई-वोटिंग प्लेटफॉर्म',
    'layout.desc': 'मल्टी-मॉडल ब्लॉकचेन-आधारित वोटिंग सिस्टम • पायलट 2026',
    'layout.btn': 'भाषाएँ ▾',
    'layout.voter_portal': 'मतदाता पोर्टल',
    'layout.admin_login': 'व्यवस्थापक लॉगिन',
    'layout.cast_vote': 'वोट डालें',
    'layout.admin': 'प्रशासन',
    'layout.logout': 'लॉग आउट',
    'voter.title': 'मतदाता प्रमाणीकरण',
    'voter.subtitle': 'आधिकारिक नागरिक पोर्टल',
    'voter.id_label': 'मतदाता पहचान संख्या',
    'voter.id_placeholder': 'जैसे VTR-84291',
    'voter.step2': 'पहचान सत्यापन (चरण 2)',
    'voter.align_face': 'कृपया अपनी पहचान सत्यापित करने के लिए फ्रेम के भीतर अपना चेहरा संरेखित करें।',
    'voter.cam_inactive': 'कैमरा निष्क्रिय',
    'voter.status': 'स्थिति:',
    'voter.enable_cam': 'कैमरा सक्षम करें',
    'voter.verify_btn': 'पहचान सत्यापित करें और लॉगिन करें',
    'voter.processing': 'प्रसंस्करण...',
    'adminlogin.title': 'व्यवस्थापक एक्सेस',
    'adminlogin.subtitle': 'सिस्टम तक पहुंचने के लिए अपने सुरक्षित व्यवस्थापक क्रेडेंशियल प्रदान करें।',
    'adminlogin.id_label': 'व्यवस्थापक आईडी',
    'adminlogin.id_placeholder': 'जैसे ADM-991',
    'adminlogin.login_btn': 'सुरक्षित व्यवस्थापक लॉगिन',
    'admin.title': 'सिस्टम प्रशासन',
    'admin.subtitle': 'आधिकारिक चुनाव मापदंडों और उम्मीदवारों का प्रबंधन करें।',
    'admin.reg_candidate': 'उम्मीदवार पंजीकृत करें',
    'admin.cand_name': 'उम्मीदवार का पूरा नाम',
    'admin.cand_party': 'राजनीतिक दल / गुट',
    'admin.add_btn': 'आधिकारिक रिकॉर्ड में जोड़ें',
    'admin.schedule': 'चुनाव कार्यक्रम',
    'admin.start_date': 'मतदान प्रारंभ तिथि',
    'admin.end_date': 'मतदान समाप्ति तिथि',
    'admin.update_btn': 'आधिकारिक कार्यक्रम अपडेट करें',
    'voting.title': 'आधिकारिक मतपत्र',
    'voting.subtitle': 'ब्लॉकचेन तकनीक का उपयोग करके सुरक्षित रूप से अपना वोट डालें।',
    'voting.cand_name': 'उम्मीदवार का नाम',
    'voting.party': 'पार्टी',
    'voting.action': 'कार्रवाई',
    'voting.vote_btn': 'वोट दें',
    'voting.confirm': 'वोट की पुष्टि करें',
  },
  kn: {
    'layout.skip_main': 'ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ',
    'layout.screen_reader': 'ಸ್ಕ್ರೀನ್ ರೀಡರ್ ಪ್ರವೇಶ',
    'layout.sub': 'Prajatantra e-Voting Platform',
    'layout.title': 'ಪ್ರಜಾತಂತ್ರ ಇ-ವೋಟಿಂಗ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    'layout.desc': 'ಮಲ್ಟಿ-ಮಾಡೆಲ್ ಬ್ಲಾಕ್‌ಚೈನ್-ಆಧಾರಿತ ಮತದಾನ ವ್ಯವಸ್ಥೆ • ಪೈಲಟ್ 2026',
    'layout.btn': 'ಭಾಷೆಗಳು ▾',
    'layout.voter_portal': 'ಮತದಾರರ ಪೋರ್ಟಲ್',
    'layout.admin_login': 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್',
    'layout.cast_vote': 'ಮತ ಚಲಾಯಿಸಿ',
    'layout.admin': 'ಆಡಳಿತ',
    'layout.logout': 'ಲಾಗ್ ಔಟ್',
    'voter.title': 'ಮತದಾರರ ದೃಢೀಕರಣ',
    'voter.subtitle': 'ಅಧಿಕೃತ ನಾಗರಿಕ ಪೋರ್ಟಲ್',
    'voter.id_label': 'ಮತದಾರರ ಗುರುತಿನ ಸಂಖ್ಯೆ',
    'voter.id_placeholder': 'ಉದಾ. VTR-84291',
    'voter.step2': 'ಗುರುತು ಪರಿಶೀಲನೆ (ಹಂತ 2)',
    'voter.align_face': 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗುರುತನ್ನು ಪರಿಶೀಲಿಸಲು ಫ್ರೇಮ್ ಒಳಗೆ ನಿಮ್ಮ ಮುಖವನ್ನು ಜೋಡಿಸಿ.',
    'voter.cam_inactive': 'ಕ್ಯಾಮೆರಾ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ',
    'voter.status': 'ಸ್ಥಿತಿ:',
    'voter.enable_cam': 'ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯಗೊಳಿಸಿ',
    'voter.verify_btn': 'ಗುರುತು ಪರಿಶೀಲಿಸಿ & ಲಾಗಿನ್ ಮಾಡಿ',
    'voter.processing': 'ಪ್ರಕ್ರಿಯೆಗೊಳ್ಳುತ್ತಿದೆ...',
    'adminlogin.title': 'ನಿರ್ವಾಹಕ ಪ್ರವೇಶ',
    'adminlogin.subtitle': 'ಸಿಸ್ಟಮ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಸುರಕ್ಷಿತ ನಿರ್ವಾಹಕ ರುಜುವಾತುಗಳನ್ನು ಒದಗಿಸಿ.',
    'adminlogin.id_label': 'ನಿರ್ವಾಹಕ ಐಡಿ',
    'adminlogin.id_placeholder': 'ಉದಾ. ADM-991',
    'adminlogin.login_btn': 'ಸುರಕ್ಷಿತ ನಿರ್ವಾಹಕ ಲಾಗಿನ್',
    'admin.title': 'ವ್ಯವಸ್ಥೆಯ ಆಡಳಿತ',
    'admin.subtitle': 'ಅಧಿಕೃತ ಚುನಾವಣಾ ನಿಯತಾಂಕಗಳನ್ನು ಮತ್ತು ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ.',
    'admin.reg_candidate': 'ಅಭ್ಯರ್ಥಿಯನ್ನು ನೋಂದಾಯಿಸಿ',
    'admin.cand_name': 'ಅಭ್ಯರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು',
    'admin.cand_party': 'ರಾಜಕೀಯ ಪಕ್ಷ / ಗುಂಪು',
    'admin.add_btn': 'ಅಧಿಕೃತ ದಾಖಲೆಗೆ ಸೇರಿಸಿ',
    'admin.schedule': 'ಚುನಾವಣಾ ವೇಳಾಪಟ್ಟಿ',
    'admin.start_date': 'ಮತದಾನ ಪ್ರಾರಂಭ ದಿನಾಂಕ',
    'admin.end_date': 'ಮತದಾನ ಮುಕ್ತಾಯ ದಿನಾಂಕ',
    'admin.update_btn': 'ಅಧಿಕೃತ ವೇಳಾಪಟ್ಟಿಯನ್ನು ನವೀಕರಿಸಿ',
    'voting.title': 'ಅಧಿಕೃತ ಮತಪತ್ರ',
    'voting.subtitle': 'ಬ್ಲಾಕ್‌ಚೈನ್ ತಂತ್ರಜ್ಞಾನವನ್ನು ಬಳಸಿ ಸುರಕ್ಷಿತವಾಗಿ ನಿಮ್ಮ ಮತ ಚಲಾಯಿಸಿ.',
    'voting.cand_name': 'ಅಭ್ಯರ್ಥಿಯ ಹೆಸರು',
    'voting.party': 'ಪಕ್ಷ',
    'voting.action': 'ಕ್ರಿಯೆ',
    'voting.vote_btn': 'ಮತ ಹಾಕಿ',
    'voting.confirm': 'ಮತ ಖಚಿತಪಡಿಸಿ',
  },
  ta: {
    'layout.skip_main': 'முக்கிய உள்ளடக்கத்திற்குச் செல்லவும்',
    'layout.screen_reader': 'ஸ்கிரீன் ரீடர் அணுகல்',
    'layout.sub': 'Prajatantra e-Voting Platform',
    'layout.title': 'பிரஜாதந்திரா இ-வோட்டிங் பிளாட்ஃபார்ம்',
    'layout.desc': 'மல்டி-மாடல் பிளாக்செயின் அடிப்படையிலான வாக்குப்பதிவு அமைப்பு • பைலட் 2026',
    'layout.btn': 'மொழிகள் ▾',
    'layout.voter_portal': 'வாக்காளர் தளம்',
    'layout.admin_login': 'நிர்வாகி உள்நுழைவு',
    'layout.cast_vote': 'வாக்களிக்கவும்',
    'layout.admin': 'நிர்வாகம்',
    'layout.logout': 'வெளியேறு',
    'voter.title': 'வாக்காளர் அங்கீகாரம்',
    'voter.subtitle': 'அதிகாரப்பூர்வ குடிமக்கள் தளம்',
    'voter.id_label': 'வாக்காளர் அடையாள எண்',
    'voter.id_placeholder': 'எ.கா. VTR-84291',
    'voter.step2': 'அடையாள சரிபார்ப்பு (படி 2)',
    'voter.align_face': 'உங்கள் அடையாளத்தை சரிபார்க்க உங்கள் முகத்தை சட்டகத்திற்குள் சீரமைக்கவும்.',
    'voter.cam_inactive': 'கேமரா செயலற்றது',
    'voter.status': 'நிலை:',
    'voter.enable_cam': 'கேமராவை இயக்கு',
    'voter.verify_btn': 'அடையாளத்தை சரிபார்த்து உள்நுழையவும்',
    'voter.processing': 'செயலாக்கப்படுகிறது...',
    'adminlogin.title': 'நிர்வாகி அணுகல்',
    'adminlogin.subtitle': 'கணினியை அணுக உங்கள் பாதுகாப்பான நிர்வாகி சான்றுகளை வழங்கவும்.',
    'adminlogin.id_label': 'நிர்வாகி ஐடி',
    'adminlogin.id_placeholder': 'எ.கா. ADM-991',
    'adminlogin.login_btn': 'பாதுகாப்பான நிர்வாகி உள்நுழைவு',
    'admin.title': 'கணினி நிர்வாகம்',
    'admin.subtitle': 'அதிகாரப்பூர்வ தேர்தல் அளவுருக்கள் மற்றும் வேட்பாளர்களை நிர்வகிக்கவும்.',
    'admin.reg_candidate': 'வேட்பாளரை பதிவு செய்யவும்',
    'admin.cand_name': 'வேட்பாளரின் முழு பெயர்',
    'admin.cand_party': 'அரசியல் கட்சி / பிரிவு',
    'admin.add_btn': 'அதிகாரப்பூர்வ பதிவில் சேர்க்கவும்',
    'admin.schedule': 'தேர்தல் அட்டவணை',
    'admin.start_date': 'வாக்குப்பதிவு தொடங்கும் தேதி',
    'admin.end_date': 'வாக்குப்பதிவு முடிவு தேதி',
    'admin.update_btn': 'அதிகாரப்பூர்வ அட்டவணையை புதுப்பிக்கவும்',
    'voting.title': 'அதிகாரப்பூர்வ வாக்குச்சீட்டு',
    'voting.subtitle': 'பிளாக்செயின் தொழில்நுட்பத்தைப் பயன்படுத்தி உங்கள் வாக்கை பாதுகாப்பாக அளிக்கவும்.',
    'voting.cand_name': 'வேட்பாளர் பெயர்',
    'voting.party': 'கட்சி',
    'voting.action': 'செயல்',
    'voting.vote_btn': 'வாக்களிக்கவும்',
    'voting.confirm': 'வாக்கை உறுதிப்படுத்தவும்',
  }
};

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');

  const t = (key: string): string => {
    return dictionary[lang]?.[key] || dictionary['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
