'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

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

const translations = {
  TH: {
    dashboard: 'Dashboard',
    tabs: ['DashBoard', 'User Management', 'Problem Tag Management', 'Homepage Management', 'PDPA Management'],
    searchPlaceholder: 'Search...',
    userManagement: 'User Management',
    totalParticipants: 'จำนวนผู้เข้างานทั้งหมด',
    totalVisitors: 'จำนวนผู้เข้าชม',
    totalExhibitors: 'จำนวน exhibitors',
    logout: 'ออกจากระบบ',
    export: 'Export',
    tableNo: 'ลำดับ',
    tableUsername: 'ชื่อผู้ใช้งาน',
    tableRole: 'สิทธิ์การใช้งาน',
    tableCreatedAt: 'เวลาที่กรอกข้อมูล',
    tableActions: 'จัดการข้อมูล',
    filterAllUsers: 'ทั้งหมด',
    filterVisitors: 'Visitors',
    filterExhibitors: 'Exhibitors',
    loading: 'กำลังโหลด...',
    noUsers: 'ไม่พบข้อมูลผู้ใช้',
    deleteTitle: 'ลบผู้ใช้งาน?',
    deleteMessage: 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานคนนี้? เมื่อยืนยันแล้วข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบถาวร',
    deleteConfirm: 'ใช่, ลบผู้ใช้งาน',
    deleteCancel: 'ยกเลิก',
    editProfileTitle: 'แก้ไขข้อมูลโปรไฟล์',
    editProfileDescription: 'ปรับปรุงข้อมูลบริษัทและหมวดหมู่ความเชี่ยวชาญ',
    editLoading: 'กำลังโหลดข้อมูล...',
    editSave: 'บันทึกการเปลี่ยนแปลง',
    editCancel: 'ยกเลิก',
    companyName: 'ชื่อบริษัท',
    taxId: 'เลขประจำตัวผู้เสียภาษี',
    branchId: 'รหัสสาขา',
    companyPhone: 'เบอร์โทรบริษัท',
    companyEmail: 'อีเมลบริษัท',
    companyWebsite: 'เว็บไซต์บริษัท',
    companyLogo: 'โลโก้บริษัท',
    companyDescription: 'รายละเอียดเพิ่มเติม',
    tagsTitle: 'หมวดหมู่ความเชี่ยวชาญ',
    selectCategory: 'เลือกหมวดหมู่ปัญหา',
    uploadLogo: 'อัปโหลดโลโก้',
    logoRequirements: 'รองรับไฟล์ภาพสูงสุด 5MB',
    validationCompany: 'กรุณากรอกชื่อบริษัท',
    validationCategory: 'กรุณาเลือกหมวดหมู่ความเชี่ยวชาญอย่างน้อย 1 หมวด',
    editSuccess: 'บันทึกข้อมูลโปรไฟล์สำเร็จ',
    logoSizeError: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB',
    logoTypeError: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น',
    visitorFullName: 'ชื่อ-นามสกุล',
    visitorCompanyName: 'ชื่อองค์กร/บริษัท',
    visitorContact: 'ข้อมูลติดต่อ (อีเมลหรือเบอร์โทร)',
    visitorCategoriesLabel: 'หมวดหมู่ปัญหาที่สนใจ',
    visitorValidationFullName: 'กรุณากรอกชื่อ-นามสกุล',
    visitorValidationCompany: 'กรุณากรอกชื่อองค์กรหรือบริษัท',
    visitorValidationCategory: 'กรุณาเลือกปัญหาที่สนใจอย่างน้อย 1 หมวด',
    visitorSaveSuccess: 'บันทึกข้อมูลผู้เข้าชมสำเร็จ',
    visitorSaveError: 'ไม่สามารถบันทึกข้อมูลผู้เข้าชมได้',
    previewTitle: 'รายละเอียดการลงทะเบียน',
    previewExhibitorSection: 'ข้อมูล Exhibitor',
    previewVisitorSection: 'ข้อมูลผู้เข้าชม',
    previewContact: 'ช่องทางติดต่อ',
    previewNoData: 'ไม่พบข้อมูลการลงทะเบียน',
  },
  EN: {
    dashboard: 'Dashboard',
    tabs: ['DashBoard', 'User Management', 'Problem Tag Management', 'Homepage Management', 'PDPA Management'],
    searchPlaceholder: 'Search...',
    userManagement: 'User Management',
    totalParticipants: 'Total Participants',
    totalVisitors: 'Total Visitors',
    totalExhibitors: 'Total Exhibitors',
    logout: 'Logout',
    export: 'Export',
    tableNo: 'No.',
    tableUsername: 'Username',
    tableRole: 'Role',
    tableCreatedAt: 'Created At',
    tableActions: 'Actions',
    filterAllUsers: 'All',
    filterVisitors: 'Visitors',
    filterExhibitors: 'Exhibitors',
    loading: 'Loading...',
    noUsers: 'No users found',
    deleteTitle: 'Delete user?',
    deleteMessage: 'Are you sure you want to delete this user? Once deleted, all associated data will be permanently lost.',
    deleteConfirm: 'Yes, Delete',
    deleteCancel: 'Cancel',
    editProfileTitle: 'Edit Profile Information',
    editProfileDescription: 'Update company information and expertise categories',
    editLoading: 'Loading profile...',
    editSave: 'Save Changes',
    editCancel: 'Cancel',
    companyName: 'Company Name',
    taxId: 'Tax ID',
    branchId: 'Branch ID',
    companyPhone: 'Company Phone',
    companyEmail: 'Company Email',
    companyWebsite: 'Company Website',
    companyLogo: 'Company Logo',
    companyDescription: 'Company Description',
    tagsTitle: 'Expertise Categories',
    selectCategory: 'Select problem category',
    uploadLogo: 'Upload Logo',
    logoRequirements: 'Supports image files up to 5MB',
    validationCompany: 'Please enter a company name',
    validationCategory: 'Please select at least one expertise category',
    editSuccess: 'Profile information updated successfully',
    logoSizeError: 'Image file must be 5MB or smaller',
    logoTypeError: 'Please upload an image file',
    visitorFullName: 'Full Name',
    visitorCompanyName: 'Organization / Company Name',
    visitorContact: 'Contact (Email or Phone)',
    visitorCategoriesLabel: 'Interested Problem Categories',
    visitorValidationFullName: 'Please enter a full name',
    visitorValidationCompany: 'Please enter an organization or company name',
    visitorValidationCategory: 'Please select at least one interested problem',
    visitorSaveSuccess: 'Visitor information updated successfully',
    visitorSaveError: 'Unable to update visitor information',
    previewTitle: 'Registration Details',
    previewExhibitorSection: 'Exhibitor Information',
    previewVisitorSection: 'Visitor Information',
    previewContact: 'Contact',
    previewNoData: 'No registration data available',
  },
  JP: {
    dashboard: 'ダッシュボード',
    tabs: ['ダッシュボード', 'ユーザー管理', '問題タグ管理', 'ホームページ管理', 'PDPA管理'],
    searchPlaceholder: '検索...',
    userManagement: 'ユーザー管理',
    totalParticipants: '総参加者数',
    totalVisitors: '総訪問者数',
    totalExhibitors: '出展者数',
    logout: 'ログアウト',
    export: 'Export',
    tableNo: '番号',
    tableUsername: 'ユーザー名',
    tableRole: '役割',
    tableCreatedAt: '作成日時',
    tableActions: '管理',
    filterAllUsers: 'すべて',
    filterVisitors: '訪問者',
    filterExhibitors: '出展者',
    loading: '読み込み中...',
    noUsers: 'ユーザーが見つかりません',
    deleteTitle: 'ユーザーを削除しますか？',
    deleteMessage: 'このユーザーを削除してもよろしいですか？削除すると、関連するすべてのデータが永久に失われます。',
    deleteConfirm: '削除する',
    deleteCancel: 'キャンセル',
    editProfileTitle: 'プロフィール情報を編集',
    editProfileDescription: '会社情報と専門カテゴリを更新します',
    editLoading: 'プロフィールを読み込み中...',
    editSave: '変更を保存',
    editCancel: 'キャンセル',
    companyName: '会社名',
    taxId: '税番号',
    branchId: '支店ID',
    companyPhone: '会社電話',
    companyEmail: '会社メール',
    companyWebsite: '会社ウェブサイト',
    companyLogo: '会社ロゴ',
    companyDescription: '詳細情報',
    tagsTitle: '専門カテゴリ',
    selectCategory: '問題カテゴリを選択',
    uploadLogo: 'ロゴをアップロード',
    logoRequirements: '最大5MBの画像ファイルに対応',
    validationCompany: '会社名を入力してください',
    validationCategory: '少なくとも1つの専門カテゴリを選択してください',
    editSuccess: 'プロフィール情報を更新しました',
    logoSizeError: '画像ファイルは5MB以下にしてください',
    logoTypeError: '画像ファイルをアップロードしてください',
    visitorFullName: '氏名',
    visitorCompanyName: '所属 / 会社名',
    visitorContact: '連絡先（メールまたは電話）',
    visitorCategoriesLabel: '興味のある課題カテゴリ',
    visitorValidationFullName: '氏名を入力してください',
    visitorValidationCompany: '所属または会社名を入力してください',
    visitorValidationCategory: '少なくとも1つの課題カテゴリを選択してください',
    visitorSaveSuccess: '訪問者情報を更新しました',
    visitorSaveError: '訪問者情報を更新できませんでした',
    previewTitle: '登録情報の詳細',
    previewExhibitorSection: '出展者情報',
    previewVisitorSection: '訪問者情報',
    previewContact: '連絡先',
    previewNoData: '登録情報が見つかりません',
  },
};

