'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const exhibitors = [
  {
    id: 1,
    name: { TH: 'นาย ก', EN: 'Mr. A' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'Figma',
    status: 'contacted',
  },
  {
    id: 2,
    name: { TH: 'นาย ข', EN: 'Mr. B' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'XD',
    status: 'pending',
  },
  {
    id: 3,
    name: { TH: 'นาย ค', EN: 'Mr. C' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'Sketch',
    status: 'contacted',
  },
  {
    id: 4,
    name: { TH: 'นาย ง', EN: 'Mr. D' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'XD',
    status: 'pending',
  },
  {
    id: 5,
    name: { TH: 'นาย จ', EN: 'Mr. E' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'Figma',
    status: 'contacted',
  },
  {
    id: 6,
    name: { TH: 'นาย ฉ', EN: 'Mr. F' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'Sketch',
    status: 'pending',
  },
  {
    id: 7,
    name: { TH: 'นาย ช', EN: 'Mr. G' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'Figma',
    status: 'contacted',
  },
  {
    id: 8,
    name: { TH: 'นาย ซ', EN: 'Mr. H' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'XD',
    status: 'pending',
  },
  {
    id: 9,
    name: { TH: 'นาย ฌ', EN: 'Mr. I' },
    productType: { TH: 'ประเภทผลิตภัณฑ์', EN: 'Product Type' },
    platform: 'Figma',
    status: 'pending',
  },
];

const sidebarItems = ['Dashboard', 'Profile'];

const problemCards = [
  { key: 'webBuild', values: { TH: 'ปัญหาการสร้างเว็บไซต์', EN: 'Website issues' }, value: 36 },
  { key: 'design', values: { TH: 'ปัญหาออกแบบ', EN: 'Design issues' }, value: 28 },
  { key: 'data', values: { TH: 'ปัญหาการจัดการข้อมูล', EN: 'Data issues' }, value: 8 },
  { key: 'userAccess', values: { TH: 'ปัญหาการเข้าถึงผู้ใช้', EN: 'User access issues' }, value: 8 },
  { key: 'issue1', values: { TH: 'ปัญหาการ1', EN: 'Issue 1' }, value: 6 },
  { key: 'issue2', values: { TH: 'ปัญหาการ2', EN: 'Issue 2' }, value: 6 },
  { key: 'issue3', values: { TH: 'ปัญหาการ2', EN: 'Issue 3' }, value: 6 },
];

const translations = {
  TH: {
    languageButton: 'Language',
    logout: 'ออกจากระบบ',
    dashboardTitle: 'แดชบอร์ด',
    listTitle: 'รายชื่อ',
    typeLabel: 'ประเภท',
    typeButton: 'ประเภท',
    exportLabel: 'Export',
    statsTitle: 'สถิติ์ปัญหา',
    problemsTitle: 'ปัญหาทั้งหมด',
    statuses: { contacted: 'ติดต่อแล้ว', pending: 'ยังไม่ได้ติดต่อ' },
    productTypeLabel: 'ประเภทผลิตภัณฑ์',
    cards: [
      { title: 'ผู้เข้าชม', value: '98k' },
      { title: 'ผู้แสดงสินค้า', value: '15.3k' },
    ],
    languageOptions: { TH: 'TH', EN: 'EN' },
  },
  EN: {
    languageButton: 'Language',
    logout: 'Logout',
    dashboardTitle: 'Dashboard',
    listTitle: 'List',
    typeLabel: 'Type',
    typeButton: 'Type',
    exportLabel: 'Export',
    statsTitle: 'Problem Statistics',
    problemsTitle: 'All Problems',
    statuses: { contacted: 'Contacted', pending: 'Pending' },
    productTypeLabel: 'Product Type',
    cards: [
      { title: 'Visitors', value: '98k' },
      { title: 'Exhibitors', value: '15.3k' },
    ],
    languageOptions: { TH: 'TH', EN: 'EN' },
  },
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('TH');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'owner') {
      setIsAuthorized(true);
    } else {
      router.replace('/login');
    }
    setIsChecking(false);
  }, [router]);

  const platformStats = useMemo(() => {
    const map = new Map();
    exhibitors.forEach((ex) => {
      map.set(ex.platform, (map.get(ex.platform) || 0) + 1);
    });
    const total = exhibitors.length;
    let start = 0;
    const segments = Array.from(map.entries()).map(([platform, value], idx) => {
      const percent = (value / total) * 100;
      const color = ['#8c7ae6', '#ffb8b8', '#7ed6df'][idx % 3];
      const segment = { platform, value, percent, color, start, end: start + percent };
      start += percent;
      return segment;
    });
    return { total, segments };
  }, []);

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
  const totalUnit = language === 'TH' ? 'รายการ' : 'items';
  const countUnit = language === 'TH' ? 'ราย' : 'entries';

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

  const pieBackground = `conic-gradient(${platformStats.segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(', ')})`;

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
                  item === 'Dashboard' ? 'bg-[#b0b0b0] font-semibold' : 'hover:bg-[#bdbdbd]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto px-4 space-y-3 pb-4 language-menu">
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
            className="w-full px-4 py-2 bg-white rounded-full shadow text-sm text-gray-700 hover:bg-gray-100 transition"
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

      {/* Main Content */}
      <div className="flex-1 px-8 py-10 overflow-y-auto h-full space-y-8">
        <div className="bg-white rounded-3xl shadow p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <h1 className="text-4xl font-extrabold text-gray-900">{t.dashboardTitle}</h1>
            <button className="self-start lg:self-auto px-5 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 shadow hover:bg-gray-50 transition">
              {t.exportLabel}
            </button>
          </div>
          <div className="mt-10 flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64">
                <div className="w-full h-full rounded-full" style={{ background: pieBackground }} />
                <div className="absolute inset-[22%] bg-white rounded-full flex flex-col items-center justify-center text-xs font-semibold text-gray-600">
                  <span className="text-lg text-gray-900">{platformStats.total}</span>
                  <span>{totalUnit}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-y-4 text-sm text-gray-700">
              {platformStats.segments.map((seg) => (
                <div key={seg.platform} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3 font-semibold text-gray-900">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.platform}
                  </div>
                  <span className="text-gray-600">
                    {seg.value} {countUnit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-[#f8f8fa] rounded-3xl shadow border border-gray-200">
          <div className="px-8 py-6 border-b border-gray-400 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{t.listTitle}</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2 bg-[#7f6ab6] text-white rounded-full text-sm shadow">
              {t.typeButton}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div>
            {exhibitors.map((ex, idx) => (
              <div
                key={ex.id}
                className={`px-8 py-5 flex items-center justify-between gap-4 ${
                  idx !== exhibitors.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-300" />
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{ex.name[language]}</div>
                    <div className="text-sm text-gray-600">{ex.productType[language]}</div>
                  </div>
                </div>
                <button
                  className={`px-5 py-2 rounded-full text-xs font-semibold ${
                    ex.status === 'contacted'
                      ? 'bg-white border border-gray-300 text-gray-700'
                      : 'bg-[#e8e8e8] border border-gray-300 text-gray-500'
                  }`}
                >
                  {t.statuses[ex.status]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

