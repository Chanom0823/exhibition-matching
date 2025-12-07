'use client'

import { createContext, useContext, useState } from "react"

export type LanguageOption = {
  code: string;
  label: string;
}

type LanguageContextType = {
  language: LanguageOption; 
  toggleLanguage: (value: LanguageOption) => void;
}

export const languageContext = createContext<LanguageContextType | undefined>(undefined);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageOption>({ code: 'JP', label: '日本語' });

  const toggleLanguage = (value: LanguageOption) => {
    setLanguage(value);
  }

  return(
    <languageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </languageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(languageContext);
  if (!context) {
    throw new Error("useLanguage ต้องใช้ภายใน LanguageProvider");
  }
  return context;
};