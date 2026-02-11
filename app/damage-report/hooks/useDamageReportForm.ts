'use client'

import { useState, useEffect, useCallback } from 'react';
import { useDamageReport } from '@/hooks/useDamageReport';
import { PDFGenerator } from '@/lib/utils/pdfGenerator';
import { ExcelGenerator } from '@/lib/utils/excelGenerator';
import { STEPS, Step } from '@/lib/constants/damageReportConstants';
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService';

export interface PersonnelData {
  admins: Array<{ id: string; name: string }>;
  guards: Array<{ id: string; name: string }>;
  supervisors: Array<{ id: string; name: string }>;
}

export interface SelectedPersonnel {
  admin: string;
  guard: string;
  supervisor: string;
}

export interface BarcodeLookupResult {
  barcode: string;
  material_code: string;
  material_description: string;
  category?: string;
  mapping_id?: string;
}

export const INITIAL_REPORT: DamageReport = {
  report_number: '',
  report_date: new Date().toISOString().split('T')[0],
  seal_no: '',
  driver_name: '',
  plate_no: '',
  container_no: '',
  prepared_by: '',
  noted_by: '',
  acknowledged_by: '',
  narrative_findings: '',
  actions_required: '',
  status: 'draft',
  items: [],
};

export const useDamageReportForm = () => {
  // State declarations
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [report, setReport] = useState<DamageReport>(INITIAL_REPORT);
  const [personnelData, setPersonnelData] = useState<PersonnelData>({
    admins: [],
    guards: [],
    supervisors: []
  });
  const [selectedPersonnel, setSelectedPersonnel] = useState<SelectedPersonnel>({
    admin: '',
    guard: '',
    supervisor: ''
  });
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'materials'>('create');
  
  // Barcode states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [materialLookup, setMaterialLookup] = useState<BarcodeLookupResult | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemBarcode, setEditingItemBarcode] = useState('');
  
  // Upload state
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<DamageReport | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedDownloadReport, setSelectedDownloadReport] = useState<DamageReport | null>(null);
  const [downloadType, setDownloadType] = useState<'pdf' | 'excel'>('pdf');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState('');
  const [newMaterialDescription, setNewMaterialDescription] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('Manual Entry');
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  
  // Material management states
  const [materialMappings, setMaterialMappings] = useState<any[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit mode states
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // UI states
  const [toast, setToast] = useState({
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
    show: false,
  });
  
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Custom hooks
  const {
    isLoading,
    savedReports,
    loadReports,
    saveReport: saveReportService,
    deleteReport: deleteReportService,
    uploadPhoto,
    lookupBarcode: lookupBarcodeService,
    saveMaterialMapping: saveMaterialMappingService,
    updateMaterialMapping: updateMaterialMappingService,
    deleteMaterialMapping: deleteMaterialMappingService,
    getMaterialMappings,
  } = useDamageReport();

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ message: '', type: 'info', show: false });
    }, 3000);
  }, []);

  // Confirmation modal helper
  const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    });
  }, []);

  // Fetch personnel data
  const fetchPersonnelData = useCallback(async () => {
    try {
      const response = await fetch('/api/personnel');
      if (response.ok) {
        const data = await response.json();
        setPersonnelData(data);
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
      showToast('Error loading personnel data', 'error');
    }
  }, [showToast]);

  // Load material mappings
  const loadMaterialMappings = useCallback(async (search = '') => {
    try {
      const mappings = await getMaterialMappings(search);
      setMaterialMappings(mappings || []);
    } catch (error) {
      console.error('Error loading material mappings:', error);
      showToast('Error loading material mappings', 'error');
    }
  }, [getMaterialMappings, showToast]);

  // Update personnel when selection changes
  useEffect(() => {
    const selectedAdmin = personnelData.admins.find(a => a.id === selectedPersonnel.admin);
    const selectedGuard = personnelData.guards.find(g => g.id === selectedPersonnel.guard);
    const selectedSupervisor = personnelData.supervisors.find(s => s.id === selectedPersonnel.supervisor);

    setReport(prev => ({
      ...prev,
      prepared_by: selectedAdmin?.name || '',
      noted_by: selectedGuard?.name || '',
      acknowledged_by: selectedSupervisor?.name || ''
    }));
  }, [selectedPersonnel, personnelData]);

  // Handle personnel change
  const handlePersonnelChange = useCallback((role: keyof SelectedPersonnel, value: string) => {
    setSelectedPersonnel(prev => ({
      ...prev,
      [role]: value
    }));
  }, []);

  // Barcode lookup
  const lookupBarcode = useCallback(async (barcode: string): Promise<BarcodeLookupResult | null> => {
    try {
      return await lookupBarcodeService(barcode);
    } catch (error) {
      console.error('Error looking up barcode:', error);
      return null;
    }
  }, [lookupBarcodeService]);

  // Add item to report
  const addItem = useCallback((material?: BarcodeLookupResult) => {
    const newItem: DamageItem & { mapping_id?: string } = {
      item_number: report.items.length + 1,
      barcode: material?.barcode || '',
      material_code: material?.material_code || '',
      material_description: material?.material_description || '',
      damage_type: '',
      damage_description: '',
      mapping_id: material?.mapping_id,
    };
    setReport(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  }, [report.items.length]);

  // Update item
  const updateItem = useCallback((index: number, field: string, value: any) => {
    setReport(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
      return { ...prev, items: updatedItems };
    });
  }, []);

  // Remove item
  const removeItem = useCallback((index: number) => {
    setReport(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      updatedItems.forEach((item, i) => {
        item.item_number = i + 1;
      });
      return { ...prev, items: updatedItems };
    });
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (index: number, file: File) => {
    try {
      setUploadingItemIndex(index);
      const url = await uploadPhoto(file, report.report_number || 'temp');
      updateItem(index, 'photo_url', url);
      showToast('Photo uploaded successfully', 'success');
    } catch (error) {
      showToast('Failed to upload photo', 'error');
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingItemIndex(null);
    }
  }, [report.report_number, updateItem, uploadPhoto, showToast]);

  // Reset form
  const resetForm = useCallback(() => {
    setReport(INITIAL_REPORT);
    setSelectedPersonnel({
      admin: '',
      guard: '',
      supervisor: ''
    });
    setBarcodeInput('');
    setMaterialLookup(null);
    setCurrentStep(1);
    setEditingReportId(null);
    setIsEditMode(false);
    setEditingItemIndex(null);
    setEditingItemBarcode('');
  }, []);

  // Save report
  const saveReport = useCallback(async () => {
    try {
      const reportWithPersonnel = {
        ...report,
        admin_id: selectedPersonnel.admin,
        guard_id: selectedPersonnel.guard,
        supervisor_id: selectedPersonnel.supervisor
      };

      if (isEditMode && editingReportId) {
        const response = await fetch(`/api/damage-reports/${editingReportId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportWithPersonnel),
        });

        if (!response.ok) {
          throw new Error('Failed to update report');
        }

        showToast('Report updated successfully!', 'success');
      } else {
        await saveReportService(reportWithPersonnel);
        showToast('Report saved successfully!', 'success');
      }

      resetForm();
      loadReports();
      setActiveTab('saved');
    } catch (error) {
      showToast('Error saving report', 'error');
      console.error('Error:', error);
    }
  }, [report, selectedPersonnel, isEditMode, editingReportId, saveReportService, resetForm, loadReports, showToast]);

  // Edit report
  const handleEditReport = useCallback((reportToEdit: DamageReport) => {
    try {
      const reportToSet = {
        ...reportToEdit,
        items: reportToEdit.items || []
      };
      setReport(reportToSet);
      
      setSelectedPersonnel({
        admin: reportToEdit.admin_id || '',
        guard: reportToEdit.guard_id || '',
        supervisor: reportToEdit.supervisor_id || ''
      });
      
      setEditingReportId(reportToEdit.id || null);
      setIsEditMode(true);
      setCurrentStep(1);
      setActiveTab('create');
      showToast('Report loaded for editing', 'info');
    } catch (error) {
      console.error('Error loading report for editing:', error);
      showToast('Failed to load report for editing', 'error');
    }
  }, [showToast]);

  // Delete report
  const handleDeleteReport = useCallback(async (reportNumber: string) => {
    if (!reportNumber) {
      showToast('Invalid report number', 'error');
      return;
    }

    showConfirmation(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      async () => {
        try {
          const trimmedReportNumber = reportNumber.trim();
          
          const response = await fetch(`/api/damage-reports/${encodeURIComponent(trimmedReportNumber)}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete report');
          }

          const result = await response.json();
          showToast(result.message || 'Report deleted successfully!', 'success');
          await loadReports();
          
        } catch (error) {
          console.error('Error deleting report:', error);
          showToast(error instanceof Error ? error.message : 'Error deleting report. Please try again.', 'error');
        }
      }
    );
  }, [showConfirmation, showToast, loadReports]);

  // Download report
  const handleDownloadReport = useCallback((report: DamageReport, type: 'pdf' | 'excel') => {
    if (type === 'pdf') {
      PDFGenerator.generatePDF(report);
    } else {
      ExcelGenerator.generateExcel(report);
    }
    showToast(`Report downloaded as ${type.toUpperCase()}`, 'success');
  }, [showToast]);

  // View report
  const handleViewReport = useCallback((report: DamageReport) => {
    setViewingReport(report);
    setShowViewModal(true);
  }, []);

  // Close view modal
  const handleCloseViewModal = useCallback(() => {
    setShowViewModal(false);
    setViewingReport(null);
  }, []);

  // Open download modal
  const handleOpenDownloadModal = useCallback((report: DamageReport) => {
    setSelectedDownloadReport(report);
    setShowDownloadModal(true);
  }, []);

  // Handle download confirmation
  const handleDownloadConfirm = useCallback(() => {
    if (selectedDownloadReport) {
      handleDownloadReport(selectedDownloadReport, downloadType);
    }
    setShowDownloadModal(false);
    setSelectedDownloadReport(null);
  }, [selectedDownloadReport, downloadType, handleDownloadReport]);

  // Handle barcode input
  const handleBarcodeInput = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = barcodeInput.trim();
      if (!barcode) return;

      const material = await lookupBarcode(barcode);
      if (material) {
        setMaterialLookup(material);
        addItem(material);
        setBarcodeInput('');
        showToast('Item added successfully', 'success');
      } else {
        setPendingBarcode(barcode);
        setNewMaterialDescription('');
        setNewMaterialCategory('Manual Entry');
        setShowMaterialModal(true);
      }
    }
  }, [barcodeInput, lookupBarcode, addItem, showToast]);

  // Save new material
  const handleSaveNewMaterial = useCallback(async () => {
    if (!newMaterialDescription.trim()) {
      showToast('Please enter a material description', 'error');
      return;
    }

    setIsSavingMaterial(true);
    try {
      const savedMaterial = await saveMaterialMappingService(
        pendingBarcode,
        newMaterialDescription,
        newMaterialCategory
      );
      
      const manualMaterial: BarcodeLookupResult = {
        barcode: pendingBarcode,
        material_code: pendingBarcode,
        material_description: newMaterialDescription,
        category: newMaterialCategory,
        mapping_id: savedMaterial?.id,
      };
      
      setMaterialLookup(manualMaterial);
      addItem(manualMaterial);
      
      setBarcodeInput('');
      setShowMaterialModal(false);
      setPendingBarcode('');
      setNewMaterialDescription('');
      setNewMaterialCategory('Manual Entry');
      
      showToast('Material saved successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving material mapping:', error);
      showToast('Failed to save material. Please try again.', 'error');
    } finally {
      setIsSavingMaterial(false);
    }
  }, [pendingBarcode, newMaterialDescription, newMaterialCategory, saveMaterialMappingService, addItem, showToast]);

  // Cancel material
  const handleCancelMaterial = useCallback(() => {
    setShowMaterialModal(false);
    setPendingBarcode('');
    setNewMaterialDescription('');
    setNewMaterialCategory('Manual Entry');
  }, []);

  // Edit item barcode
  const handleEditItemBarcode = useCallback((index: number) => {
    setEditingItemIndex(index);
    setEditingItemBarcode(report.items[index]?.barcode || '');
  }, [report.items]);

  // Save edited barcode
  const handleSaveEditedBarcode = useCallback(async (index: number) => {
    const newBarcode = editingItemBarcode.trim();
    
    if (!newBarcode) {
      showToast('Barcode cannot be empty', 'error');
      return;
    }

    const material = await lookupBarcode(newBarcode);
    
    if (material) {
      updateItem(index, 'barcode', newBarcode);
      updateItem(index, 'material_code', material.material_code || newBarcode);
      updateItem(index, 'material_description', material.material_description || '');
      updateItem(index, 'mapping_id', material.mapping_id);
      
      showToast('Item barcode updated successfully', 'success');
      setEditingItemIndex(null);
      setEditingItemBarcode('');
    } else {
      setPendingBarcode(newBarcode);
      setNewMaterialDescription('');
      setNewMaterialCategory('Manual Entry');
      setShowMaterialModal(true);
    }
  }, [editingItemBarcode, lookupBarcode, updateItem, showToast]);

  // Cancel barcode edit
  const handleCancelEditBarcode = useCallback(() => {
    setEditingItemIndex(null);
    setEditingItemBarcode('');
  }, []);

  // Step validation
  const canProceedToStep2 = useCallback(() => {
    return report.driver_name && report.plate_no;
  }, [report.driver_name, report.plate_no]);

  const canProceedToStep3 = useCallback(() => {
    return report.items.length > 0;
  }, [report.items.length]);

  const canProceedToStep4 = useCallback(() => {
    return report.items.every(item => item.damage_type);
  }, [report.items]);

  return {
    // State
    currentStep,
    setCurrentStep,
    report,
    setReport,
    personnelData,
    selectedPersonnel,
    setSelectedPersonnel,
    activeTab,
    setActiveTab,
    barcodeInput,
    setBarcodeInput,
    materialLookup,
    editingItemIndex,
    setEditingItemIndex,
    editingItemBarcode,
    setEditingItemBarcode,
    uploadingItemIndex,
    showViewModal,
    setShowViewModal,
    viewingReport,
    setViewingReport,
    showDownloadModal,
    setShowDownloadModal,
    selectedDownloadReport,
    setSelectedDownloadReport,
    downloadType,
    setDownloadType,
    showMaterialModal,
    setShowMaterialModal,
    pendingBarcode,
    newMaterialDescription,
    setNewMaterialDescription,
    newMaterialCategory,
    setNewMaterialCategory,
    isSavingMaterial,
    materialMappings,
    editingMaterial,
    setEditingMaterial,
    isEditingMaterial,
    setIsEditingMaterial,
    searchTerm,
    setSearchTerm,
    editingReportId,
    isEditMode,
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    isLoading,
    savedReports,
    
    // Methods
    showToast,
    showConfirmation,
    fetchPersonnelData,
    loadMaterialMappings,
    handlePersonnelChange,
    lookupBarcode,
    addItem,
    updateItem,
    removeItem,
    handlePhotoUpload,
    resetForm,
    saveReport,
    handleEditReport,
    handleDeleteReport,
    handleDownloadReport,
    handleViewReport,
    handleCloseViewModal,
    handleOpenDownloadModal,
    handleDownloadConfirm,
    handleBarcodeInput,
    handleSaveNewMaterial,
    handleCancelMaterial,
    handleEditItemBarcode,
    handleSaveEditedBarcode,
    handleCancelEditBarcode,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    loadReports,
    saveMaterialMapping: saveMaterialMappingService,
    updateMaterialMapping: updateMaterialMappingService,
    deleteMaterialMapping: deleteMaterialMappingService,
  };
};