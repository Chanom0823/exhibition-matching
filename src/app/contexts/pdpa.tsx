'use client'
 
import { createContext, useContext, useEffect, useState } from 'react'

type PDPAContextType = {
  isAccepted: boolean; // true = ทำ, false = ไม่ทำ
  toggleConsent: (status: boolean) => void;
};

export const PDPAContext = createContext<PDPAContextType | undefined>(undefined);
 
export default function PDPAProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAccepted, setIsAccepted] = useState(false);


  const toggleConsent = (status: boolean) => {
    setIsAccepted(status);
  };
  return <PDPAContext.Provider  value={{ isAccepted, toggleConsent }}>{children}</PDPAContext.Provider>
}

export const useConsent = () => {
  const context = useContext(PDPAContext);
  if (!context) throw new Error("useConsent ต้องใช้ภายใน ConsentProvider");
  return context;
};





