'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Props = {
  t: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectedLanguage: any;
};

export default function Sidebar({ t, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, selectedLanguage }: Props) {
  const router = useRouter();

  const getIcon = (index: number, tab: string) => {
    if (index === 0) {
      return (
        <Image src="/dashboard.png" alt={tab} width={24} height={24} className="w-6 h-6" />
      );
    }
    if (index === 1) {
      return (
        <Image src="/user.png" alt={tab} width={24} height={24} className="w-6 h-6" />
      );
    }
    if (index === 2) {
      return (
        <Image src="/file.png" alt={tab} width={24} height={24} className="w-6 h-6" />
      );
    }
    if (index === 3) {
      return (
        <Image src="/time.png" alt={tab} width={24} height={24} className="w-6 h-6" />
      );
    }
    if (index === 4) {
      return (
        <Image src="/home.png" alt={tab} width={24} height={24} className="w-6 h-6" />
      );
    }
    if (index === 5) {
      return (
        <Image src="/verify.png" alt={tab} width={24} height={24} className="w-6 h-6" />
      );
    }
    return null;
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[250px] bg-white border-r border-gray-200 flex-col transform transition-transform ${
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
          {t.tabs.map((tab: string, idx: number) => {
            const tabKeys = ['dashboard', 'userManagement', 'problemTagManagement', 'userSessions'];
            const targetTab = tabKeys[idx] || 'dashboard';

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(targetTab);
                  if (targetTab === 'userManagement') {
                    router.push('/admin-dashboard/user-management');
                  } else if (targetTab === 'problemTagManagement') {
                    router.push('/admin-dashboard/problem-tag-management');
                  } else if (targetTab === 'userSessions') {
                    router.push('/admin-dashboard/user-sessions');
                  } else if (targetTab === 'pdpaManagement') {
                    router.push('/admin-dashboard/pdpa-management');
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                  activeTab === targetTab
                    ? 'bg-gray-100 text-gray-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {getIcon(idx, tab)}
                {tab}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
