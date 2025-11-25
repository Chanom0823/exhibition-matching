'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const featuredExhibitors = [
  { id: 1, name: 'ร้าน A', category: 'ประเภทผลิตภัณฑ์' },
  { id: 2, name: 'ร้าน B', category: 'ประเภทผลิตภัณฑ์' },
  { id: 3, name: 'ร้าน C', category: 'ประเภทผลิตภัณฑ์' },
];

const listExhibitors = Array.from({ length: 7 }).map((_, idx) => ({
  id: idx + 1,
  name: 'ร้าน C',
  category: 'ประเภทผลิตภัณฑ์',
}));

const filters = ['all', 'problem', 'favourite'];

export default function RelatedExhibitorsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex justify-center relative">
      {/* Burger Menu Button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="menu-container absolute top-4 right-4 z-50 p-2 bg-[#3b3b3b] text-white rounded-lg hover:bg-[#505050] transition"
        aria-label="เมนู"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div className="menu-container absolute top-16 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[150px] overflow-hidden">
          <button
            type="button"
            onClick={() => {
              router.push('/login');
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      )}

      <div className="w-full max-w-[900px] px-4 py-8 md:py-12 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Related Exhibitors
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            ผู้แสดงสินค้าที่ตรงกับปัญหาของคุณมากที่สุด
          </p>
        </div>

        {/* Featured Exhibitors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featuredExhibitors.map((ex) => (
            <div
              key={ex.id}
              className="flex flex-col items-center bg-white rounded-2xl shadow-sm py-6"
            >
              <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
              <p className="font-semibold text-lg text-gray-900">{ex.name}</p>
              <p className="text-sm text-gray-600">{ex.category}</p>
              <button className="mt-3 px-4 py-1 border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-gray-100 transition">
                Contact
              </button>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="flex">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 py-2 text-sm capitalize border-r border-gray-300 last:border-r-0 transition ${
                  activeFilter === filter
                    ? 'bg-[#505050] text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
            <div className="px-4 py-2 text-sm font-semibold border-l border-gray-300 w-40 text-center text-gray-900">
              ช่องทางติดต่อ
            </div>
          </div>
        </div>

        {/* Exhibitor List */}
        <div className="space-y-2">
          {listExhibitors.map((ex) => (
            <div
              key={ex.id}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">{ex.name}</p>
                  <p className="text-sm text-gray-600">{ex.category}</p>
                </div>
              </div>
              <button className="px-4 py-1 border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-gray-100 transition">
                Contact
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

