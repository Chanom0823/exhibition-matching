'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageProvider';
import translations from './translations';

type Props = {
  t: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectedLanguage: any;
};

// 1. สร้าง Config สำหรับเมนูทั้งหมดไว้ที่เดียว (ดูง่าย แก้ข่าย)
const MENU_CONFIG = [
  { key: 'Dashboard', icon: '/dashboard.png', path: '/admin-dashboard' },
  { key: 'UserManagement', icon: '/user.png', path: '/admin-dashboard/user-management' },
  { key: 'VisitorMatching', icon: '/visitor.png', path: '/admin-dashboard/visitor-matching' },
  { key: 'ExhibitorMatching', icon: '/exbihitor.png', path: '/admin-dashboard/exhibitor-matching' },
  { key: 'ProblemTagManagement', icon: '/file.png', path: '/admin-dashboard/problem-tag-management' },
  { key: 'UserSessions', icon: '/time.png', path: '/admin-dashboard/user-sessions' },
];

export default function Sidebar({ setActiveTab, isSidebarOpen }: Props) {
  const router = useRouter();
  const pathName = usePathname();
  const handleMenuClick = (key: string, path: string) => {
    setActiveTab(key);
    if (path) {
      router.push(path);
    }
  };
  const {language, toggleLanguage} = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const t = translations[selectedLanguage.code];
  
    useEffect(()=>{
      setSelectedLanguage(language);
    }, [language])

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-xs bg-white border-r border-gray-200 flex-col transform transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } md:flex`}
    >
      {/* Logo */}
      <div className="px-4 py-4 items-center justify-center flex">
        <Image src="/logo.svg" alt="alt design office" width={110} height={60} priority />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-2">
          {/* ใช้ MENU_CONFIG เป็นหลักในการวนลูป */}
          {MENU_CONFIG.map((menu, idx) => {
            // ดึงชื่อแท็บจาก translation โดยใช้ index
            // (ต้องมั่นใจว่าลำดับใน t.tabs ตรงกับ MENU_CONFIG นะ)
            const tabName = menu.icon || menu.key; 

            return (
              <Link
                key={menu.key}
                href={menu.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                  pathName === menu.path
                    ? 'bg-gray-100 text-gray-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Image 
                  src={menu.icon} 
                  alt={tabName} 
                  width={24} 
                  height={24} 
                  className="w-6 h-6" 
                />
                {menu.key}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}