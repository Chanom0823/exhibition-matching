"use client";

import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MainNavbar from './components/MainNavbar';
import ActionCaredProvider from './contexts/action-cared';
import LanguageProvider from './contexts/LanguageProvider';
import PDPAProvider from './contexts/pdpa';
import '@/styles/globals.css'
import { usePathname } from 'next/navigation';

const languageOptions = [
  { code: 'TH', label: 'ภาษาไทย' },
  { code: 'JP', label: '日本語' },
];

const defaultTranslations = {
  TH: { welcome: 'ยินดีต้อนรับ' },
  JP: { welcome: 'ようこそ' }
};


export default function ClientLayout({ children, promptClassName, sawarabiClassName }) {
  // 1. ย้าย State มาไว้ที่นี่

  
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [translations, setTranslations] = useState(defaultTranslations);
  const [isLoading, setIsLoading] = useState(true);
  const languageDropdownRef = useRef(null);
  const pathName = usePathname();
  const [path, setPath] = useState(pathName);

  // 2. Logic การเลือก Font
  const currentFontClass = selectedLanguage.code === 'JP' ? sawarabiClassName : promptClassName;

  // ตัวแปร t สำหรับใช้งาน (เช็คว่ามีภาษานั้นไหม ถ้าไม่มีใช้ TH)
  const t = translations[selectedLanguage.code] || translations.TH || {};

  // 3. ย้าย useEffect ทั้งหมดมาที่นี่
  useEffect(() => {
    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
    if (storedLanguage) {
      const foundOption = languageOptions.find((option) => option.code === storedLanguage);
      if (foundOption) setSelectedLanguage(foundOption);
    }

    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadHomepageContent = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'homepageContent', 'main');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.content) {
            setTranslations((prev) => ({
              TH: { ...prev.TH, ...(data.content.TH || {}) },
              JP: { ...prev.JP, ...(data.content.JP || {}) },
            }));
          }
        }
      } catch (error) {
        console.error('Error loading homepage content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomepageContent();
  }, []);

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  useEffect(()=>{
    setPath(pathName);
  }, [pathName])
  return (

    <html>
      <body>
        <LanguageProvider>
          <ActionCaredProvider>
            <PDPAProvider>
              <div 
                className={`
                  min-h-screen  bg-white flex  items-center justify-center
                  ${path === '/' || path === '/user-panel' || path === '/usermatching' ? 'flex-col' : 'flex-row'}  
                  ${currentFontClass}
                  `}>
                <MainNavbar
                  languageOptions={languageOptions}
                  selectedLanguage={selectedLanguage}
                  onLanguageSelect={handleLanguageSelect}
                  loginLabel={t.loginCta}
                />
                <div className="w-full max-w-[390px] md:max-w-full h-[844px] md:h-screen bg-white flex flex-col relative">
                  {children}
                </div>
              </div>
            </PDPAProvider>
          </ActionCaredProvider>
        </LanguageProvider>
      </body>
    </html>

  );
}