'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import ExportButtons from '@/app/components/ExportButtons';

const promptFont = localFont({
  src: [
    { path: '../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [{ path: '../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' }],
});

const translations = {
  TH: {
    dashboard: 'Dashboard',
    tabs: ['DashBoard', 'User Management', 'Problem Tag Management', 'Homepage Management'],
    searchPlaceholder: 'Search...',
    totalParticipants: 'จำนวนผู้เข้างานทั้งหมด',
    totalVisitors: 'จำนวนผู้เข้าชม',
    totalExhibitors: 'จำนวน exhibitors',
    trendTitle: 'เปรียบเทียบระหว่าง Exhibitors และ Visitors',
    trendOutpatients: 'ยอดสนใจ',
    trendInpatients: 'ไม่ได้ติดต่อ',
    patientsByCategory: 'ผู้สนใจตามหมวดหมู่',
    timeAdmitted: 'ช่วงเวลาที่ติดต่อ',
    divisionLabel: 'หมวดหมู่',
    patientsLabel: 'จำนวน',
    logout: 'ออกจากระบบ',
    export: 'Export',
    tableNo: 'ลำดับ',
    tableName: 'ปัญหา',
    tableContact: 'จำนวนที่เลือก',
    details: 'รายละเอียด',
    contact: 'ติดต่อ',
    contacted: 'ติดต่อแล้ว',
    notContacted: 'ยังไม่ติดต่อ',
    name: 'ชื่อ',
    company: 'ชื่อบริษัท',
    phone: 'เบอร์โทร',
    email: 'อีเมล',
    problems: 'ปัญหาที่เลือก',
    filterAll: 'ทั้งหมด',
    filterNotContacted: 'ยังไม่ติดต่อ',
    filterContacted: 'ติดต่อแล้ว',
    userContactsLabel: 'ผู้ใช้งานกดติดต่อ',
    exhibitorContactsLabel: 'Exhibitor กดติดต่อแล้ว',
  },
  JP: {
    dashboard: 'ダッシュボード',
    tabs: ['ダッシュボード', 'ユーザー管理', '問題タグ管理', 'ホームページ管理'],
    searchPlaceholder: '検索...',
    totalParticipants: '総参加者数',
    totalVisitors: '総訪問者数',
    totalExhibitors: '出展者数',
    trendTitle: '出展者と訪問者の比較',
    trendOutpatients: 'マッチ',
    trendInpatients: '未連絡',
    patientsByCategory: 'カテゴリ別興味',
    timeAdmitted: '連絡時間',
    divisionLabel: 'カテゴリ',
    patientsLabel: '数',
    logout: 'ログアウト',
    export: 'Export',
    tableNo: '番号',
    tableName: '問題',
    tableContact: '選択数',
    details: '詳細',
    contact: '連絡',
    contacted: '連絡済み',
    notContacted: '未連絡',
    name: '名前',
    company: '会社名',
    phone: '電話',
    email: 'メール',
    problems: '選択された問題',
    filterAll: 'すべて',
    filterNotContacted: '未連絡',
    filterContacted: '連絡済み',
    userContactsLabel: 'ユーザー連絡',
    exhibitorContactsLabel: '出展者連絡済み',
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);

  useEffect(() => {
    const storedLanguage =
      typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
    if (storedLanguage) {
      const foundOption = languageOptions.find((option) => option.code === storedLanguage);
      if (foundOption) {
        setSelectedLanguage(foundOption);
      }
    }

    const handleClickOutside = (event) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch data from Firebase userPanelSubmissions
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        // Fetch userPanelSubmissions
        const submissionsRef = collection(db, 'userPanelSubmissions');
        const submissionsQuery = query(submissionsRef);
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        const submissions = [];
        submissionsSnapshot.forEach((doc) => {
          submissions.push({ id: doc.id, ...doc.data() });
        });

        // Fetch contacts (matched data from usermatching page)
        const contactsRef = collection(db, 'contacts');
        const contactsQuery = query(contactsRef);
        const contactsSnapshot = await getDocs(contactsQuery);
        
        const contacts = [];
        contactsSnapshot.forEach((doc) => {
          contacts.push({ id: doc.id, ...doc.data() });
        });

        // Calculate category counts for donut chart
        const categoryCounts = {};
        submissions.forEach((sub) => {
          if (sub.categories && Array.isArray(sub.categories)) {
            sub.categories.forEach((category) => {
              if (category && category.trim() !== '') {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
              }
            });
          }
        });

        // Convert to array and calculate percentages
        const totalCategoryCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
        const sortedCategories = Object.entries(categoryCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: totalCategoryCount > 0 ? (count / totalCategoryCount) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 categories

        // Add "อื่นๆ" if there are more categories
        const otherCount = Object.entries(categoryCounts).length > 5
          ? Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(5)
              .reduce((sum, [, count]) => sum + count, 0)
          : 0;
        
        if (otherCount > 0) {
          sortedCategories.push({
            name: 'Others', // Will be translated in the display
            count: otherCount,
            percentage: totalCategoryCount > 0 ? (otherCount / totalCategoryCount) * 100 : 0,
          });
        }

        setCategoryData(sortedCategories);

        // Fetch exhibitors count
        const exhibitorsRef = collection(db, 'exhibitors');
        const exhibitorsSnapshot = await getDocs(exhibitorsRef);
        const exhibitorsCount = exhibitorsSnapshot.docs.filter(
          (doc) => doc.data().isComplete === true
        ).length;

        // Fetch visitors count (from users collection)
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const visitorsCount = usersSnapshot.size;

        setComparisonData({
          exhibitors: exhibitorsCount,
          visitors: visitorsCount,
          loading: false,
        });

        // Prepare table data from submissions
        const contactMap = new Map();
        contacts.forEach((contact) => {
          const key = contact.submissionId || contact.fullName;
          if (key) {
            contactMap.set(key, contact.id);
          }
        });

        const tableRows = submissions.map((sub, index) => {
          const contactDocId = contactMap.get(sub.id) || contactMap.get(sub.fullName);
          const isContacted = Boolean(contactDocId);
          // Parse contact to separate phone and email
          const contactStr = sub.contact || '';
          const isEmail = contactStr.includes('@');
          const phone = isEmail ? '' : contactStr;
          const email = isEmail ? contactStr : '';
          
          return {
            id: sub.id,
            no: index + 1,
            name: sub.fullName || 'N/A',
            companyName: sub.companyName || 'N/A',
            phone,
            email,
            categories: sub.categories || [],
            isContacted,
            contactDocId: contactDocId || null,
          };
        });

        setTableData(tableRows);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };

    fetchSummaryData();
    updateSummaryData(false);
  }, []);

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
  };

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const updateSummaryData = async (loading = false) => {
    try {
      // Fetch total participants (from userPanelSubmissions)
      const submissionsRef = collection(db, 'userPanelSubmissions');
      const submissionsSnapshot = await getDocs(submissionsRef);
      const totalParticipants = submissionsSnapshot.size;

      // Fetch total visitors (from users collection or can be from analytics)
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const totalVisitors = usersSnapshot.size;

      // Fetch total exhibitors (from exhibitors collection where isComplete is true)
      const exhibitorsRef = collection(db, 'exhibitors');
      const exhibitorsSnapshot = await getDocs(exhibitorsRef);
      const totalExhibitors = exhibitorsSnapshot.docs.filter(
        (doc) => doc.data().isComplete === true
      ).length;

      setSummaryData({
        totalParticipants,
        totalVisitors,
        totalExhibitors,
        loading,
      });
    } catch (error) {
      console.error('Error updating summary data:', error);
      setSummaryData({
        totalParticipants: 0,
        totalVisitors: 0,
        totalExhibitors: 0,
        loading: false,
      });
    }
  };

  const handleContactClick = async (row) => {
    try {
      if (row.isContacted) {
        // Remove contact
        if (row.contactDocId) {
          await deleteDoc(doc(db, 'contacts', row.contactDocId));
        }

        setTableData((prevData) => {
          return prevData.map((item) =>
            item.id === row.id ? { ...item, isContacted: false, contactDocId: null } : item
          );
        });
      } else {
        // Save contact to Firebase
        const docRef = await addDoc(collection(db, 'contacts'), {
          submissionId: row.id,
          fullName: row.name,
          companyName: row.companyName,
          createdAt: serverTimestamp(),
        });

        // Update local state
        setTableData((prevData) => {
          return prevData.map((item) =>
            item.id === row.id ? { ...item, isContacted: true, contactDocId: docRef.id } : item
          );
        });
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const handleExportPDF = () => {
    // Helper function to convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    // Use English translations for PDF export
    const pdfT = translations.EN;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const sectionSpacing = 15;
    const cardHeight = 25;
    const cardSpacing = 10;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(pdfT.dashboard, margin, yPosition);
    yPosition += lineHeight + 8;

    // Date (English format)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    pdf.text(`Date: ${currentDate}`, margin, yPosition);
    yPosition += sectionSpacing + 5;

    // Summary Cards Section (3 cards in a row)
    checkNewPage(cardHeight + 10);
    const cardWidth = (pageWidth - margin * 2 - cardSpacing * 2) / 3;
    const summaryCards = [
      { label: pdfT.totalParticipants, value: summaryData.totalParticipants.toLocaleString() },
      { label: pdfT.totalVisitors, value: summaryData.totalVisitors.toLocaleString() },
      { label: pdfT.totalExhibitors, value: summaryData.totalExhibitors.toLocaleString() },
    ];

    summaryCards.forEach((card, index) => {
      const xPos = margin + index * (cardWidth + cardSpacing);
      
      // Draw card background
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(xPos, yPosition, cardWidth, cardHeight, 2, 2, 'FD');
      
      // Card content
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(card.value, xPos + 5, yPosition + 10);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const labelLines = pdf.splitTextToSize(card.label, cardWidth - 10);
      pdf.text(labelLines, xPos + 5, yPosition + 16);
    });
    yPosition += cardHeight + sectionSpacing;

    // Charts Section (2 panels side by side)
    checkNewPage(80);
    
    // Left Panel: Horizontal Bar Chart - Exhibitors vs Visitors
    const leftPanelWidth = (pageWidth - margin * 2 - 10) / 2;
    const chartHeight = 60;
    const chartY = yPosition;
    
    // Panel background
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, chartY, leftPanelWidth, chartHeight + 20, 2, 2, 'FD');
    
    // Chart title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const chartTitle = pdf.splitTextToSize(pdfT.trendTitle, leftPanelWidth - 10);
    pdf.text(chartTitle, margin + 5, chartY + 8);
    
    // Draw horizontal bars
    const maxValue = Math.max(comparisonData.exhibitors, comparisonData.visitors, 1);
    const barHeight = 12;
    const barSpacing = 20;
    const barStartY = chartY + 20;
    const barWidth = leftPanelWidth - 30;
    
    // Exhibitors bar
    const exhibitorsBarWidth = (comparisonData.exhibitors / maxValue) * barWidth;
    pdf.setFillColor(30, 41, 57);
    pdf.rect(margin + 10, barStartY, exhibitorsBarWidth, barHeight, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Exhibitors', margin + 10, barStartY - 2);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(comparisonData.exhibitors), margin + 10 + exhibitorsBarWidth + 5, barStartY + 8);
    
    // Visitors bar
    const visitorsBarWidth = (comparisonData.visitors / maxValue) * barWidth;
    pdf.setFillColor(30, 41, 57);
    pdf.rect(margin + 10, barStartY + barSpacing, visitorsBarWidth, barHeight, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Visitors', margin + 10, barStartY + barSpacing - 2);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(comparisonData.visitors), margin + 10 + visitorsBarWidth + 5, barStartY + barSpacing + 8);

    // Right Panel: Donut Chart - Problems Percentage
    const rightPanelX = margin + leftPanelWidth + 10;
    const rightPanelWidth = pageWidth - rightPanelX - margin;
    const donutCenterX = rightPanelX + rightPanelWidth / 2;
    const donutCenterY = chartY + (chartHeight + 20) / 2;
    const donutRadius = 25;
    
    // Panel background
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(rightPanelX, chartY, rightPanelWidth, chartHeight + 20, 2, 2, 'FD');
    
    // Chart title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Problems Percentage', rightPanelX + 5, chartY + 8);
    
    // Draw donut chart segments
    if (categoryData.length > 0) {
      // Outer circle (background - light gray)
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(8);
      pdf.circle(donutCenterX, donutCenterY, donutRadius, 'D');
      
      const colors = ['#1E2939', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'];
      let currentAngle = -90;
      
      categoryData.forEach((category, index) => {
        const angleRange = (category.percentage / 100) * 360;
        const color = colors[index % colors.length];
        const rgb = hexToRgb(color);
        
        if (category.percentage > 0) {
          pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
          pdf.setLineWidth(8);
          const segmentSteps = Math.max(20, Math.floor(angleRange / 2));
          for (let step = 0; step <= segmentSteps; step++) {
            const angle = ((currentAngle + (angleRange * (step / segmentSteps))) * Math.PI) / 180;
            const x1 = donutCenterX + Math.cos(angle) * (donutRadius - 4);
            const y1 = donutCenterY + Math.sin(angle) * (donutRadius - 4);
            const x2 = donutCenterX + Math.cos(angle) * donutRadius;
            const y2 = donutCenterY + Math.sin(angle) * donutRadius;
            pdf.line(x1, y1, x2, y2);
          }
          currentAngle += angleRange;
        }
      });
      
      // Inner white circle to create donut effect
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(255, 255, 255);
      pdf.circle(donutCenterX, donutCenterY, donutRadius - 8, 'FD');
    }
    
    // Labels below chart
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const labelY = chartY + chartHeight + 10;
    let labelYPos = labelY;
    categoryData.slice(0, 5).forEach((category, index) => {
      const displayName = category.name === 'Others' ? 'Others' : category.name;
      const color = colors[index % colors.length];
      const rgb = hexToRgb(color);
      
      // Color dot
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.circle(rightPanelX + 5, labelYPos, 1.5, 'F');
      
      // Text
      pdf.setTextColor(0, 0, 0);
      const text = `${displayName}: ${Math.round(category.percentage)}% (${category.count})`;
      pdf.text(text, rightPanelX + 10, labelYPos + 1);
      labelYPos += 4;
    });
    pdf.setTextColor(0, 0, 0);
    
    yPosition = chartY + chartHeight + 20 + sectionSpacing;

    // Table Section - Top 5 Problems
    if (categoryData.length > 0) {
      checkNewPage(sectionSpacing + lineHeight * 8);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 5 Problems', margin, yPosition);
      yPosition += lineHeight + 5;

      // Table Header with background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, lineHeight + 4, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const colWidths = [15, 120, 50];
      const headers = [pdfT.tableNo, pdfT.tableName, pdfT.tableContact];
      let xPosition = margin + 3;

      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += lineHeight + 3;

      // Table Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setDrawColor(220, 220, 220);
      categoryData.slice(0, 5).forEach((category, index) => {
        checkNewPage(lineHeight + 3);
        
        // Draw row border
        pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        
        xPosition = margin + 3;
        
        // No.
        pdf.text(String(index + 1), xPosition, yPosition);
        xPosition += colWidths[0];

        // Problem name
        const displayName = category.name === 'Others' ? 'Others' : category.name;
        const name = displayName.length > 40 ? displayName.substring(0, 37) + '...' : displayName;
        pdf.text(name, xPosition, yPosition);
        xPosition += colWidths[1];

        // Count
        pdf.text(String(category.count), xPosition, yPosition);
        
        yPosition += lineHeight + 2;
      });
    } else {
      checkNewPage(sectionSpacing + lineHeight * 3);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 5 Problems', margin, yPosition);
      yPosition += lineHeight + 5;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.text('No data available', margin, yPosition);
      pdf.setTextColor(0, 0, 0);
    }

    // Save PDF
    const fileName = `admin-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName] = useState('Admin');
  
  // Summary Cards data
  const [summaryData, setSummaryData] = useState({
    totalParticipants: 0,
    totalVisitors: 0,
    totalExhibitors: 0,
    loading: true,
  });

  // Comparison data for horizontal bar chart
  const [comparisonData, setComparisonData] = useState({
    exhibitors: 0,
    visitors: 0,
    loading: true,
  });

  // Category data for donut chart
  const [categoryData, setCategoryData] = useState([]);
  
  // Table data
  const [tableData, setTableData] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [tableFilter, setTableFilter] = useState('all'); // 'all', 'notContacted', 'contacted'

  // Calculate donut chart data from categories
  const circumference = 2 * Math.PI * 40;
  const colors = ['#1E2939', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'];
  
  let currentOffset = 0;
  const donutSegments = categoryData.map((category, index) => {
    const dashLength = (category.percentage / 100) * circumference;
    const dashArray = `${dashLength} ${circumference}`;
    const offset = currentOffset;
    currentOffset -= dashLength;
    
    return {
      ...category,
      dashArray,
      offset,
      color: colors[index % colors.length],
    };
  });

  return (
    <div className={`min-h-screen bg-[#f5f5f5] flex ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-[1440px] mx-auto flex relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
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
              {t.tabs.map((tab, idx) => {
                const tabKeys = ['dashboard', 'userManagement', 'problemTagManagement', 'homepageManagement'];
                const targetTab = tabKeys[idx] || 'dashboard';
                
                // Icon mapping
                const getIcon = (index) => {
                  if (index === 0) {
                    return (
                      <Image
                        src="/dashboard.png"
                        alt={tab}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    );
                  }
                  if (index === 1) {
                    return (
                      <Image
                        src="/user.png"
                        alt={tab}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    );
                  }
                  if (index === 2) {
                    return (
                      <Image
                        src="/file.png"
                        alt={tab}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    );
                  }
                  if (index === 3) {
                    return (
                      <Image
                        src="/home.png"
                        alt={tab}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    );
                  }
                  if (index === 4) {
                    return (
                      <Image
                        src="/verify.png"
                        alt={tab}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    );
                  }
                  return null;
                };
                
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
                      } else if (targetTab === 'homepageManagement') {
                        router.push('/admin-dashboard/homepage-management');
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
                    {getIcon(idx)}
                    {tab}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            {/* Dashboard Title */}
            <h1 className="text-4xl font-bold text-gray-900">{t.dashboard}</h1>
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-end justify-end  w-full">
              <div className="relative" ref={languageDropdownRef}>
                <div className="flex items-end justify-end gap-3 cursor-pointer">
                  <ExportButtons 
                    exportPdfLabel={`${t.export} PDF`}
                    exportExcelLabel={`${t.export} Excel`}
                    summaryData={summaryData}
                    comparisonData={comparisonData}
                    categoryData={categoryData}
                    tableData={tableData}
                    translations={translations}
                    selectedLanguage={selectedLanguage}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLanguageOpen((prev) => !prev)}
                    className="bg-gray-800 text-white rounded-lg w-[72px] h-[36px] text-sm flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
                  >
                    {selectedLanguage.code}
                    <svg width="12" height="8" fill="none" viewBox="0 0 12 8">
                      <path
                        d="M1 1l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-gray-800 text-white rounded-xl w-[40px] h-[36px] flex items-center justify-center hover:bg-gray-700 transition"
                    aria-label={t.logout}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M15 12H3M12 9l3 3-3 3M9 7V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {isLanguageOpen && (
                  <ul
                    className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
                    role="listbox"
                  >
                    {languageOptions.map((option) => (
                      <li key={option.code}>
                        <button
                          type="button"
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                            selectedLanguage.code === option.code
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handleLanguageSelect(option)}
                        >
                          <span>{option.label}</span>
                          <span className="font-semibold">{option.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="flex-1 overflow-auto p-4 md:p-4 bg-[#f5f5f5] ">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8 ">
              {/* Total Participants */}
              <div className="bg-white p-6 shadow-sm relative rounded-l-2xl">
                <div className="absolute top-4 right-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-800">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : summaryData.totalParticipants.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalParticipants}</p>
                  </div>
                </div>
              </div>

              {/* Total Visitors */}
              <div className="bg-white  p-6 shadow-sm relative">
                <div className="absolute top-4 right-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-800">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : summaryData.totalVisitors.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalVisitors}</p>
                  </div>
                </div>
              </div>

              {/* Total Exhibitors */}
              <div className="bg-white  p-6 shadow-sm relative rounded-r-2xl">
                <div className="absolute top-4 right-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-800">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 21v-8H7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : summaryData.totalExhibitors.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalExhibitors}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Horizontal Bar Chart - Exhibitors vs Visitors */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm ">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{t.trendTitle}</h3>
                </div>
                <div className="space-y-6">
                  {comparisonData.loading ? (
                    <div className="w-full text-center text-gray-500 py-8">
                      Loading...
                    </div>
                  ) : (
                    <>
                      {/* Exhibitors Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedLanguage.code === 'TH' ? 'Exhibitors' : '出展者'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {comparisonData.exhibitors.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="h-full bg-[#1E2939] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                            style={{
                              width: `${Math.max(comparisonData.exhibitors, comparisonData.visitors) > 0 
                                ? (comparisonData.exhibitors / Math.max(comparisonData.exhibitors, comparisonData.visitors)) * 100 
                                : 0}%`,
                            }}
                          >
                            {comparisonData.exhibitors > 0 && (
                              <span className="text-xs font-medium text-white">
                                {comparisonData.exhibitors.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Visitors Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedLanguage.code === 'TH' ? 'Visitors' : '訪問者'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {comparisonData.visitors.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="h-full bg-[#1E2939] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                            style={{
                              width: `${Math.max(comparisonData.exhibitors, comparisonData.visitors) > 0 
                                ? (comparisonData.visitors / Math.max(comparisonData.exhibitors, comparisonData.visitors)) * 100 
                                : 0}%`,
                            }}
                          >
                            {comparisonData.visitors > 0 && (
                              <span className="text-xs font-medium text-white">
                                {comparisonData.visitors.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Donut Chart - Problems Percentage */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedLanguage.code === 'TH' ? 'เปอร์เซ็นต์ปัญหาทั้งหมด' : '問題の割合'}
                  </h3>
                </div>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    {donutSegments.map((segment, index) => (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="8"
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.offset}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Image
                        src="/graph.png"
                        alt="Graph"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {categoryData.length > 0 ? (
                    categoryData.map((category, index) => {
                      const displayName = category.name === 'Others' 
                        ? (selectedLanguage.code === 'TH' ? 'อื่นๆ' : 'その他')
                        : category.name;
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-gray-700 truncate max-w-[120px]">
                              {displayName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-semibold">
                              {Math.round(category.percentage)}%
                            </span>
                            <span className="text-gray-500 text-xs">
                              ({category.count})
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-4">
                      {summaryData.loading ? 'Loading...' : 'No data available'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table - Top 5 Problems */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{t.tableNo}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{t.tableName}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{t.tableContact}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.length > 0 ? (
                      categoryData.slice(0, 5).map((category, index) => {
                        const displayName = category.name === 'Others' 
                          ? (selectedLanguage.code === 'TH' ? 'อื่นๆ' : 'その他')
                          : category.name;
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-700">{index + 1}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium">{displayName}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{category.count.toLocaleString()}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-gray-500">
                          {summaryData.loading ? 'Loading...' : 'No data available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

