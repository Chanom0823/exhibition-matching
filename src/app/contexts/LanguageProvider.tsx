'use client'

import { createContext,  useContext,  useState } from "react"

type languageType = {
  language?: string;
  toggleLanguage? : (value : string) => void;
}

export const languageContext = createContext<languageType | undefined>(undefined);

export default function LanguageProvider({children,
}:{
  children: React.ReactNode
}){
  const [language, setLanguage] = useState('JP')

  const toggleLanguage =(value : string)=>{
    setLanguage(value)
  }

  return(
    <languageContext.Provider value={{language, toggleLanguage}}>
      {children}
    </languageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(languageContext);
  if (!context) throw new Error("useLanguage ต้องใช้ภายใน LanguageProvider");
  return context;
};