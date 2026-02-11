'use client'

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useDamageReportForm } from '../hooks/useDamageReportForm';
import CreateReportTab from './tabs/CreateReportTab';
import SavedReportsTab from './tabs/SavedReportsTab';
import MaterialsTab from './tabs/MaterialsTab';
import ViewReportModal from './modals/ViewReportModal';
import DownloadModal from './modals/DownloadModal';
import MaterialModal from './modals/MaterialModal';
import ConfirmationModal from './modals/ConfirmationModal';
import ToastNotification from './modals/ToastNotification';
import { ICONS } from '../utils/constants';

export default function DamageReportForm() {
  const [mounted, setMounted] = useState(false);
  
  const {
    activeTab,
    setActiveTab,
    toast,
    showToast,
    confirmModal,
    setConfirmModal,
    showViewModal,
    setShowViewModal,
    viewingReport,
    handleViewReport,
    handleCloseViewModal,
    handleEditReport,
    handleOpenDownloadModal,
    showMaterialModal,
    setShowMaterialModal,
    pendingBarcode,
    newMaterialDescription,
    setNewMaterialDescription,
    newMaterialCategory,
    setNewMaterialCategory,
    isSavingMaterial,
    handleSaveNewMaterial,
    handleCancelMaterial,
    showDownloadModal,
    setShowDownloadModal,
    downloadType,
    setDownloadType,
    selectedDownloadReport,
    setSelectedDownloadReport,
    handleDownloadConfirm,
    handleDownloadReport,
    fetchPersonnelData,
    loadMaterialMappings,
    loadReports,
    materialLookup,
  } = useDamageReportForm();

  useEffect(() => {
    setMounted(true);
    loadReports();
    fetchPersonnelData();
    if (activeTab === 'materials') {
      loadMaterialMappings();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 sm:py-8 px-3 sm:px-4">
      <Navbar 
        showBackButton 
        backHref="/" 
        animate={mounted}
        fixed={true}
      />
      <div className="w-full max-w-6xl mx-auto pt-16">
        
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg justify-center w-full">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ICONS.FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Create Report</span>
            <span className="sm:hidden">Create</span>
          </button>
          
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'saved'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ICONS.Download className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Saved Reports</span>
            <span className="sm:hidden">Saved</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('materials');
              loadMaterialMappings();
            }}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ICONS.Star className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Material Mappings</span>
            <span className="sm:hidden">Materials</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && <CreateReportTab />}
        {activeTab === 'saved' && <SavedReportsTab />}
        {activeTab === 'materials' && <MaterialsTab />}
      </div>

      {/* View Report Modal */}
      {showViewModal && viewingReport && (
        <ViewReportModal
          report={viewingReport}
          onClose={handleCloseViewModal}
          onEdit={() => {
            handleEditReport(viewingReport);
            handleCloseViewModal();
          }}
          onDownload={() => {
            handleOpenDownloadModal(viewingReport);
            handleCloseViewModal();
          }}
        />
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <DownloadModal
          report={selectedDownloadReport}
          downloadType={downloadType}
          onDownloadTypeChange={setDownloadType}
          onClose={() => {
            setShowDownloadModal(false);
            setSelectedDownloadReport(null);
          }}
          onDownload={() => {
            if (selectedDownloadReport) {
              handleDownloadReport(selectedDownloadReport, downloadType);
            }
            setShowDownloadModal(false);
            setSelectedDownloadReport(null);
          }}
        />
      )}

      {/* Material Input Modal */}
      {showMaterialModal && (
        <MaterialModal
          pendingBarcode={pendingBarcode}
          materialDescription={newMaterialDescription}
          onDescriptionChange={setNewMaterialDescription}
          materialCategory={newMaterialCategory}
          onCategoryChange={setNewMaterialCategory}
          isSaving={isSavingMaterial}
          materialLookup={materialLookup}
          onClose={handleCancelMaterial}
          onSave={handleSaveNewMaterial}
          onCancel={handleCancelMaterial}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <ConfirmationModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal((prev: any) => ({ ...prev, show: false }));
          }}
          onCancel={confirmModal.onCancel}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => showToast('', 'info')}
        />
      )}
    </div>
  );
}