'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const sidebarItems = ['Dashboard', 'Profile'];

const problemOptions = [
  { value: 'cost', label: { TH: 'ต้นทุน/ค่าใช้จ่าย', EN: 'Cost / Expense' } },
  { value: 'process', label: { TH: 'กระบวนการทำงาน', EN: 'Process' } },
  { value: 'marketing', label: { TH: 'การตลาด/ลูกค้า', EN: 'Marketing / Customer' } },
  { value: 'tech', label: { TH: 'เทคโนโลยี/ระบบ', EN: 'Technology / System' } },
  { value: 'other', label: { TH: 'อื่น ๆ', EN: 'Others' } },
];

const translations = {
  TH: {
    languageButton: 'Language',
    logout: 'ออกจากระบบ',
    header: 'โปรไฟล์',
    save: 'บันทึก',
    upload: 'อัปโหลดโลโก้',
    fields: {
      companyLabel: 'ชื่อบริษัท',
      companyPlaceholder: 'กรุณากรอกชื่อบริษัทของคุณ',
      contactLabel: 'เบอร์โทร / อีเมล',
      contactPlaceholder: 'กรุณากรอก email หรือเบอร์โทรศัพท์',
      urlLabel: 'URL/Email',
      urlPlaceholder: 'กรุณากรอก URL หรือ Email',
      problemLabel: 'เลือกปัญหาของคุณ',
      problemPlaceholder: 'กรุณาเลือกปัญหา',
    },
    languageOptions: { TH: 'TH', EN: 'EN' },
  },
  EN: {
    languageButton: 'Language',
    logout: 'Logout',
    header: 'Profile',
    save: 'Save',
    upload: 'Upload Logo',
    fields: {
      companyLabel: 'Company Name',
      companyPlaceholder: 'Please enter your company name',
      contactLabel: 'Number / Email',
      contactPlaceholder: 'Please enter email or phone number',
      urlLabel: 'URL/Email',
      urlPlaceholder: 'Please enter URL or email',
      problemLabel: 'Select your problem',
      problemPlaceholder: 'Please select a problem',
    },
    languageOptions: { TH: 'TH', EN: 'EN' },
  },
};

export default function OwnerProfilePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('TH');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef(null);

  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [url, setUrl] = useState('');
  const [problem, setProblem] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'owner') {
      setIsAuthorized(true);
    } else {
      router.replace('/login');
    }
    setIsChecking(false);
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ company, contact, url, problem });
    alert('บันทึกข้อมูลเรียบร้อย (ตัวอย่าง)');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLanguageOpen && languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageOpen]);

  const t = translations[language];

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6] text-gray-600">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="h-screen bg-[#f1f1f1] relative flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-44 bg-[#c4c4c4] flex flex-col justify-between h-full sticky top-0">
        <div className="pt-10 px-4 flex flex-col items-center space-y-6">
          <img src="/logo.svg" alt="Logo" className="w-20 h-20" />
          <div className="w-full space-y-2 text-sm">
            {sidebarItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === 'Dashboard') router.push('/owner-dashboard');
                  if (item === 'Profile') router.push('/owner-profile');
                }}
                className={`block w-full text-left px-4 py-3 border-y border-gray-500 ${
                  item === 'Profile' ? 'bg-[#b0b0b0] font-semibold' : 'hover:bg-[#bdbdbd]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto px-4 space-y-3 pb-4 language-menu" ref={languageRef}>
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen((prev) => !prev)}
              className="w-full px-4 py-2 bg-white rounded-full shadow text-sm text-gray-700 hover:bg-gray-100 transition flex items-center justify-between"
            >
              {t.languageButton}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isLanguageOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setLanguage('TH');
                    setIsLanguageOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t.languageOptions.TH}
                </button>
                <button
                  onClick={() => {
                    setLanguage('EN');
                    setIsLanguageOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                >
                  {t.languageOptions.EN}
                </button>
              </div>
            )}
          </div>
          <button
            className="w-full px-4 py-2 bg-white rounded-full shadow text-sm text-gray-700 hover	bg-gray-100 transition"
            onClick={() => {
              localStorage.removeItem('isLoggedIn');
              localStorage.removeItem('username');
              localStorage.removeItem('userId');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userRole');
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 px-8 py-10 overflow-y-auto h-full">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">{t.header}</h1>
          <button
            className="px-4 py-2 bg-white rounded-full shadow text-sm text-gray-700 hover:bg-gray-100 transition"
            onClick={handleSubmit}
          >
            {t.save}
          </button>
        </header>

        <div className="bg-white rounded-3xl shadow p-8 max-w-3xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 rounded-full bg-gray-200 mb-4" />
            <button className="px-4 py-1 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition">
              {t.upload}
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t.fields.companyLabel}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t.fields.companyPlaceholder}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#7f6ab6]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t.fields.contactLabel}
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t.fields.contactPlaceholder}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#7f6ab6]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t.fields.urlLabel}
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.fields.urlPlaceholder}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#7f6ab6]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t.fields.problemLabel}
              </label>
              <select
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#7f6ab6]"
              >
                <option value="">{t.fields.problemPlaceholder}</option>
                {problemOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label[language]}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

