import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageProvider';
import translations from './translations';

const navbar = [
  { name: 'Dashboard', pathName: '/exhibitor-dashboard', url:'/dashboard.png', alt:'dashboard.png' },
  { name: 'Profile', pathName: '/exhibitor-profile', url:'/user.png', alt:'user.png' },
]

const ExhibitorSidebar = () => {
  const pathName = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {language, toggleLanguage} = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const t = translations[selectedLanguage.code];
  
    useEffect(()=>{
      setSelectedLanguage(language);
    }, [language])
  return (
    <>
      {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
    <aside
      className={`fixed   md:static inset-y-0 left-0 z-50 md:z-auto w-[250px] bg-white border-r border-gray-200 flex-col transform transition-transform  translate-x-0
       ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:flex`}
    >
      {/* Logo */}
      <div className="px-4 py-4 items-center justify-center flex">
        <Image src="/logo.svg" alt="alt design office" width={110} height={60} priority />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-2">
          {navbar.map((value, key) => {
            return (
              <Link
                key={key}
                href={value.pathName}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition 
                  ${pathName ===  value.pathName ? 'bg-gray-100 text-gray-600 font-medium bg-'
                  : 'text-gray-600 hover:bg-gray-100' } 
                  }`}
              >
                <Image
                      src={value.url}
                      alt={value.alt}
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />

                {value.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
    
    </>
  )
}

export default ExhibitorSidebar;