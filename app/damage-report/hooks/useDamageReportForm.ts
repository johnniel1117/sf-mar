'use client'

import { useState, useCallback } from 'react';
import { useDamageReport } from '@/hooks/useDamageReport';

export const useDamageReportForm = () => {
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

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({
    message: '',
    type: 'info',
    show: false,
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ message: '', type: 'info', show: false });
    }, 3000);
  }, []);

  const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    });
  }, []);

  return {
    isLoading,
    savedReports,
    loadReports,
    saveReportService,
    deleteReportService,
    uploadPhoto,
    lookupBarcodeService,
    saveMaterialMappingService,
    updateMaterialMappingService,
    deleteMaterialMappingService,
    getMaterialMappings,
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    showToast,
    showConfirmation,
  };
};