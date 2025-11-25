'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RequiredFieldsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [problem, setProblem] = useState('');
  const [pdpa, setPdpa] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!pdpa) {
      alert('กรุณายินยอมให้ใช้ข้อมูลส่วนบุคคลก่อนส่งแบบฟอร์ม');
      return;
    }

    // ตอนนี้แค่ลอง log ข้อมูลดู
    console.log({
      fullName,
      company,
      contact,
      problem,
      pdpa,
    });

    alert('ส่งข้อมูลเรียบร้อย (ตอนนี้ยังไม่ได้เชื่อม Firebase นะ)');
    router.push('/related-exhibitors');
  };

  // ปิดเมนูเมื่อคลิกข้างนอก
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
      <div className="required-fields-page">
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
                // ลบข้อมูล login
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                localStorage.removeItem('userId');
                localStorage.removeItem('userEmail');
                // ไปหน้า login
                router.push('/login');
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        )}

        <div className="required-fields-container">
          <h1 className="required-fields-title">Required Fields</h1>

          <form className="required-fields-card" onSubmit={handleSubmit}>
            {/* ชื่อ-นามสกุล */}
            <div className="required-fields-field">
              <label className="required-fields-label">ชื่อ-นามสกุล</label>
              <input
                className="required-fields-input"
                placeholder="กรุณากรอกชื่อ-นามสกุล"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* ชื่อบริษัท */}
            <div className="required-fields-field">
              <label className="required-fields-label">ชื่อบริษัท</label>
              <input
                className="required-fields-input"
                placeholder="กรุณากรอกชื่อบริษัทของคุณ"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {/* Email/Number */}
            <div className="required-fields-field">
              <label className="required-fields-label">Email/Number</label>
              <input
                className="required-fields-input"
                placeholder="กรุณากรอก email หรือเบอร์โทรศัพท์"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            {/* เลือกปัญหา */}
            <div className="required-fields-field">
              <div className="required-fields-label-row">
                <label className="required-fields-label">เลือกปัญหาของคุณ</label>
                <span className="required-fields-hint">***เลือกสูงสุดได้ 3 ข้อ</span>
              </div>

              <select
                className="required-fields-input required-fields-select"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              >
                <option value="">กรุณาเลือกบัญหา</option>
                <option value="cost">ต้นทุน/ค่าใช้จ่าย</option>
                <option value="process">กระบวนการทำงาน</option>
                <option value="marketing">การตลาด/ลูกค้า</option>
                <option value="technology">เทคโนโลยี/ระบบ</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            {/* PDPA */}
            <div className="required-fields-field required-fields-pdpa">
              <label className="required-fields-pdpa-label">
                <input
                  type="checkbox"
                  checked={pdpa}
                  onChange={(e) => setPdpa(e.target.checked)}
                />
                <span> คุณยินยอมให้ใช้ข้อมูลส่วนบุคคลหรือไม่</span>
              </label>
            </div>

            {/* ปุ่ม Submit */}
            <div className="required-fields-actions">
              <button type="submit" className="required-fields-submit-btn">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
