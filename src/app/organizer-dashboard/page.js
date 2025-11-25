'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const sidebarItems = ['Dashboard', 'Exhibitor'];

const problems = [
  { key: 'webBuild', title: { TH: 'ปัญหาการสร้างเว็บไซต์', EN: 'Website issues' }, value: 36 },
  { key: 'design', title: { TH: 'ปัญหาออกแบบ', EN: 'Design issues' }, value: 28 },
  { key: 'data', title: { TH: 'ปัญหาการจัดการข้อมูล', EN: 'Data issues' }, value: 8 },
  { key: 'user', title: { TH: 'ปัญหาการเข้าถึงผู้ใช้', EN: 'User access issues' }, value: 8 },
  { key: 'issue1', title: { TH: 'ปัญหาการ1', EN: 'Issue 1' }, value: 6 },
  { key: 'issue2', title: { TH: 'ปัญหาการ2', EN: 'Issue 2' }, value: 6 },
  { key: 'issue3', title: { TH: 'ปัญหาการ2', EN: 'Issue 3' }, value: 6 },
];

const pieSegments = [
  { label: 'web', color: '#8c7ae6', value: 190.66 },
  { label: 'Design', color: '#ffb8b8', value: 243.68 },
  { label: 'Data', color: '#7ed6df', value: 188.18 },
  { label: 'User', color: '#f9c56a', value: 246.97 },
];

