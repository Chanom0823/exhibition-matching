'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import jsPDF from 'jspdf';
import ExportButtons from '@/app/components/ExportButtons';
import translations from '@/app/components/translations';
import { useLanguage } from '@/app/contexts/LanguageProvider';
import SearchFilter from '@/app/components/SearchFilter';




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
  logo: null,
  logoPreview: null,
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
  const languageDropdownRef = useRef(null);
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
  const [editCategories, setEditCategories] = useState(['']);
  const [visitorFormData, setVisitorFormData] = useState(getInitialVisitorForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState({ type: '', text: '' });
  const [previewUserId, setPreviewUserId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [problemTags, setProblemTags] = useState([]);
  const getTagOptions = (currentValue) => {
    const tagNames = problemTags.map((tag) => tag.name).filter(Boolean);
    if (!currentValue) {
      return tagNames;
    }
    return tagNames.includes(currentValue) ? tagNames : [currentValue, ...tagNames];
  };
  const getTagColor = (tagName) =>
    problemTags.find((tag) => tag.name === tagName)?.color || '';

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

  useEffect(() => {
    const fetchProblemTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, 'problemTags'));
        const tagsMap = new Map();
        tagsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const name = data?.name?.trim();
          if (name && !tagsMap.has(name)) {
            tagsMap.set(name, {
              name,
              color: data?.color || '',
            });
          }
        });
        setProblemTags(Array.from(tagsMap.values()));
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
        // Fetch users, visitor submissions, and exhibitor profiles
        const [usersSnapshot, submissionsSnapshot, exhibitorsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'userPanelSubmissions')),
          getDocs(collection(db, 'exhibitors')),
        ]);

        const exhibitorProfiles = new Map();
        exhibitorsSnapshot.docs.forEach((docSnap) => {
          exhibitorProfiles.set(docSnap.id, docSnap.data() || {});
        });

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

        const matchedSubmissionIds = new Set();

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
            matchedSubmissionIds.add(matchedSubmission.id);
            userRole = 'visitor';
          }
          const exhibitorProfile = exhibitorProfiles.get(docSnap.id) || null;
          if (exhibitorProfile) {
            userRole = 'exhibitor';
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
            isVisitorOnly: false,
            exhibitorProfile,
          };
        });

        const visitorOnlyEntries = submissionsSnapshot.docs
          .filter((docSnap) => !matchedSubmissionIds.has(docSnap.id))
          .map((docSnap) => {
            const data = docSnap.data() || {};
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

        // Sort by createdAt (newest first)
        const combinedUsers = [...usersList, ...visitorOnlyEntries];
        combinedUsers.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt - a.createdAt;
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
    } else if (targetTab === 'pdpaManagement') {
      router.push('/admin-dashboard/pdpa-management');
    }
  };

  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  // 🔍 Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [tagNameFilter, setTagNameFilter] = useState('all');
  const [tagColorFilter, setTagColorFilter] = useState('all');

  const filteredUsers = usersData.users.filter((user) => {
    if (roleFilter === 'visitors') return user.role === 'visitor';
    if (roleFilter === 'exhibitors') return user.role === 'exhibitor';
    return true;
  });

  const uniqueTagNames = Array.from(
    new Set(problemTags.map((tag) => tag.name).filter(Boolean))
  );

  const uniqueTagColors = Array.from(
    new Set(problemTags.map((tag) => tag.color).filter(Boolean))
  );

  // สร้าง exhibitorUsers (ตาม roleFilter)
  const exhibitorUsers = filteredUsers.filter(
    (user) => user.role === "exhibitor"
  );

  // ฟังก์ชันดึงสีแท็ก
  const findTagColor = (tagName) => {
    const tag = problemTags.find((t) => t.name === tagName);
    return tag?.color || "";
  };

  // ผลลัพธ์สุดท้ายหลัง Search + Filter
  const visibleExhibitorUsers = exhibitorUsers.filter((user) => {
    const text = searchTerm.trim().toLowerCase();

    const username = (user.username || "").toLowerCase();
    const companyName = (user.exhibitorProfile?.companyName || "").toLowerCase();

    // 1) Search โดยชื่อ user หรือชื่อบริษัท
    const matchesSearch =
      !text || username.includes(text) || companyName.includes(text);

    // 2) Filter โดยชื่อแท็ก
    const categories = user.exhibitorProfile?.categories || [];
    const primaryTag = categories[0] || "";
    const matchesTagName =
      tagNameFilter === "all" || primaryTag === tagNameFilter;

    // 3) Filter โดยสีแท็ก
    const primaryColor = findTagColor(primaryTag);
    const matchesTagColor =
      tagColorFilter === "all" || primaryColor === tagColorFilter;

    return matchesSearch && matchesTagName && matchesTagColor;
  });



  const resetEditState = () => {
    setEditFormData(getInitialProfileForm());
    setEditCategories(['']);
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
    setEditCategories(['']);
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
              ],
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
          while (filledCategories.length < 1) {
            filledCategories.push('');
          }
          setEditCategories(filledCategories.slice(0, 1));
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
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            {/* Page Title */}
            <h1 className="text-4xl font-bold text-gray-900 whitespace-nowrap">{t.visitormatching}</h1>
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
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${selectedLanguage.code === option.code
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
            {/* 🔍 Search + Filter (เพิ่มใหม่ตรงนี้) */}
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              tagNameFilter={tagNameFilter}
              onTagNameChange={setTagNameFilter}
              tagColorFilter={tagColorFilter}
              onTagColorChange={setTagColorFilter}
              uniqueTagNames={uniqueTagNames}
              uniqueTagColors={uniqueTagColors}
              languageCode={selectedLanguage.code}
            />
            {/* Exhibitor Matching Content - Table */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="overflow-x-auto">
                {usersData.loading ? (
                  <div className="text-center py-8 text-gray-500">
                    {selectedLanguage.code === 'TH' ? t.loading : t.loadingJP}
                  </div>
                ) : exhibitorUsers.length === 0 ? (
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
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-1/6 min-w-[220px]">
                          {selectedLanguage.code === 'TH' ? t.fullName : t.fullNameJP}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-1/6 min-w-[220px]">
                          {selectedLanguage.code === 'TH' ? t.companyNamePlaceholder : t.companyNamePlaceholderJP}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tagColorLabel}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t.tagNameLabel}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {selectedLanguage.code === 'TH' ? t.tableActions : t.tableActionsJP}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleExhibitorUsers.map((user, index) => {
                        const exhibitorCategories = user.exhibitorProfile?.categories || [];
                        const primaryTag = exhibitorCategories[0] || '';
                        const primaryTagColor = primaryTag ? getTagColor(primaryTag) : '';
                        return (
                          <Fragment key={user.id}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900 w-2/5 min-w-[220px] whitespace-normal break-words">
                                {user.username}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {primaryTag ? (
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-4 h-4 rounded border border-gray-200"
                                      style={{ backgroundColor: primaryTagColor || "#e5e7eb" }}
                                    />
                                    <span className="text-xs font-mono text-gray-700">
                                      {primaryTagColor || "-"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {primaryTag || "-"}
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
                                </div>
                              </td>
                            </tr>
                            {previewUserId === user.id && (
                              <tr className="border-b border-gray-100">
                                <td colSpan={5} className="bg-gray-50 px-4 py-4">
                                  {previewLoading ? (
                                    <div className="text-sm text-gray-500">{selectedLanguage.code === 'TH' ? t.loading : t.loadingJP}</div>
                                  ) : !previewData ? (
                                    <div className="text-sm text-gray-500">{t.previewNoData}</div>
                                  ) : previewData.type === 'visitor' ? (
                                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{selectedLanguage.code === 'TH' ? t.previewVisitorSection : t.previewVisitorSectionJP}</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                        <div>
                                          <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.visitorFullName : t.visitorFullNameJP}</p>
                                          <p className="font-medium">{previewData.payload?.fullName || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.visitorCompanyName : t.visitorCompanyNameJP}</p>
                                          <p className="font-medium">{previewData.payload?.companyName || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.previewContact : t.previewContactJP}</p>
                                          <p className="font-medium">{previewData.payload?.contact || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.visitorCategoriesLabel : t.visitorCategoriesLabelJP}</p>
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
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{selectedLanguage.code === 'TH' ? t.previewExhibitorSection : t.previewExhibitorSectionJP}</h4>
                                      {previewData.payload ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                          <div>
                                            <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.companyName : t.companyNameJP}</p>
                                            <p className="font-medium">{previewData.payload.companyName || '-'}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.companyEmail : t.companyEmailJP}</p>
                                            <p className="font-medium">{previewData.payload.companyEmail || '-'}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.companyPhone : t.companyPhoneJP}</p>
                                            <p className="font-medium">{previewData.payload.companyPhone || '-'}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.companyWebsite : t.companyWebsiteJP}</p>
                                            <p className="font-medium">{previewData.payload.website || '-'}</p>
                                          </div>
                                          <div className="md:col-span-2">
                                            <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.companyDescription : t.companyDescriptionJP}</p>
                                            <p className="font-medium mt-1 text-gray-700">
                                              {previewData.payload.companyDescription || '-'}
                                            </p>
                                          </div>
                                          <div className="md:col-span-2">
                                            <p className="text-gray-500">{selectedLanguage.code === 'TH' ? t.tagsTitle : t.tagsTitleJP}</p>
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
                                        <div className="text-sm text-gray-500">{selectedLanguage.code === 'TH' ? t.previewNoData : t.previewNoDataJP}</div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