const getInitialProfileForm = () => ({
  companyName: '',
  taxId: '',
  branchId: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
  companyDescription: '',
  logoUrl: '',
  logo: null,
  logoPreview: null,
});

const getInitialVisitorForm = () => ({
  fullName: '',
  companyName: '',
  contact: '',
  categories: ['', '', ''],
});

export default function UserManagementPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState('userManagement');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Summary Cards data
  const [summaryData, setSummaryData] = useState({
    totalParticipants: 0,
    totalVisitors: 0,
    totalExhibitors: 0,
    loading: true,
  });

  // Users table data
  const [usersData, setUsersData] = useState({
    users: [],
    loading: true,
  });
  const [roleFilter, setRoleFilter] = useState('all');
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState(getInitialProfileForm());
  const [editCategories, setEditCategories] = useState(['', '', '']);
  const [visitorFormData, setVisitorFormData] = useState(getInitialVisitorForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState({ type: '', text: '' });
  const [previewUserId, setPreviewUserId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Fetch summary data from Firebase
  useEffect(() => {
    const updateSummaryData = async () => {
      try {
        // Fetch total participants (from userPanelSubmissions)
        const submissionsRef = collection(db, 'userPanelSubmissions');
        const submissionsSnapshot = await getDocs(submissionsRef);
        const totalParticipants = submissionsSnapshot.size;

        // Fetch total visitors (from users collection)
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
        // Fetch both users and userPanelSubmissions
        const [usersSnapshot, submissionsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'userPanelSubmissions')),
        ]);

        // Helper function to normalize contact info (remove spaces, special chars, lowercase)
        const normalizeContact = (contact) => {
          if (!contact || contact === '-') return '';
          // Remove all spaces, dashes, parentheses, plus signs, and convert to lowercase
          return String(contact).toLowerCase().trim().replace(/[\s\-\(\)\+]/g, '');
        };

        // Helper function to normalize name (for matching by fullName)
        const normalizeName = (name) => {
          if (!name || name === '-') return '';
          return String(name).toLowerCase().trim().replace(/\s+/g, '');
        };

        // Create maps of normalized contacts and names from userPanelSubmissions for quick lookup
        const submissionsContacts = new Map();
        const submissionsNames = new Map();
        submissionsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
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

        const usersList = usersSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const email = normalizeContact(data.email);
          const phoneNumber = normalizeContact(data.phoneNumber);
          const fullName = normalizeName(data.fullName);
          
          let matchedSubmission = null;
          if (email && submissionsContacts.has(email)) {
            matchedSubmission = submissionsContacts.get(email);
          } else if (phoneNumber && submissionsContacts.has(phoneNumber)) {
            matchedSubmission = submissionsContacts.get(phoneNumber);
          } else if (fullName && submissionsNames.has(fullName)) {
            matchedSubmission = submissionsNames.get(fullName);
          }

          let userRole = data.role || '-';
          if (matchedSubmission) {
            userRole = 'visitor';
          }

          return {
            id: docSnap.id,
            username: data.username || '-',
            role: userRole,
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null,
            email: data.email || '-',
            fullName: data.fullName || data.username || '-',
            visitorSubmissionId: matchedSubmission?.id || null,
            visitorSubmissionData: matchedSubmission?.data || null,
          };
        });

        // Sort by createdAt (newest first)
        usersList.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt - a.createdAt;
        });

        setUsersData({
          users: usersList,
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

  const handleTabClick = (targetTab) => {
    setActiveTab(targetTab);
    if (targetTab === 'dashboard') {
      router.push('/admin-dashboard');
    } else if (targetTab === 'problemTagManagement') {
      router.push('/admin-dashboard/problem-tag-management');
    } else if (targetTab === 'homepageManagement') {
      router.push('/admin-dashboard/homepage-management');
    } else if (targetTab === 'pdpaManagement') {
      router.push('/admin-dashboard/pdpa-management');
    }
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;
  const filteredUsers = usersData.users.filter((user) => {
    if (roleFilter === 'visitors') return user.role === 'visitor';
    if (roleFilter === 'exhibitors') return user.role === 'exhibitor';
    return true;
  });

  const resetEditState = () => {
    setEditFormData(getInitialProfileForm());
    setEditCategories(['', '', '']);
    setEditMessage({ type: '', text: '' });
    setEditTarget(null);
    setVisitorFormData(getInitialVisitorForm());
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCategoryChange = (index, value) => {
    setEditCategories((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleEditLogoChange = (event) => {
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
      setEditFormData((prev) => ({
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

  const handleVisitorInputChange = (field, value) => {
    setVisitorFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVisitorCategoryChange = (index, value) => {
    setVisitorFormData((prev) => {
      const categories = [...prev.categories];
      categories[index] = value;
      return {
        ...prev,
        categories,
      };
    });
  };

  const handleTogglePreview = async (user) => {
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
          const submissionSnap = await getDoc(doc(db, 'userPanelSubmissions', user.visitorSubmissionId));
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

  const openEditModal = async (user) => {
    if (!user) return;
    setEditTarget(user);
    setIsEditModalOpen(true);
    setEditLoading(true);
    setEditMessage({ type: '', text: '' });
    setEditFormData(getInitialProfileForm());
    setEditCategories(['', '', '']);
    setVisitorFormData(getInitialVisitorForm());

    try {
      if (user.role === 'visitor') {
        if (user.visitorSubmissionId) {
          const submissionRef = doc(db, 'userPanelSubmissions', user.visitorSubmissionId);
          const submissionSnap = await getDoc(submissionRef);
          if (submissionSnap.exists()) {
            const submissionData = submissionSnap.data();
            setVisitorFormData({
              fullName: submissionData.fullName || user.fullName || user.username || '',
              companyName: submissionData.companyName || '',
              contact: submissionData.contact || user.email || '',
              categories: [
                submissionData.categories?.[0] || '',
                submissionData.categories?.[1] || '',
                submissionData.categories?.[2] || '',
              ],
            });
          } else {
            setVisitorFormData({
              fullName: user.fullName || user.username || '',
              companyName: '',
              contact: user.email || '',
              categories: ['', '', ''],
            });
          }
        } else {
          setVisitorFormData({
            fullName: user.fullName || user.username || '',
            companyName: '',
            contact: user.email || '',
            categories: ['', '', ''],
          });
        }
        setEditLoading(false);
        return;
      }
      const profileRef = doc(db, 'exhibitors', user.id);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
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
          while (filledCategories.length < 3) {
            filledCategories.push('');
          }
          setEditCategories(filledCategories.slice(0, 3));
        }
      } else {
        setEditFormData((prev) => ({
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
        if (visitorFormData.categories.filter((cat) => cat && cat.trim() !== '').length === 0) {
          setEditMessage({ type: 'error', text: t.visitorValidationCategory });
          setEditSaving(false);
          return;
        }

        let submissionId = editTarget.visitorSubmissionId;
        const submissionPayload = {
          fullName: visitorFormData.fullName.trim(),
          companyName: visitorFormData.companyName.trim(),
          contact: visitorFormData.contact.trim(),
          categories: visitorFormData.categories.filter((cat) => cat && cat.trim() !== ''),
          updatedAt: new Date().toISOString(),
          language: selectedLanguage.code,
        };

        if (submissionId) {
          await setDoc(doc(db, 'userPanelSubmissions', submissionId), submissionPayload, { merge: true });
        } else {
          const newDoc = await addDoc(collection(db, 'userPanelSubmissions'), submissionPayload);
          submissionId = newDoc.id;
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

        let logoUrl = editFormData.logoUrl;

        if (editFormData.logo) {
          const logoRef = ref(storage, `exhibitors/${editTarget.id}/logo/${Date.now()}_${editFormData.logo.name}`);
          await uploadBytes(logoRef, editFormData.logo);
          logoUrl = await getDownloadURL(logoRef);
        }

        const profilePayload = {
          companyName: editFormData.companyName.trim(),
          taxId: editFormData.taxId.trim(),
          branchId: editFormData.branchId.trim(),
          companyPhone: editFormData.companyPhone.trim(),
          companyEmail: editFormData.companyEmail.trim(),
          website: editFormData.companyWebsite.trim(),
          companyDescription: editFormData.companyDescription.trim(),
          logoUrl,
          categories: editCategories.filter((cat) => cat && cat.trim() !== ''),
          updatedAt: new Date().toISOString(),
          isComplete: true,
        };

        await setDoc(doc(db, 'exhibitors', editTarget.id), profilePayload, { merge: true });

        setEditFormData((prev) => ({
          ...prev,
          logo: null,
          logoUrl,
          logoPreview: logoUrl || prev.logoPreview,
        }));
        setEditMessage({ type: 'success', text: t.editSuccess });
      }
    } catch (error) {
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

  const openDeleteModal = (user) => {
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
      await deleteDoc(doc(db, 'users', userId));

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
                const tabKeys = ['dashboard', 'userManagement', 'problemTagManagement', 'homepageManagement', 'pdpaManagement'];
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
                    onClick={() => handleTabClick(targetTab)}
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
            {/* Page Title */}
            <h1 className="text-4xl font-bold text-gray-900 whitespace-nowrap">{t.userManagement}</h1>
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
            
            <div className="flex items-end justify-end w-full">
              <div className="relative" ref={languageDropdownRef}>
                <div className="flex items-end justify-end gap-3 cursor-pointer">
                  <button
                    type="button"
                    className="bg-gray-800 text-white rounded-lg px-3 h-[36px] flex items-center justify-center gap-2 hover:bg-gray-700 transition"
                    aria-label={t.export}
                    title={t.export}
                  >
                    <Image
                      src="/import-export.png"
                      alt={t.export}
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px] brightness-0 invert"
                    />
                    <span className="text-sm">{t.export}</span>
                  </button>
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-4 bg-[#f5f5f5]">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
                      {summaryData.loading ? '...' : (summaryData.totalParticipants ?? 0).toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalParticipants}</p>
                  </div>
                </div>
              </div>

              {/* Total Visitors */}
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
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" />
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

              {/* Total Exhibitors */}
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
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 21v-8H7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : (summaryData.totalExhibitors ?? 0).toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalExhibitors}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Management Content - Table */}
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
                  {t.filterAllUsers}
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
                  {t.filterVisitors}
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
                  {t.filterExhibitors}
                </button>
              </div>
              <div className="overflow-x-auto">
                {usersData.loading ? (
                  <div className="text-center py-8 text-gray-500">
                    {t.loading}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t.noUsers}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tableNo}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tableUsername}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tableRole}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tableCreatedAt}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tableActions}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <Fragment key={user.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
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
                            <td className="py-3 px-4 text-sm text-gray-600">
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
                                  <div className="text-sm text-gray-500">{t.loading}</div>
                                ) : !previewData ? (
                                  <div className="text-sm text-gray-500">{t.previewNoData}</div>
                                ) : previewData.type === 'visitor' ? (
                                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">{t.previewVisitorSection}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                      <div>
                                        <p className="text-gray-500">{t.visitorFullName}</p>
                                        <p className="font-medium">{previewData.payload?.fullName || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">{t.visitorCompanyName}</p>
                                        <p className="font-medium">{previewData.payload?.companyName || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">{t.previewContact}</p>
                                        <p className="font-medium">{previewData.payload?.contact || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">{t.visitorCategoriesLabel}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(previewData.payload?.categories || []).length > 0 ? (
                                            previewData.payload.categories.map((category, idx) => (
                                              <span
                                                key={`${user.id}-visitor-cat-${idx}`}
                                                className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                                              >
                                                {category}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">{t.previewExhibitorSection}</h4>
                                    {previewData.payload ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                        <div>
                                          <p className="text-gray-500">{t.companyName}</p>
                                          <p className="font-medium">{previewData.payload.companyName || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">{t.companyEmail}</p>
                                          <p className="font-medium">{previewData.payload.companyEmail || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">{t.companyPhone}</p>
                                          <p className="font-medium">{previewData.payload.companyPhone || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">{t.companyWebsite}</p>
                                          <p className="font-medium">{previewData.payload.website || '-'}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-gray-500">{t.companyDescription}</p>
                                          <p className="font-medium mt-1 text-gray-700">
                                            {previewData.payload.companyDescription || '-'}
                                          </p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-gray-500">{t.tagsTitle}</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {(previewData.payload.categories || []).length > 0 ? (
                                              previewData.payload.categories.map((category, idx) => (
                                                <span
                                                  key={`${user.id}-exhibitor-cat-${idx}`}
                                                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                                                >
                                                  {category}
                                                </span>
                                              ))
                                            ) : (
                                              <span className="text-xs text-gray-400">-</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500">{t.previewNoData}</div>
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
                      <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="visitor-fullName">
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
                      <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="visitor-companyName">
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
                      <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="visitor-contact">
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
                        {[0, 1, 2].map((index) => (
                          <select
                            key={`visitor-category-${index}`}
                            value={visitorFormData.categories[index] || ''}
                            onChange={(e) => handleVisitorCategoryChange(index, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
                            disabled={editSaving}
                          >
                            <option value="">{t.selectCategory}</option>
                            <option value="category1">Category 1</option>
                            <option value="category2">Category 2</option>
                            <option value="category3">Category 3</option>
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {editFormData.logoPreview ? (
                        <Image
                          src={editFormData.logoPreview}
                          alt={editFormData.companyName || 'Company Logo'}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 14l1.586-1.586a2 2 0 012.828 0L20 14" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="8.5" cy="7.5" r="1.75" />
                        </svg>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{editFormData.companyName || '-'}</p>
                      <p className="text-xs text-gray-500">{editTarget?.email || ''}</p>
                    </div>
                    <label
                      htmlFor="edit-logo-upload"
                      className="w-full text-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 cursor-pointer hover:border-gray-400 transition"
                    >
                      {t.uploadLogo}
                    </label>
                    <input
                      id="edit-logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditLogoChange}
                      disabled={editSaving}
                    />
                    <p className="text-xs text-gray-500 text-center">{t.logoRequirements}</p>
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-companyName">
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
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-taxId">
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
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-companyPhone">
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
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-branchId">
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
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-companyEmail">
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
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-companyWebsite">
                          {t.companyWebsite}
                        </label>
                        <input
                          id="edit-companyWebsite"
                          type="text"
                          value={editFormData.companyWebsite}
                          onChange={(e) => handleEditInputChange('companyWebsite', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          disabled={editSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="edit-companyDescription">
                          {t.companyDescription}
                        </label>
                        <textarea
                          id="edit-companyDescription"
                          value={editFormData.companyDescription}
                          onChange={(e) => handleEditInputChange('companyDescription', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 min-h-[80px]"
                          disabled={editSaving}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">{t.tagsTitle}</label>
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => (
                          <select
                            key={`edit-category-${index}`}
                            value={editCategories[index] || ''}
                            onChange={(e) => handleEditCategoryChange(index, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
                            disabled={editSaving}
                          >
                            <option value="">{t.selectCategory}</option>
                            <option value="category1">Category 1</option>
                            <option value="category2">Category 2</option>
                            <option value="category3">Category 3</option>
                          </select>
                        ))}
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

