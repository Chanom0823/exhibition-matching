'use client'
 
import { createContext, useContext, useState } from 'react'

type ActionCaredType = {
  isActionCared: boolean; // true = ทำ, false = ไม่ทำ
  toggleActionCared: (status: boolean) => void;
};

export const ActionCared = createContext<ActionCaredType  | undefined>(undefined);
 
export default function ActionCaredProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isActionCared, setIsActionCared] = useState(false);

  const toggleActionCared = (status: boolean) => {
    setIsActionCared(status);
  };

  return (
    <ActionCared.Provider value={{ isActionCared, toggleActionCared }}>
      {children}
    </ActionCared.Provider>
  );
}

export const useActionCared = () => {
  const context = useContext(ActionCared);
  if (!context) throw new Error("useActionCared ต้องใช้ภายใน ActionCaredProvider");
  return context;
};