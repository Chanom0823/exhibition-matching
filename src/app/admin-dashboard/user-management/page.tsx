'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import jsPDF from 'jspdf';
import ExportButtons from '@/app/components/ExportButtons';
import translations from '@/app/components/translations';
import { useLanguage } from '@/app/contexts/LanguageProvider';

// ตรวจสอบว่าลิงก์รูปโหลดสำเร็จและมีขนาด ≥ 300px
// const validateImageUrl = (url) => {
//   return new Promise((resolve) => {
//     const img = new Image();

//     img.onload = () => {
//       if (img.naturalWidth >= 300 && img.naturalHeight >= 300) {
//         resolve({ valid: true });
//       } else {
//         resolve({
//           valid: false,
//           error: "รูปต้องมีขนาดขั้นต่ำ 300px ทั้งด้านกว้างและสูง",
//         });
//       }
//     };

//     img.onerror = () => {
//       resolve({ valid: false, error: "ไม่สามารถโหลดรูปจากลิงก์นี้ได้" });
//     };

//     img.src = url + "?cache=" + Date.now(); // ป้องกัน cache
//   });
// };

const promptFont = localFont({
  src: [
    { path: '../../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [{ path: '../../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' }],
});

const getInitialProfileForm = () => ({
  companyName: '',
  taxId: '',
  branchId: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
  companyDescription: '',
  logoUrl: '',
});

const getInitialVisitorForm = () => ({
  fullName: '',
  companyName: '',
  contact: '',
  categories: [''],
});

export default function UserManagementPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState('userManagement');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // Summary Cards data
  const [summaryData, setSummaryData] = useState({
    totalParticipants: 0,
    totalVisitors: 0,
    totalExhibitors: 0,
    loading: true,
  });

  // Users table data
  const [usersData, setUsersData] = useState<{
    users: any[];
    loading: boolean;
  }>({
    users: [],
    loading: true,
  });
  const [roleFilter, setRoleFilter] = useState<'all' | 'visitors' | 'exhibitors'>('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>(getInitialProfileForm());
  const [editCategories, setEditCategories] = useState<string[]>(['']);
  const [visitorFormData, setVisitorFormData] = useState<any>(getInitialVisitorForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: '' | 'error' | 'success'; text: string }>({
    type: '',
    text: '',
  });
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [problemTags, setProblemTags] = useState<string[]>([]);

  const getTagOptions = (currentValue: string) => {
    if (!currentValue) {
      return problemTags;
    }
    return problemTags.includes(currentValue) ? problemTags : [currentValue, ...problemTags];
  };

  useEffect(() => {
    const storedLanguage =
      typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
    if (storedLanguage) {
      const foundOption = languageOptions.find((option) => option.code === storedLanguage);
      if (foundOption) {
        setSelectedLanguage(foundOption);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchProblemTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, 'problemTags'));
        const tags = tagsSnapshot.docs
          .map((docSnap) => docSnap.data()?.name?.trim())
          .filter((name, index, self) => name && self.indexOf(name) === index) as string[];
        setProblemTags(tags);
      } catch (error) {
        console.error('Error loading problem tags:', error);
      }
    };

    fetchProblemTags();
  }, []);

  // Fetch summary data from Firebase
  useEffect(() => {
    const updateSummaryData = async () => {
      try {
        const submissionsRef = collection(db, 'userPanelSubmissions');
        const submissionsSnapshot = await getDocs(submissionsRef);
        const totalParticipants = submissionsSnapshot.size;

        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalVisitors = usersSnapshot.size;

        const exhibitorsRef = collection(db, 'exhibitors');
        const exhibitorsSnapshot = await getDocs(exhibitorsRef);
        const totalExhibitors = exhibitorsSnapshot.docs.filter(
          (doc) => doc.data().isComplete === true
        ).length;

        setSummaryData({
          totalParticipants,
          totalVisitors,
          totalExhibitors,
          loading: false,
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

    updateSummaryData();
  }, []);

  // Fetch users data for table
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const [usersSnapshot, submissionsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'userPanelSubmissions')),
        ]);

        const normalizeContact = (contact: string) => {
          if (!contact || contact === '-') return '';
          return String(contact).toLowerCase().trim().replace(/[\s\-\(\)\+]/g, '');
        };

        const normalizeName = (name: string) => {
          if (!name || name === '-') return '';
          return String(name).toLowerCase().trim().replace(/\s+/g, '');
        };

        const submissionsContacts = new Map<string, any>();
        const submissionsNames = new Map<string, any>();
        submissionsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data.contact) {
            const contact = normalizeContact(data.contact);
            if (contact) {
              submissionsContacts.set(contact, { id: docSnap.id, data });
            }
          }
          if (data.fullName) {
            const name = normalizeName(data.fullName);
            if (name) {
              submissionsNames.set(name, { id: docSnap.id, data });
            }
          }
        });

        const matchedSubmissionIds = new Set<string>();

        const usersList = usersSnapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const email = normalizeContact(data.email);
          const phoneNumber = normalizeContact(data.phoneNumber);
          const fullName = normalizeName(data.fullName);

          let matchedSubmission: any = null;
          if (email && submissionsContacts.has(email)) {
            matchedSubmission = submissionsContacts.get(email);
          } else if (phoneNumber && submissionsContacts.has(phoneNumber)) {
            matchedSubmission = submissionsContacts.get(phoneNumber);
          } else if (fullName && submissionsNames.has(fullName)) {
            matchedSubmission = submissionsNames.get(fullName);
          }

          let userRole = data.role || '-';
          if (matchedSubmission) {
            matchedSubmissionIds.add(matchedSubmission.id);
            userRole = 'visitor';
          }

          return {
            id: docSnap.id,
            username: data.username || '-',
            role: userRole,
            createdAt: data.createdAt
              ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt))
              : null,
            email: data.email || '-',
            fullName: data.fullName || data.username || '-',
            visitorSubmissionId: matchedSubmission?.id || null,
            visitorSubmissionData: matchedSubmission?.data || null,
            isVisitorOnly: false,
          };
        });

        const visitorOnlyEntries = submissionsSnapshot.docs
          .filter((docSnap) => !matchedSubmissionIds.has(docSnap.id))
          .map((docSnap) => {
            const data = (docSnap.data() as any) || {};
            return {
              id: `visitor-${docSnap.id}`,
              username: data.fullName || data.companyName || data.contact || '-',
              role: 'visitor',
              createdAt: data.createdAt
                ? data.createdAt.toDate
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt)
                : null,
              email: data.contact || '-',
              fullName: data.fullName || data.companyName || 'Visitor',
              visitorSubmissionId: docSnap.id,
              visitorSubmissionData: data,
              isVisitorOnly: true,
            };
          });

        const combinedUsers = [...usersList, ...visitorOnlyEntries];
        combinedUsers.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (b.createdAt as any) - (a.createdAt as any);
        });

        setUsersData({
          users: combinedUsers,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching users data:', error);
        setUsersData({
          users: [],
          loading: false,
        });
      }
    };

    fetchUsersData();
  }, []);

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };
//
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

  const handleTabClick = (targetTab: string) => {
    setActiveTab(targetTab);
    if (targetTab === 'dashboard') {
      router.push('/admin-dashboard');
    } else if (targetTab === 'problemTagManagement') {
      router.push('/admin-dashboard/problem-tag-management');
    } else if (targetTab === 'pdpaManagement') {
      router.push('/admin-dashboard/pdpa-management');
    }
  };

  // const handleExportPDF = () => {
  //   const pdfT = translations.EN;

  //   const filteredUsersForExport = usersData.users.filter((user) => {
  //     if (roleFilter === 'visitors') return user.role === 'visitor';
  //     if (roleFilter === 'exhibitors') return user.role === 'exhibitor';
  //     return true;
  //   });

  //   const pdf = new jsPDF();
  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();
  //   let yPosition = 20;
  //   const margin = 20;
  //   const lineHeight = 7;
  //   const sectionSpacing = 15;
  //   const cardHeight = 25;
  //   const cardSpacing = 10;

  //   const checkNewPage = (requiredSpace: number) => {
  //     if (yPosition + requiredSpace > pageHeight - margin) {
  //       pdf.addPage();
  //       yPosition = 20;
  //       return true;
  //     }
  //     return false;
  //   };

  //   pdf.setFontSize(20);
  //   pdf.setFont('helvetica', 'bold');
  //   pdf.text(pdfT.userManagement, margin, yPosition);
  //   yPosition += lineHeight + 8;

  //   pdf.setFontSize(10);
  //   pdf.setFont('helvetica', 'normal');
  //   const currentDate = new Date().toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //   });
  //   pdf.text(`Date: ${currentDate}`, margin, yPosition);
  //   yPosition += sectionSpacing + 5;

  //   checkNewPage(cardHeight + 10);
  //   const cardWidth = (pageWidth - margin * 2 - cardSpacing * 2) / 3;
  //   const summaryCards = [
  //     { label: pdfT.totalParticipants, value: summaryData.totalParticipants.toLocaleString() },
  //     { label: pdfT.totalVisitors, value: summaryData.totalVisitors.toLocaleString() },
  //     { label: pdfT.totalExhibitors, value: summaryData.totalExhibitors.toLocaleString() },
  //   ];

  //   summaryCards.forEach((card, index) => {
  //     const xPos = margin + index * (cardWidth + cardSpacing);

  //     pdf.setDrawColor(200, 200, 200);
  //     pdf.setFillColor(255, 255, 255);
  //     pdf.roundedRect(xPos, yPosition, cardWidth, cardHeight, 2, 2, 'FD');

  //     pdf.setFontSize(12);
  //     pdf.setFont('helvetica', 'bold');
  //     pdf.text(card.value, xPos + 5, yPosition + 10);

  //     pdf.setFontSize(8);
  //     pdf.setFont('helvetica', 'normal');
  //     const labelLines = pdf.splitTextToSize(card.label, cardWidth - 10);
  //     pdf.text(labelLines, xPos + 5, yPosition + 16);
  //   });
  //   yPosition += cardHeight + sectionSpacing;

  //   checkNewPage(lineHeight + 5);
  //   pdf.setFontSize(10);
  //   pdf.setFont('helvetica', 'normal');
  //   const filterText =
  //     roleFilter === 'all'
  //       ? pdfT.filterAllUsers
  //       : roleFilter === 'visitors'
  //       ? pdfT.filterVisitors
  //       : pdfT.filterExhibitors;
  //   pdf.text(`Filter: ${filterText}`, margin, yPosition);
  //   yPosition += sectionSpacing;

  //   if (filteredUsersForExport.length > 0) {
  //     checkNewPage(sectionSpacing + lineHeight * 3);
  //     pdf.setFontSize(14);
  //     pdf.setFont('helvetica', 'bold');
  //     pdf.text('User List', margin, yPosition);
  //     yPosition += lineHeight + 5;

  //     pdf.setFillColor(240, 240, 240);
  //     pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, lineHeight + 4, 'F');

  //     pdf.setFontSize(10);
  //     pdf.setFont('helvetica', 'bold');
  //     const colWidths = [15, 60, 50, 60];
  //     const headers = [pdfT.tableNo, pdfT.tableUsername, pdfT.tableRole, pdfT.tableCreatedAt];
  //     let xPosition = margin + 3;

  //     headers.forEach((header, index) => {
  //       pdf.text(header, xPosition, yPosition);
  //       xPosition += colWidths[index];
  //     });
  //     yPosition += lineHeight + 3;

  //     pdf.setFont('helvetica', 'normal');
  //     pdf.setDrawColor(220, 220, 220);
  //     filteredUsersForExport.forEach((user, index) => {
  //       checkNewPage(lineHeight + 3);

  //       pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);

  //       xPosition = margin + 3;

  //       pdf.text(String(index + 1), xPosition, yPosition);
  //       xPosition += colWidths[0];

  //       const username =
  //         user.username.length > 25 ? user.username.substring(0, 22) + '...' : user.username;
  //       pdf.text(username, xPosition, yPosition);
  //       xPosition += colWidths[1];

  //       const roleText =
  //         user.role === 'visitor'
  //           ? 'Visitors'
  //           : user.role === 'exhibitor'
  //           ? 'Exhibitor'
  //           : user.role;
  //       pdf.text(roleText, xPosition, yPosition);
  //       xPosition += colWidths[2];

  //       let createdAtText = '-';
  //       if (user.createdAt) {
  //         const date =
  //           user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
  //         createdAtText = date.toLocaleDateString('en-US', {
  //           year: 'numeric',
  //           month: 'short',
  //           day: 'numeric',
  //           hour: '2-digit',
  //           minute: '2-digit',
  //         });
  //       }
  //       pdf.text(createdAtText, xPosition, yPosition);

  //       yPosition += lineHeight + 2;
  //     });
  //   } else {
  //     checkNewPage(sectionSpacing + lineHeight * 3);
  //     pdf.setFontSize(14);
  //     pdf.setFont('helvetica', 'bold');
  //     pdf.text('User List', margin, yPosition);
  //     yPosition += lineHeight + 5;

  //     pdf.setFontSize(10);
  //     pdf.setFont('helvetica', 'normal');
  //     pdf.setTextColor(150, 150, 150);
  //     pdf.text('No data available', margin, yPosition);
  //     pdf.setTextColor(0, 0, 0);
  //   }

  //   const fileName = `user-management-${new Date().toISOString().split('T')[0]}.pdf`;
  //   pdf.save(fileName);
  // };

  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;
  const filteredUsers = usersData.users.filter((user) => {
    if (roleFilter === 'visitors') return user.role === 'visitor';
    if (roleFilter === 'exhibitors') return user.role === 'exhibitor';
    return true;
  });

  const resetEditState = () => {
    setEditFormData(getInitialProfileForm());
    setEditCategories(['']);
    setEditMessage({ type: '', text: '' });
    setEditTarget(null);
    setVisitorFormData(getInitialVisitorForm());
  };

  const handleEditInputChange = (field: string, value: string) => {
    // ใช้สำหรับ field ทั่วไป (ไม่รวม logoUrl)
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ ฟังก์ชันใหม่สำหรับจัดการ Logo URL โดยเฉพาะ
  const handleLogoUrlChange = (value: string) => {
    const trimmed = value.trim();

    setEditFormData((prev: any) => ({
      ...prev,
      logoUrl: trimmed,
    }));

    // เคลียร์ข้อความ error/success เดิมก่อน
    setEditMessage({ type: '', text: '' });

    if (!trimmed) {
      // ถ้าลบ URL ทิ้ง ไม่ต้องแจ้ง error
      return;
    }

    // เช็กว่าเป็น URL ถูกต้องไหม
    try {
      // ถ้า new URL ล้มเหลว = URL ไม่ถูกต้อง
      // eslint-disable-next-line no-new
      new URL(trimmed);
    } catch {
      setEditMessage({
        type: 'error',
        text:
          (t.logoUrlInvalid as string) ||
          (selectedLanguage.code === 'TH'
            ? 'ลิงก์โลโก้ไม่ถูกต้อง กรุณากรอก URL ที่ถูกต้อง'
            : selectedLanguage.code === 'JP'
            ? 'ロゴのURLが正しくありません。有効なURLを入力してください。'
            : 'Logo URL is invalid. Please enter a valid URL.'),
      });
      return;
    }

    // ตัด query string แล้วเช็กนามสกุลไฟล์ว่าเป็นรูปไหม
    const path = trimmed.split('?')[0].toLowerCase();
    const isImageExt = /\.(png|jpe?g|webp|gif|svg)$/.test(path);

    if (!isImageExt) {
      setEditMessage({
        type: 'error',
        text:
          (t.logoUrlNotImage as string) ||
          (selectedLanguage.code === 'TH'
            ? 'ลิงก์นี้ไม่ใช่ไฟล์รูปภาพ (.png, .jpg, .jpeg, .webp, .gif, .svg)'
            : selectedLanguage.code === 'JP'
            ? 'このリンクは画像ファイル（.png, .jpg, .jpeg, .webp, .gif, .svg）ではありません。'
            : 'This URL does not look like an image file (.png, .jpg, .jpeg, .webp, .gif, .svg).'),
      });
    }
  };

  const handleEditCategoryChange = (index: number, value: string) => {
    setEditCategories((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // (โค้ดเดิมของ handleEditLogoChange ยังอยู่ แต่ไม่ได้ใช้งานแล้ว)
  const handleEditLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditMessage({ type: 'error', text: t.logoSizeError });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setEditMessage({ type: 'error', text: t.logoTypeError });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditFormData((prev: any) => ({
        ...prev,
        logo: file,
        logoPreview: reader.result,
      }));
    };
    reader.readAsDataURL(file);
    setEditMessage({ type: '', text: '' });
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleVisitorInputChange = (field: string, value: string) => {
    setVisitorFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVisitorCategoryChange = (index: number, value: string) => {
    setVisitorFormData((prev: any) => {
      const categories = [...prev.categories];
      categories[index] = value;
      return {
        ...prev,
        categories,
      };
    });
  };

  const handleTogglePreview = async (user: any) => {
    if (previewUserId === user.id) {
      setPreviewUserId(null);
      setPreviewData(null);
      setPreviewLoading(false);
      return;
    }

    setPreviewUserId(user.id);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      if (user.role === 'visitor') {
        if (user.visitorSubmissionData) {
          setPreviewData({ type: 'visitor', payload: user.visitorSubmissionData });
        } else if (user.visitorSubmissionId) {
          const submissionSnap = await getDoc(
            doc(db, 'userPanelSubmissions', user.visitorSubmissionId)
          );
          if (submissionSnap.exists()) {
            setPreviewData({ type: 'visitor', payload: submissionSnap.data() });
          } else {
            setPreviewData({ type: 'visitor', payload: null });
          }
        } else {
          setPreviewData({
            type: 'visitor',
            payload: {
              fullName: user.fullName || user.username || '',
              contact: user.email || user.phoneNumber || '',
              companyName: '',
              categories: [],
            },
          });
        }
      } else {
        const profileSnap = await getDoc(doc(db, 'exhibitors', user.id));
        if (profileSnap.exists()) {
          setPreviewData({ type: 'exhibitor', payload: profileSnap.data() });
        } else {
          setPreviewData({ type: 'exhibitor', payload: null });
        }
      }
    } catch (error) {
      console.error('Error loading preview data:', error);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openEditModal = async (user: any) => {
    if (!user) return;
    setEditTarget(user);
    setIsEditModalOpen(true);
    setEditLoading(true);
    setEditMessage({ type: '', text: '' });
    setEditFormData(getInitialProfileForm());
    setEditCategories(['']);
    setVisitorFormData(getInitialVisitorForm());

    try {
      if (user.role === 'visitor') {
        if (user.visitorSubmissionId) {
          const submissionRef = doc(db, 'userPanelSubmissions', user.visitorSubmissionId);
          const submissionSnap = await getDoc(submissionRef);
          if (submissionSnap.exists()) {
            const submissionData = submissionSnap.data() as any;
            setVisitorFormData({
              fullName: submissionData.fullName || user.fullName || user.username || '',
              companyName: submissionData.companyName || '',
              contact: submissionData.contact || user.email || '',
              categories: [submissionData.categories?.[0] || ''],
            });
          } else {
            setVisitorFormData({
              fullName: user.fullName || user.username || '',
              companyName: '',
              contact: user.email || '',
              categories: [''],
            });
          }
        } else {
          setVisitorFormData({
            fullName: user.fullName || user.username || '',
            companyName: '',
            contact: user.email || '',
            categories: [''],
          });
        }
        setEditLoading(false);
        return;
      }
      const profileRef = doc(db, 'exhibitors', user.id);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data() as any;
        setEditFormData({
          companyName: data.companyName || '',
          taxId: data.taxId || '',
          branchId: data.branchId || '',
          companyPhone: data.companyPhone || '',
          companyEmail: data.companyEmail || user.email || '',
          companyWebsite: data.website || '',
          companyDescription: data.companyDescription || '',
          logoUrl: data.logoUrl || '',
          logo: null,
          logoPreview: data.logoUrl || null,
        });
        if (data.categories && Array.isArray(data.categories)) {
          const filledCategories = [...data.categories];
          while (filledCategories.length < 1) {
            filledCategories.push('');
          }
          setEditCategories(filledCategories.slice(0, 1));
        }
      } else {
        setEditFormData((prev: any) => ({
          ...prev,
          companyEmail: user.email || '',
          companyName: user.fullName || user.username || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile for edit:', error);
      setEditMessage({
        type: 'error',
        text:
          selectedLanguage.code === 'TH'
            ? 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้'
            : selectedLanguage.code === 'JP'
            ? 'プロフィール情報を読み込めませんでした'
            : 'Unable to load profile information',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    if (editSaving) return;
    setIsEditModalOpen(false);
    resetEditState();
  };

  const handleSaveEditedProfile = async () => {
    if (!editTarget) return;

    setEditSaving(true);
    setEditMessage({ type: '', text: '' });

    try {
      if (editTarget.role === 'visitor') {
        if (!visitorFormData.fullName.trim()) {
          setEditMessage({ type: 'error', text: t.visitorValidationFullName });
          setEditSaving(false);
          return;
        }
        if (!visitorFormData.companyName.trim()) {
          setEditMessage({ type: 'error', text: t.visitorValidationCompany });
          setEditSaving(false);
          return;
        }
        if (
          visitorFormData.categories.filter((cat: string) => cat && cat.trim() !== '').length === 0
        ) {
          setEditMessage({ type: 'error', text: t.visitorValidationCategory });
          setEditSaving(false);
          return;
        }

        let submissionId = editTarget.visitorSubmissionId;
        const submissionPayload = {
          fullName: visitorFormData.fullName.trim(),
          companyName: visitorFormData.companyName.trim(),
          contact: visitorFormData.contact.trim(),
          categories: visitorFormData.categories.filter(
            (cat: string) => cat && cat.trim() !== ''
          ),
          updatedAt: new Date().toISOString(),
          language: selectedLanguage.code,
        };

        if (submissionId) {
          await setDoc(doc(db, 'userPanelSubmissions', submissionId), submissionPayload, {
            merge: true,
          });
        } else {
          const newDocRef = await addDoc(collection(db, 'userPanelSubmissions'), submissionPayload);
          submissionId = newDocRef.id;
        }

        setUsersData((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === editTarget.id
              ? {
                  ...user,
                  role: 'visitor',
                  visitorSubmissionId: submissionId,
                  visitorSubmissionData: submissionPayload,
                }
              : user
          ),
        }));
        setEditMessage({ type: 'success', text: t.visitorSaveSuccess });
      } else {
        if (!editFormData.companyName || editFormData.companyName.trim() === '') {
          setEditMessage({ type: 'error', text: t.validationCompany });
          setEditSaving(false);
          return;
        }

        if (editCategories.filter((cat) => cat && cat.trim() !== '').length === 0) {
          setEditMessage({ type: 'error', text: t.validationCategory });
          setEditSaving(false);
          return;
        }

        const logoUrl = (editFormData.logoUrl || '').trim();
        // ตรวจสอบลิงก์ Logo ก่อนบันทึก
        // if (logoUrl) {
        //   const imgCheck = await validateImageUrl(logoUrl);

        //   if (!imgCheck.valid) {
        //     setEditMessage({
        //       type: "error",
        //       text: imgCheck.error,
        //     });
        //   setEditSaving(false);
        // return;
        //   }
        // }


        const profilePayload = {
          companyName: editFormData.companyName.trim(),
          taxId: (editFormData.taxId || '').trim(),
          branchId: (editFormData.branchId || '').trim(),
          companyPhone: (editFormData.companyPhone || '').trim(),
          companyEmail: (editFormData.companyEmail || '').trim(),
          website: (editFormData.companyWebsite || '').trim(),
          companyDescription: (editFormData.companyDescription || '').trim(),
          logoUrl,
          categories: editCategories.filter((cat) => cat && cat.trim() !== ''),
          updatedAt: new Date().toISOString(),
          isComplete: true,
        };

        await setDoc(doc(db, 'exhibitors', editTarget.id), profilePayload, { merge: true });
        setEditMessage({
          type: 'success',
          text:
            selectedLanguage.code === 'TH'
              ? 'บันทึกข้อมูลผู้จัดแสดงสินค้าเรียบร้อยแล้ว'
              : selectedLanguage.code === 'JP'
              ? '出展者情報を保存しました'
              : 'Exhibitor profile has been saved.',
        });
      }
    } catch (error: any) {
      console.error('Error saving edited profile:', error);
      setEditMessage({
        type: 'error',
        text:
          error?.message ||
          (editTarget.role === 'visitor'
            ? t.visitorSaveError
            : selectedLanguage.code === 'TH'
            ? 'ไม่สามารถบันทึกข้อมูลได้'
            : selectedLanguage.code === 'JP'
            ? '保存できませんでした'
            : 'Unable to save profile'),
      });
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteModal = (user: any) => {
    if (!user) return;
    setDeleteTarget(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingUserId) return;
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    const userId = deleteTarget.id;
    try {
      setDeletingUserId(userId);
      if (deleteTarget.isVisitorOnly && deleteTarget.visitorSubmissionId) {
        await deleteDoc(doc(db, 'userPanelSubmissions', deleteTarget.visitorSubmissionId));
      } else {
        await deleteDoc(doc(db, 'users', userId));
      }

      setUsersData((prev) => ({
        ...prev,
        users: prev.users.filter((user) => user.id !== userId),
      }));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage =
        selectedLanguage.code === 'TH'
          ? 'ไม่สามารถลบผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง'
          : selectedLanguage.code === 'JP'
          ? 'ユーザーを削除できませんでした。もう一度お試しください。'
          : 'Unable to delete user. Please try again.';
      alert(errorMessage);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f5f5f5] flex ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-[1440px] mx-auto flex relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col">
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 whitespace-nowrap">
              {t.userManagement}
            </h1>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-end justify-end w-full">
              <div className="relative" ref={languageDropdownRef}>
                <div className="flex items-end justify-end gap-3 cursor-pointer">
                  <ExportButtons
                    exportPdfLabel={`${t.export} PDF`}
                    exportExcelLabel={`${t.export} Excel`}
                    summaryData={summaryData}
                    usersData={usersData.users}
                    roleFilter={roleFilter}
                    translations={translations}
                    selectedLanguage={selectedLanguage}
                    exportType="userManagement"
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

          <main className="flex-1 overflow-auto p-4 md:p-4 bg-[#f5f5f5]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
                      <path
                        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading
                        ? '...'
                        : (summaryData.totalParticipants ?? 0).toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalParticipants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-sm relative">
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
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : (summaryData.totalVisitors ?? 0).toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalVisitors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-sm relative rounded-r-2xl">
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
                      <path
                        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 21v-8H7v8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 3v5h8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading
                        ? '...'
                        : (summaryData.totalExhibitors ?? 0).toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalExhibitors}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedLanguage.code === 'TH' ? t.filterAllUsers : t.filterAllUsersJP}
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('visitors')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    roleFilter === 'visitors'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedLanguage.code === 'TH' ? t.filterVisitors : t.filterVisitorsJP}
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('exhibitors')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    roleFilter === 'exhibitors'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedLanguage.code === 'TH' ? t.filterExhibitors : t.filterExhibitorsJP}
                </button>
              </div>
              <div className="overflow-x-auto">
                {usersData.loading ? (
                  <div className="text-center py-8 text-gray-500">
                    {selectedLanguage.code === 'TH' ? t.loading : t.loadingJP}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {selectedLanguage.code === 'TH' ? t.noUsers : t.noUsersJP}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {selectedLanguage.code === 'TH' ? t.tableNo : t.tableNoJP}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-2/5 min-w-[220px]">
                          {selectedLanguage.code === 'TH' ? t.tableUsername : t.tableUsernameJP}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {selectedLanguage.code === 'TH' ? t.tableRole : t.tableRoleJP}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-28 min-w-[100px]">
                          {selectedLanguage.code === 'TH' ? t.tableCreatedAt : t.tableCreatedAtJP}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {selectedLanguage.code === 'TH' ? t.tableActions : t.tableActionsJP}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <Fragment key={user.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 w-2/5 min-w-[220px] whitespace-normal break-words">
                              {user.username}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.role === 'admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : user.role === 'exhibitor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : user.role === 'visitor'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {user.role === 'visitor'
                                  ? selectedLanguage.code === 'TH'
                                    ? 'Visitors'
                                    : selectedLanguage.code === 'JP'
                                    ? '訪問者'
                                    : 'Visitors'
                                  : user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 w-28 min-w-[100px] whitespace-nowrap">
                              {user.createdAt
                                ? user.createdAt.toLocaleString(
                                    selectedLanguage.code === 'TH'
                                      ? 'th-TH'
                                      : selectedLanguage.code === 'JP'
                                      ? 'ja-JP'
                                      : 'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )
                                : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="p-2 rounded-full bg-[#00B8D9] hover:bg-[#0095b3] transition"
                                  aria-label="Preview user"
                                  onClick={() => handleTogglePreview(user)}
                                >
                                  <Image
                                    src="/eye.png"
                                    alt="Preview"
                                    width={18}
                                    height={18}
                                    className="w-4 h-4 brightness-0 invert"
                                  />
                                </button>
                                <button
                                  type="button"
                                  className="p-2 rounded-full bg-[#FFAB00] hover:bg-[#cc8900] transition"
                                  aria-label="Edit user"
                                  onClick={() => openEditModal(user)}
                                >
                                  <Image
                                    src="/pencil.png"
                                    alt="Edit"
                                    width={18}
                                    height={18}
                                    className="w-4 h-4 brightness-0 invert"
                                  />
                                </button>
                                <button
                                  type="button"
                                  className={`p-2 rounded-full bg-[#FF5630] hover:bg-[#d94824] transition ${
                                    deletingUserId === user.id ? 'opacity-60 cursor-not-allowed' : ''
                                  }`}
                                  aria-label="Delete user"
                                  onClick={() => openDeleteModal(user)}
                                  disabled={deletingUserId === user.id}
                                >
                                  <Image
                                    src="/trash-can.png"
                                    alt="Delete"
                                    width={18}
                                    height={18}
                                    className="w-4 h-4 brightness-0 invert"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {previewUserId === user.id && (
                            <tr className="border-b border-gray-100">
                              <td colSpan={5} className="bg-gray-50 px-4 py-4">
                                {previewLoading ? (
                                  <div className="text-sm text-gray-500">
                                    {selectedLanguage.code === 'TH' ? t.loading : t.loadingJP}
                                  </div>
                                ) : !previewData ? (
                                  <div className="text-sm text-gray-500">{t.previewNoData}</div>
                                ) : previewData.type === 'visitor' ? (
                                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                      {selectedLanguage.code === 'TH'
                                        ? t.previewVisitorSection
                                        : t.previewVisitorSectionJP}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                      <div>
                                        <p className="text-gray-500">
                                          {selectedLanguage.code === 'TH'
                                            ? t.visitorFullName
                                            : t.visitorFullNameJP}
                                        </p>
                                        <p className="font-medium">
                                          {previewData.payload?.fullName || '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">
                                          {selectedLanguage.code === 'TH'
                                            ? t.visitorCompanyName
                                            : t.visitorCompanyNameJP}
                                        </p>
                                        <p className="font-medium">
                                          {previewData.payload?.companyName || '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">
                                          {selectedLanguage.code === 'TH'
                                            ? t.previewContact
                                            : t.previewContactJP}
                                        </p>
                                        <p className="font-medium">
                                          {previewData.payload?.contact || '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">
                                          {selectedLanguage.code === 'TH'
                                            ? t.visitorCategoriesLabel
                                            : t.visitorCategoriesLabelJP}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(previewData.payload?.categories || []).length > 0 ? (
                                            previewData.payload.categories.map(
                                              (category: string, idx: number) => (
                                                <span
                                                  key={`${user.id}-visitor-cat-${idx}`}
                                                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                                                >
                                                  {category}
                                                </span>
                                              )
                                            )
                                          ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                      {selectedLanguage.code === 'TH'
                                        ? t.previewExhibitorSection
                                        : t.previewExhibitorSectionJP}
                                    </h4>
                                    {previewData.payload ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                        <div>
                                          <p className="text-gray-500">
                                            {selectedLanguage.code === 'TH'
                                              ? t.companyName
                                              : t.companyNameJP}
                                          </p>
                                          <p className="font-medium">
                                            {previewData.payload.companyName || '-'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">
                                            {selectedLanguage.code === 'TH'
                                              ? t.companyEmail
                                              : t.companyEmailJP}
                                          </p>
                                          <p className="font-medium">
                                            {previewData.payload.companyEmail || '-'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">
                                            {selectedLanguage.code === 'TH'
                                              ? t.companyPhone
                                              : t.companyPhoneJP}
                                          </p>
                                          <p className="font-medium">
                                            {previewData.payload.companyPhone || '-'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">
                                            {selectedLanguage.code === 'TH'
                                              ? t.companyWebsite
                                              : t.companyWebsiteJP}
                                          </p>
                                          <p className="font-medium">
                                            {previewData.payload.website || '-'}
                                          </p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-gray-500">
                                            {selectedLanguage.code === 'TH'
                                              ? t.companyDescription
                                              : t.companyDescriptionJP}
                                          </p>
                                          <p className="font-medium mt-1 text-gray-700">
                                            {previewData.payload.companyDescription || '-'}
                                          </p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-gray-500">
                                            {selectedLanguage.code === 'TH'
                                              ? t.tagsTitle
                                              : t.tagsTitleJP}
                                          </p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {(previewData.payload.categories || []).length > 0 ? (
                                              previewData.payload.categories.map(
                                                (category: string, idx: number) => (
                                                  <span
                                                    key={`${user.id}-exhibitor-cat-${idx}`}
                                                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                                                  >
                                                    {category}
                                                  </span>
                                                )
                                              )
                                            ) : (
                                              <span className="text-xs text-gray-400">-</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500">
                                        {selectedLanguage.code === 'TH'
                                          ? t.previewNoData
                                          : t.previewNoDataJP}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{t.editProfileTitle}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.editProfileDescription}</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={closeEditModal}
                aria-label="Close edit modal"
                disabled={editSaving}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5 bg-[#fafafa]">
              {editLoading ? (
                <div className="py-20 text-center text-gray-500">{t.editLoading}</div>
              ) : editTarget?.role === 'visitor' ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-600 mb-1"
                        htmlFor="visitor-fullName"
                      >
                        {t.visitorFullName}
                      </label>
                      <input
                        id="visitor-fullName"
                        type="text"
                        value={visitorFormData.fullName}
                        onChange={(e) => handleVisitorInputChange('fullName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        disabled={editSaving}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-600 mb-1"
                        htmlFor="visitor-companyName"
                      >
                        {t.visitorCompanyName}
                      </label>
                      <input
                        id="visitor-companyName"
                        type="text"
                        value={visitorFormData.companyName}
                        onChange={(e) => handleVisitorInputChange('companyName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        disabled={editSaving}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-600 mb-1"
                        htmlFor="visitor-contact"
                      >
                        {t.visitorContact}
                      </label>
                      <input
                        id="visitor-contact"
                        type="text"
                        value={visitorFormData.contact}
                        onChange={(e) => handleVisitorInputChange('contact', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        disabled={editSaving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {t.visitorCategoriesLabel}
                      </label>
                      <div className="space-y-2">
                        {[0].map((index) => {
                          const currentValue = visitorFormData.categories[index] || '';
                          const availableTags = getTagOptions(currentValue);
                          return (
                            <select
                              key={`visitor-category-${index}`}
                              value={currentValue}
                              onChange={(e) => handleVisitorCategoryChange(index, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
                              disabled={editSaving}
                            >
                              <option value="">{t.selectCategory}</option>
                              {availableTags.map((tag) => (
                                <option key={`visitor-tag-${index}-${tag}`} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {editFormData.logoUrl ? (
                        <Image
                          src={editFormData.logoUrl}
                          alt={editFormData.companyName || 'Company Logo'}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M14 14l1.586-1.586a2 2 0 012.828 0L20 14"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="8.5" cy="7.5" r="1.75" />
                        </svg>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {editFormData.companyName || '-'}
                      </p>
                      <p className="text-xs text-gray-500">{editTarget?.email || ''}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-companyName"
                        >
                          {t.companyName}
                        </label>
                        <input
                          id="edit-companyName"
                          type="text"
                          value={editFormData.companyName}
                          onChange={(e) => handleEditInputChange('companyName', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-taxId"
                        >
                          {t.taxId}
                        </label>
                        <input
                          id="edit-taxId"
                          type="text"
                          value={editFormData.taxId}
                          onChange={(e) => handleEditInputChange('taxId', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-companyPhone"
                        >
                          {t.companyPhone}
                        </label>
                        <input
                          id="edit-companyPhone"
                          type="text"
                          value={editFormData.companyPhone}
                          onChange={(e) => handleEditInputChange('companyPhone', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-branchId"
                        >
                          {t.branchId}
                        </label>
                        <input
                          id="edit-branchId"
                          type="text"
                          value={editFormData.branchId}
                          onChange={(e) => handleEditInputChange('branchId', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-companyEmail"
                        >
                          {t.companyEmail}
                        </label>
                        <input
                          id="edit-companyEmail"
                          type="email"
                          value={editFormData.companyEmail}
                          onChange={(e) => handleEditInputChange('companyEmail', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-companyWebsite"
                        >
                          {t.companyWebsite}
                        </label>
                        <input
                          id="edit-companyWebsite"
                          type="text"
                          value={editFormData.companyWebsite}
                          onChange={(e) =>
                            handleEditInputChange('companyWebsite', e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>

                      {/* ช่องกรอกลิงก์โลโก้ */}
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-logoUrl"
                        >
                          {t.companyLogoUrl || 'Logo URL'}
                        </label>
                        <input
                          id="edit-logoUrl"
                          type="text"
                          placeholder="https://example.com/logo.png"
                          value={editFormData.logoUrl}
                          onChange={(e) => handleLogoUrlChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {t.logoRequirementsUrl ||
                            'กรอกลิงก์รูปภาพ (ต้องเป็นลิงก์ไฟล์ .png, .jpg, .jpeg, .webp, .gif, .svg ที่เข้าถึงได้สาธารณะ)'}
                        </p>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-600 mb-1"
                          htmlFor="edit-companyDescription"
                        >
                          {t.companyDescription}
                        </label>
                        <textarea
                          id="edit-companyDescription"
                          value={editFormData.companyDescription}
                          onChange={(e) =>
                            handleEditInputChange('companyDescription', e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 min-h-[80px]"
                          disabled={editSaving}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {t.tagsTitle}
                      </label>
                      <div className="space-y-2">
                        {[0].map((index) => {
                          const currentValue = editCategories[index] || '';
                          const availableTags = getTagOptions(currentValue);
                          return (
                            <select
                              key={`edit-category-${index}`}
                              value={currentValue}
                              onChange={(e) => handleEditCategoryChange(index, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
                              disabled={editSaving}
                            >
                              <option value="">{t.selectCategory}</option>
                              {availableTags.map((tag) => (
                                <option key={`edit-tag-${index}-${tag}`} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {editMessage.text && (
                <div
                  className={`mt-4 rounded-xl px-4 py-2 text-sm ${
                    editMessage.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {editMessage.text}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                onClick={closeEditModal}
                disabled={editSaving}
              >
                {t.editCancel}
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveEditedProfile}
                disabled={editSaving || editLoading}
              >
                {editSaving ? '...' : t.editSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeDeleteModal}
              aria-label="Close delete modal"
              disabled={deletingUserId === deleteTarget.id}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.deleteTitle}</h3>
            <p className="text-sm text-gray-600">{t.deleteMessage}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                onClick={closeDeleteModal}
                disabled={deletingUserId === deleteTarget.id}
              >
                {t.deleteCancel}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-[#FFE5E1] text-[#FF5630] text-sm font-semibold hover:bg-[#ffd6cf] disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleDeleteUser}
                disabled={deletingUserId === deleteTarget.id}
              >
                {deletingUserId === deleteTarget.id ? '...' : t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
