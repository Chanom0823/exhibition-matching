"use client";

import React from "react";
import Image from "next/image";

type ExportButtonsProps = {
  exportPdfLabel?: string;
  exportExcelLabel?: string;
  // Admin Dashboard data
  summaryData?: {
    totalParticipants: number;
    totalVisitors: number;
    totalExhibitors: number;
  };
  comparisonData?: {
    exhibitors: number;
    visitors: number;
  };
  categoryData?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  tableData?: Array<{
    id: string;
    no: number;
    name: string;
    companyName: string;
    phone: string;
    email: string;
    categories: string[];
    isContacted: boolean;
  }>;
  // User Management data
  usersData?: Array<{
    id: string;
    username: string;
    role: string;
    createdAt: any;
    email?: string;
    fullName?: string;
    companyName?: string;
    phoneNumber?: string;
  }>;
  roleFilter?: string;
  translations?: any;
  selectedLanguage?: { code: string; label: string };
  exportType?: 'dashboard' | 'userManagement'; // To distinguish export type
};

const ExportButtons: React.FC<ExportButtonsProps> = ({
  exportPdfLabel = "Export PDF",
  exportExcelLabel = "Export Excel",
  summaryData,
  comparisonData,
  categoryData,
  tableData,
  usersData,
  roleFilter,
  translations,
  selectedLanguage,
  exportType = 'dashboard',
}) => {
  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Helper function to load font as base64
  const loadFontAsBase64 = async (fontPath: string): Promise<string> => {
    try {
      const response = await fetch(fontPath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:application/octet-stream;base64, prefix if present
          resolve(base64.split(",")[1] || base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading font:", error);
      throw error;
    }
  };

  // ฟังก์ชัน Export เป็น PDF
  const handleExportPDF = async () => {
    // Check required data based on export type
    if (exportType === 'userManagement') {
      if (!usersData || !summaryData || !translations) {
        return;
      }
    } else {
      if (!summaryData || !comparisonData || !categoryData || !tableData || !translations) {
        return;
      }
    }

    // import แบบ dynamic ป้องกัน error window is not defined
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const pdf = new jsPDF();
    
    // Determine language
    const langCode = selectedLanguage?.code || "TH";
    const isJapanese = langCode === "JP";
    const isThai = langCode === "TH";
    
    // Load and add fonts to jsPDF based on language
    let useCustomFont = false;
    let fontFamily = "helvetica";
    let sawarabiLoaded = false;
    let promptLoaded = false;
    
    try {
      // Always load SawarabiGothic font for Japanese support
      try {
        const sawarabiBase64 = await loadFontAsBase64("/fonts/SawarabiGothic-Regular.ttf");
        pdf.addFileToVFS("SawarabiGothic-Regular.ttf", sawarabiBase64);
        pdf.addFont("SawarabiGothic-Regular.ttf", "SawarabiGothic", "normal");
        sawarabiLoaded = true;
      } catch (error) {
        console.error("Error loading SawarabiGothic font:", error);
      }

      if (isJapanese && sawarabiLoaded) {
        // Use SawarabiGothic for Japanese
        fontFamily = "SawarabiGothic";
        useCustomFont = true;
      } else if (isThai) {
        // Load Prompt fonts for Thai
        try {
          const promptRegularBase64 = await loadFontAsBase64("/fonts/Prompt-Regular.ttf");
          const promptMediumBase64 = await loadFontAsBase64("/fonts/Prompt-Medium.ttf");
          const promptBoldBase64 = await loadFontAsBase64("/fonts/Prompt-Bold.ttf");

          pdf.addFileToVFS("Prompt-Regular.ttf", promptRegularBase64);
          pdf.addFileToVFS("Prompt-Medium.ttf", promptMediumBase64);
          pdf.addFileToVFS("Prompt-Bold.ttf", promptBoldBase64);

          pdf.addFont("Prompt-Regular.ttf", "Prompt", "normal");
          pdf.addFont("Prompt-Medium.ttf", "Prompt", "normal");
          pdf.addFont("Prompt-Bold.ttf", "Prompt", "bold");
          promptLoaded = true;
          fontFamily = "Prompt";
          useCustomFont = true;
        } catch (error) {
          console.error("Error loading Prompt fonts:", error);
        }
      }
      
      if (useCustomFont) {
        pdf.setFont(fontFamily, "normal");
      }
    } catch (error) {
      console.error("Error loading fonts, falling back to default:", error);
      useCustomFont = false;
      fontFamily = "helvetica";
    }

    // Check if custom font is available
    const fontList = pdf.getFontList();
    if (useCustomFont) {
      const fontKey = isJapanese ? "SawarabiGothic" : "Prompt";
      useCustomFont = fontList && (fontList[fontKey] !== undefined || fontList[fontKey.toLowerCase()] !== undefined);
    }

    // Use translations based on selected language
    let pdfT;
    if (isJapanese && useCustomFont && translations?.JP) {
      pdfT = translations.JP;
    } else if (isThai && useCustomFont && translations?.TH) {
      pdfT = translations.TH;
    } else {
      // Fallback to English
      pdfT = {
        dashboard: "Dashboard",
        totalParticipants: "Total Participants",
        totalVisitors: "Total Visitors",
        totalExhibitors: "Total Exhibitors",
        trendTitle: "Exhibitors vs Visitors Comparison",
        tableNo: "No.",
        tableName: "Problem",
        tableContact: "Count",
      };
    }
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const sectionSpacing = 15;
    const cardHeight = 25;
    const cardSpacing = 10;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Set font based on availability
    const fontStyle = "bold";

    // Title
    pdf.setFontSize(20);
    pdf.setFont(fontFamily, fontStyle);
    pdf.text(pdfT.dashboard || "Dashboard", margin, yPosition);
    yPosition += lineHeight + 8;

    // Date
    pdf.setFontSize(10);
    pdf.setFont(fontFamily, "normal");
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    pdf.text(`Date: ${currentDate}`, margin, yPosition);
    yPosition += sectionSpacing + 5;

    // Summary Cards Section
    checkNewPage(cardHeight + 10);
    const cardWidth = (pageWidth - margin * 2 - cardSpacing * 2) / 3;
    const summaryCards = [
      {
        label: pdfT.totalParticipants || "Total Participants",
        value: summaryData.totalParticipants.toLocaleString(),
      },
      {
        label: pdfT.totalVisitors || "Total Visitors",
        value: summaryData.totalVisitors.toLocaleString(),
      },
      {
        label: pdfT.totalExhibitors || "Total Exhibitors",
        value: summaryData.totalExhibitors.toLocaleString(),
      },
    ];

    summaryCards.forEach((card, index) => {
      const xPos = margin + index * (cardWidth + cardSpacing);

      // Draw card background
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(xPos, yPosition, cardWidth, cardHeight, 2, 2, "FD");

      // Card content
      pdf.setFontSize(12);
      pdf.setFont(fontFamily, "bold");
      pdf.text(card.value, xPos + 5, yPosition + 10);

      pdf.setFontSize(8);
      pdf.setFont(fontFamily, "normal");
      const labelLines = pdf.splitTextToSize(card.label, cardWidth - 10);
      pdf.text(labelLines, xPos + 5, yPosition + 16);
    });
    yPosition += cardHeight + sectionSpacing;

    // Table Section - Different content based on export type
    if (exportType === 'userManagement') {
      // User Management Table
      checkNewPage(sectionSpacing + lineHeight * 8);
      pdf.setFontSize(14);
      pdf.setFont(fontFamily, "bold");
      
      let tableTitle = "User Management";
      if (isJapanese && useCustomFont) {
        tableTitle = "ユーザー管理";
      } else if (isThai && useCustomFont) {
        tableTitle = "การจัดการผู้ใช้";
      }
      
      pdf.text(tableTitle, margin, yPosition);
      yPosition += lineHeight + 8;

      // Filter users based on roleFilter
      let filteredUsers = usersData || [];
      if (roleFilter === 'visitors') {
        filteredUsers = filteredUsers.filter((user) => user.role === 'visitor');
      } else if (roleFilter === 'exhibitors') {
        filteredUsers = filteredUsers.filter((user) => user.role === 'exhibitor');
      }

      // Prepare table data
      const userTableData = filteredUsers.map((user, index) => [
        index + 1,
        user.username || user.fullName || '-',
        user.role || '-',
        user.email || '-',
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-',
      ]);

      let tableHeaders = [["No.", "Username", "Role", "Email", "Created At"]];
      if (isJapanese && useCustomFont) {
        tableHeaders = [["番号", "ユーザー名", "役割", "メール", "作成日"]];
      } else if (isThai && useCustomFont) {
        tableHeaders = [["ลำดับ", "ชื่อผู้ใช้", "สิทธิ์", "อีเมล", "วันที่สร้าง"]];
      }

      // @ts-ignore - autoTable types may not be complete
      autoTable(pdf, {
        head: tableHeaders,
        body: userTableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: useCustomFont ? fontFamily : "helvetica",
        },
        headStyles: {
          fillColor: [30, 41, 57],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          font: useCustomFont ? fontFamily : "helvetica",
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          font: useCustomFont ? fontFamily : "helvetica",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 22 },
          1: { halign: "left", cellWidth: "auto" },
          2: { halign: "center", cellWidth: 50 },
          3: { halign: "left", cellWidth: "auto" },
          4: { halign: "center", cellWidth: 60 },
        },
        theme: "striped",
      });
    } else if (categoryData && categoryData.length > 0) {
      // Dashboard Table - Top 5 Problems
      checkNewPage(sectionSpacing + lineHeight * 8);
      pdf.setFontSize(14);
      pdf.setFont(fontFamily, "bold");
      
      let tableTitle = "Top 5 Problems";
      if (isJapanese && useCustomFont) {
        tableTitle = "問題トップ5";
      } else if (isThai && useCustomFont) {
        tableTitle = "ปัญหายอดนิยม 5 อันดับแรก";
      }
      
      pdf.text(tableTitle, margin, yPosition);
      yPosition += lineHeight + 8;

      // Use autoTable for better table formatting
      const tableData = categoryData.slice(0, 5).map((category, index) => [
        index + 1,
        category.name === "Others" 
          ? (isJapanese ? "その他" : isThai ? "อื่นๆ" : "Others")
          : category.name,
        category.count.toString(),
      ]);

      let tableHeaders = [["No.", "Problem Name", "Count"]];
      if (isJapanese && useCustomFont) {
        tableHeaders = [["番号", "問題名", "数"]];
      } else if (isThai && useCustomFont) {
        tableHeaders = [["ลำดับ", "ชื่อปัญหา", "จำนวน"]];
      }

      // @ts-ignore - autoTable types may not be complete
      autoTable(pdf, {
        head: tableHeaders,
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          font: useCustomFont ? fontFamily : "helvetica",
        },
        headStyles: {
          fillColor: [30, 41, 57],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          font: useCustomFont ? fontFamily : "helvetica",
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          font: useCustomFont ? fontFamily : "helvetica",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 22 },
          1: { halign: "left", cellWidth: "auto" },
          2: { halign: "center", cellWidth: 50 },
        },
        theme: "striped",
      });
    }

    // Save PDF
    const fileName = exportType === 'userManagement' 
      ? `user-management-${new Date().toISOString().split("T")[0]}.pdf`
      : `admin-dashboard-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
  };

  // ฟังก์ชัน Export เป็น Excel
  const handleExportExcel = async () => {
    // Check required data based on export type
    if (exportType === 'userManagement') {
      if (!usersData || !summaryData || !translations) {
        return;
      }
    } else {
      if (!summaryData || !comparisonData || !categoryData || !tableData || !translations) {
        return;
      }
    }

    const XLSX = await import("xlsx");
    const FileSaver = await import("file-saver");

    const workbook = XLSX.utils.book_new();

    // Determine language
    const langCode = selectedLanguage?.code || "TH";
    const isJapanese = langCode === "JP";
    const isThai = langCode === "TH";
    
    // Get translations based on language
    let excelT;
    if (isJapanese && translations?.JP) {
      excelT = translations.JP;
    } else if (isThai && translations?.TH) {
      excelT = translations.TH;
    } else {
      excelT = {
        dashboard: "Dashboard",
        totalParticipants: "Total Participants",
        totalVisitors: "Total Visitors",
        totalExhibitors: "Total Exhibitors",
        tableNo: "No.",
        tableName: "Problem Name",
        tableContact: "Count",
      };
    }

    if (exportType === 'userManagement') {
      // User Management Export
      // Summary Sheet
      const summarySheetData = [
        [excelT.userManagement || "User Management Summary"],
        ["Date", new Date().toLocaleDateString("en-US")],
        [],
        [excelT.totalParticipants || "Total Participants", summaryData.totalParticipants],
        [excelT.totalVisitors || "Total Visitors", summaryData.totalVisitors],
        [excelT.totalExhibitors || "Total Exhibitors", summaryData.totalExhibitors],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Filter users based on roleFilter
      let filteredUsers = usersData || [];
      if (roleFilter === 'visitors') {
        filteredUsers = filteredUsers.filter((user) => user.role === 'visitor');
      } else if (roleFilter === 'exhibitors') {
        filteredUsers = filteredUsers.filter((user) => user.role === 'exhibitor');
      }

      // Users Data Sheet
      const userHeaders = isJapanese
        ? ["番号", "ユーザー名", "役割", "メール", "作成日"]
        : isThai
        ? ["ลำดับ", "ชื่อผู้ใช้", "สิทธิ์", "อีเมล", "วันที่สร้าง"]
        : ["No.", "Username", "Role", "Email", "Created At"];
      
      const userSheetData = [
        userHeaders,
        ...filteredUsers.map((user, index) => [
          index + 1,
          user.username || user.fullName || '-',
          user.role || '-',
          user.email || '-',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-',
        ]),
      ];
      const userSheet = XLSX.utils.aoa_to_sheet(userSheetData);
      
      // Set column widths for better appearance
      userSheet["!cols"] = [
        { wch: 6 },  // No.
        { wch: 30 }, // Username
        { wch: 15 }, // Role
        { wch: 30 }, // Email
        { wch: 15 }, // Created At
      ];
      
      XLSX.utils.book_append_sheet(workbook, userSheet, "Users");
    } else {
      // Dashboard Export
      // Summary Sheet
      const summarySheetData = [
        [excelT.dashboard || "Dashboard Summary"],
        ["Date", new Date().toLocaleDateString("en-US")],
        [],
        [excelT.totalParticipants || "Total Participants", summaryData.totalParticipants],
        [excelT.totalVisitors || "Total Visitors", summaryData.totalVisitors],
        [excelT.totalExhibitors || "Total Exhibitors", summaryData.totalExhibitors],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Category Data Sheet with better formatting
    const categoryHeaders = isJapanese
      ? ["番号", "問題名", "数", "パーセンテージ (%)"]
      : isThai
      ? ["ลำดับ", "ชื่อปัญหา", "จำนวน", "เปอร์เซ็นต์ (%)"]
      : ["No.", "Problem Name", "Count", "Percentage (%)"];
    
    const categorySheetData = [
      categoryHeaders,
      ...(categoryData ?? []).map((cat, index) => [
        index + 1,
        cat.name === "Others" 
          ? (isJapanese ? "その他" : isThai ? "อื่นๆ" : "Others")
          : cat.name,
        cat.count,
        (Math.round(cat.percentage * 100) / 100).toFixed(2) + "%",
      ]),
    ];
    const categorySheet = XLSX.utils.aoa_to_sheet(categorySheetData);
    
    // Set column widths for better appearance
    categorySheet["!cols"] = [
      { wch: 6 },  // No.
      { wch: 40 }, // Problem Name
      { wch: 12 }, // Count
      { wch: 15 }, // Percentage
    ];
    
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Categories");

    // Table Data Sheet
    const tableHeaders = isJapanese
      ? ["番号", "名前", "会社名", "電話", "メール", "カテゴリ", "連絡済み"]
      : isThai
      ? ["ลำดับ", "ชื่อ", "ชื่อบริษัท", "เบอร์โทร", "อีเมล", "หมวดหมู่", "ติดต่อแล้ว"]
      : ["No.", "Name", "Company Name", "Phone", "Email", "Categories", "Contacted"];
    
    const tableSheetData = [
      tableHeaders,
      ...(tableData ?? []).map((row) => [
        row.no,
        row.name,
        row.companyName,
        row.phone,
        row.email,
        row.categories.join(", "),
        row.isContacted ? (isJapanese ? "はい" : isThai ? "ใช่" : "Yes") : (isJapanese ? "いいえ" : isThai ? "ไม่" : "No"),
      ]),
    ];
      const tableSheet = XLSX.utils.aoa_to_sheet(tableSheetData);
      tableSheet["!cols"] = [
        { wch: 6 },  // No.
        { wch: 25 }, // Name
        { wch: 25 }, // Company
        { wch: 15 }, // Phone
        { wch: 30 }, // Email
        { wch: 25 }, // Categories
        { wch: 12 }, // Contacted
      ];
      XLSX.utils.book_append_sheet(workbook, tableSheet, "Submissions");
    }

    // Write file with UTF-8 encoding support for Thai characters
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    // Create Blob with proper MIME type for Excel with UTF-8 support
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = exportType === 'userManagement'
      ? `user-management-${new Date().toISOString().split("T")[0]}.xlsx`
      : `admin-dashboard-${new Date().toISOString().split("T")[0]}.xlsx`;
    FileSaver.default.saveAs(data, fileName);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleExportPDF}
        className="bg-gray-800 text-white rounded-lg px-3 h-[36px] flex items-center justify-center gap-2 hover:bg-gray-700 transition"
        aria-label={exportPdfLabel}
        title={exportPdfLabel}
      >
        <Image
          src="/import-export.png"
          alt={exportPdfLabel}
          width={18}
          height={18}
          className="w-[18px] h-[18px] brightness-0 invert"
        />
        <span className="text-sm">{exportPdfLabel}</span>
      </button>
      <button
        type="button"
        onClick={handleExportExcel}
        className="bg-gray-800 text-white rounded-lg px-3 h-[36px] flex items-center justify-center gap-2 hover:bg-gray-700 transition"
        aria-label={exportExcelLabel}
        title={exportExcelLabel}
      >
        <Image
          src="/import-export.png"
          alt={exportExcelLabel}
          width={18}
          height={18}
          className="w-[18px] h-[18px] brightness-0 invert"
        />
        <span className="text-sm">{exportExcelLabel}</span>
      </button>
    </>
  );
};

export default ExportButtons;
