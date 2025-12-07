import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageProvider';
import translations from './translations';
import { useRouter } from 'next/navigation';

type LanguageOption = {
  code: string;   // 'TH' | 'JP'
  label: string;  // ภาษาไทย / 日本語
};
type MainNavbarProps = {
  languageOptions?: LanguageOption[];
  selectedLanguage: LanguageOption;
  onLanguageSelect: (option: LanguageOption) => void;
  loginLabel: string; // เช่น t.loginCta
};

const TranslationSelection = () => {
    const languageOptions = [
      { code: 'TH', label: 'ภาษาไทย' },
      { code: 'JP', label: '日本語' },
    ];
    const {language, toggleLanguage} = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const t = translations[selectedLanguage.code];
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [showPdpaModal, setShowPdpaModal] = useState(false);
    const [isPdpaAccepted, setIsPdpaAccepted] = useState(false);
  
  
    // Check PDPA acceptance for exhibitor
    useEffect(() => {
      if (typeof window === 'undefined') return;
  
      // Check if user is logged in as exhibitor
      const userRole = localStorage.getItem('userRole');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
      if (!isLoggedIn || userRole !== 'exhibitor') {
        // Not logged in or not an exhibitor, don't show modal
        setShowPdpaModal(false);
        return;
      }
  
      // Check if exhibitor has accepted PDPA for dashboard
      const exhibitorAccepted = localStorage.getItem('exhibitorPdpaAccepted') === 'true';
  
      if (exhibitorAccepted) {
        setIsPdpaAccepted(true);
        setShowPdpaModal(false);
      } else {
        setIsPdpaAccepted(false);
        setShowPdpaModal(true);
      }
    }, []);
  
    const handleLanguageSelect = (option) => {
      setSelectedLanguage(option);
      toggleLanguage(option);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguage', option.code);
      }
      setIsLanguageOpen(false);
    }

    useEffect(()=>{
      setSelectedLanguage(language);
    }, [language])
  return (
    <div className='h-full'>
      <button
        type="button"
        className="bg-gray-800 text-white rounded-lg w-[68px] h-full md:w-20  text-sm md:text-base flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
        onClick={() => setIsLanguageOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isLanguageOpen}
      >
        {selectedLanguage.code}{' '}
        <svg width="12" height="8" fill="none" viewBox="0 0 12 8">
          <path
            d="M1 1l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isLanguageOpen && (
        <ul
          className="absolute mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
          role="listbox"
        >
          {languageOptions.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${selectedLanguage.code === option.code
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleLanguageSelect(option)}
              >
                <span>{option.label}</span>
                <span className="font-semibold">{option.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


export default TranslationSelection