const translations = {
  TH: {
    languageButton: 'Language',
    languageOptions: { TH: 'TH', EN: 'EN' },
    dashboardTitle: 'แดชบอร์ด',
    summaryTitle: 'จำนวนทั้งหมด',
    exhibitorLabel: 'ผู้แสดงสินค้า',
    visitorLabel: 'ผู้เข้าชม',
    export: 'ส่งออก',
    chartLegend: 'ปี 2020',
    statsCardTitle: 'สถิติ',
    chartTitle: 'กราฟเปรียบเทียบ',
    problemStatsTitle: 'สถิติปัญหา',
    allProblemsTitle: 'ปัญหาทั้งหมด',
    manageTitle: 'จัดการรายชื่อผู้แสดงสินค้า',
    tableTitle: 'ตารางรายชื่อ Exhibitor',
    columnCompany: 'ชื่อบริษัท',
    columnNumber: 'หมายเลข',
    columnContact: 'URL/อีเมล',
    columnIssue: 'ปัญหา',
    editLabel: 'แก้ไข',
    deleteLabel: 'ลบ',
  },
  EN: {
    languageButton: 'Language',
    languageOptions: { TH: 'TH', EN: 'EN' },
    dashboardTitle: 'Dashboard',
    summaryTitle: 'Total',
    exhibitorLabel: 'Exhibitor',
    visitorLabel: 'Visitor',
    export: 'Export',
    chartLegend: '2020',
    statsCardTitle: 'Statistics',
    chartTitle: 'Comparison Chart',
    problemStatsTitle: 'Problem Statistics',
    allProblemsTitle: 'All Problems',
    manageTitle: 'Manage Exhibitor',
    tableTitle: 'Exhibitor List',
    columnCompany: 'Company',
    columnNumber: 'Number',
    columnContact: 'URL/Email',
    columnIssue: 'Issue',
    editLabel: 'Edit',
    deleteLabel: 'Delete',
  },
};

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('TH');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef(null);
  const activeTab = searchParams?.get('tab') === 'exhibitor' ? 'Exhibitor' : 'Dashboard';

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'organizer') {
      setIsAuthorized(true);
    } else {
      router.replace('/login');
    }
    setIsChecking(false);
  }, [router]);

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
  const summaryStats = [
    { key: 'visitor', label: t.visitorLabel, value: 98 },
    { key: 'exhibitor', label: t.exhibitorLabel, value: 18 },
  ];
  const maxSummaryValue = Math.max(...summaryStats.map((stat) => stat.value)) || 1;
  const exhibitorRows = [
    {
      company: { TH: 'บริษัท อัลฟ่า จำกัด', EN: 'Alpha Co., Ltd.' },
      number: '099-123-4567',
      contact: 'hello@alpha.co',
      issue: { TH: 'ต้องการทีมดีไซน์', EN: 'Needs design team' },
    },
    {
      company: { TH: 'บริษัท บีต้า เทค', EN: 'Beta Tech' },
      number: '081-555-2345',
      contact: 'www.betatech.com',
      issue: { TH: 'ระบบหลังบ้านช้า', EN: 'Slow back-office' },
    },
    {
      company: { TH: 'บริษัท ซี ดีไซน์', EN: 'C Design' },
      number: '02-345-6789',
      contact: 'contact@cdesign.io',
      issue: { TH: 'ต้องการนักการตลาด', EN: 'Needs marketing' },
    },
    {
      company: { TH: 'บริษัท ดีจิตอล', EN: 'Digital Studio' },
      number: '086-333-2222',
      contact: 'digitalstudio.co',
      issue: { TH: 'ออกแบบ UX', EN: 'UX redesign' },
    },
    {
      company: { TH: 'บริษัท อีโค่ โซลูชั่น', EN: 'Eco Solution' },
      number: '091-777-8888',
      contact: 'eco@solution.com',
      issue: { TH: 'ต้องการระบบ CRM', EN: 'Needs CRM' },
    },
  ];

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

  const pieBackground = `conic-gradient(${pieSegments
    .map((seg, idx) => {
      const start = pieSegments.slice(0, idx).reduce((acc, cur) => acc + cur.value, 0);
      const total = pieSegments.reduce((acc, cur) => acc + cur.value, 0);
      const end = start + seg.value;
      const startPercent = (start / total) * 100;
      const endPercent = (end / total) * 100;
      return `${seg.color} ${startPercent}% ${endPercent}%`;
    })
    .join(', ')})`;

  return (
    <div className="h-screen bg-[#f1f1f1] flex overflow-hidden">
      <aside className="w-44 bg-[#c4c4c4] flex flex-col justify-between h-full sticky top-0">
        <div className="pt-10 px-4 flex flex-col items-center space-y-6">
          <img src="/logo.svg" alt="Logo" className="w-20 h-20 object-contain" />
          <div className="w-full space-y-2 text-sm">
            {sidebarItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === 'Dashboard') {
                    router.push('/organizer-dashboard');
                  } else {
                    router.push('/organizer-dashboard?tab=exhibitor');
                  }
                }}
                className={`block w-full text-left px-4 py-3 border-y border-gray-500 ${
                  activeTab === item ? 'bg-[#b0b0b0] font-semibold text-white' : 'text-white hover:bg-[#bdbdbd]'
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

      <div className="flex-1 px-8 py-10 space-y-8 overflow-y-auto">
        {activeTab === 'Exhibitor' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow p-8 flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <h1 className="text-4xl font-extrabold text-gray-900">{t.manageTitle}</h1>
                <button className="self-start lg:self-auto px-5 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 shadow hover:bg-gray-50 transition">
                  {t.export}
                </button>
              </div>
              <p className="text-lg font-semibold text-gray-900">{t.tableTitle}</p>
              <p className="text-sm text-gray-500">
                (Table view temporarily removed based on latest request.)
              </p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-gray-900">{t.dashboardTitle}</h1>
            </header>

            <section className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-4 text-gray-800">
                <p className="text-xl font-semibold">{t.summaryTitle}</p>
                {summaryStats.map((stat) => (
                  <div key={stat.key} className="flex items-baseline gap-2 text-lg">
                    <span className="font-semibold">{stat.label}</span>
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                ))}
                <div className="pt-4">
                  <button className="px-4 py-2 bg-white rounded-full shadow text-sm text-gray-700 hover:bg-gray-100 transition">
                    {t.export}
                  </button>
                </div>
              </div>
              <div className="flex-[2] bg-white rounded-3xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-gray-800">{t.chartTitle}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#a998ff]" />
                    <span>{t.chartLegend}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {summaryStats.map((stat) => (
                    <div key={`bar-${stat.key}`} className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{stat.label}</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="h-6 bg-[#f0f0f5] rounded-full relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-[#bba9ff]"
                          style={{ width: `${(stat.value / maxSummaryValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">{t.statsCardTitle}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>{t.visitorLabel}</span>
                    <span>98k</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>{t.exhibitorLabel}</span>
                    <span>15.3k</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">{t.chartTitle}</h2>
                <div className="flex justify-center">
                  <div className="w-40 h-40 rounded-full" style={{ background: pieBackground }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {pieSegments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span>{seg.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#d9d9d9] rounded-3xl shadow p-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">{t.problemStatsTitle}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {problems.slice(0, 4).map((problem) => (
                  <div key={problem.key} className="bg-white rounded-2xl p-4">
                    <p className="text-sm text-gray-600">{problem.title[language]}</p>
                    <p className="text-2xl font-bold text-gray-900">{problem.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">{t.allProblemsTitle}</h3>
                <div className="divide-y divide-gray-200">
                  {problems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 text-sm text-gray-700">
                      <span>{item.title[language]}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

