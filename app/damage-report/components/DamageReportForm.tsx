'use client'

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useDamageReport } from '@/hooks/useDamageReport';
import { PDFGenerator } from '@/lib/utils/pdfGenerator';
import { ExcelGenerator } from '@/lib/utils/excelGenerator';
import { DAMAGE_TYPES, STEPS, Step } from '@/lib/constants/damageReportConstants';
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService';
import CreateReportTab from './tabs/CreateReportTab';
import SavedReportsTab from './tabs/SavedReportsTab';
import MaterialsTab from './tabs/MaterialsTab';
import ViewReportModal from './modals/ViewReportModal';
import DownloadModal from './modals/DownloadModal';
import MaterialModal from './modals/MaterialModal';
import ConfirmationModal from './modals/ConfirmationModal';
import ToastNotification from './modals/ToastNotification';

// Import icons from lucide-react
import {
  Truck, Barcode, ClipboardList, Users, Download, Camera, Plus, X,
  AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight,
  ChevronLeft, Edit, Search, Star, Clock, Info, FileSpreadsheet, Eye
} from 'lucide-react';

export const ICONS = {
  Truck, Barcode, ClipboardList, Users, Download, Camera, Plus, X,
  AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight,
  ChevronLeft, Edit, Search, Star, Clock, Info, FileSpreadsheet, Eye,
} as const;

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

export default function DamageReportForm() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'materials'>('create');
  const [toast, setToast] = useState({
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
    show: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ message: '', type: 'info', show: false });
    }, 3000);
  };

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
            onClick={() => setActiveTab('materials')}
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