'use client'

import React from 'react';
import { useDamageReportForm } from '../../hooks/useDamageReportForm';
import { STEPS } from '@/lib/constants/damageReportConstants';
import Step1TruckInfo from '../steps/Step1TruckInfo';
import Step2ScanItems from '../steps/Step2ScanItems';
import Step3DamageDetails from '../steps/Step3DamageDetails';
import Step4ReviewFinalize from '../steps/Step4ReviewFinalize';
import { ICONS } from '../DamageReportForm';

const CreateReportTab: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    report,
    setReport,
    selectedPersonnel,
    personnelData,
    handlePersonnelChange,
    isLoading,
    isEditMode,
    showToast,
    saveReport,
    resetForm,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
  } = useDamageReportForm();

  const updateReport = (field: string, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-6 sm:mb-8">
          {STEPS.map((step, index) => {
            const StepIcon = ICONS[step.icon as keyof typeof ICONS];
            return (
              <React.Fragment key={step.number}>
                {/* Step Item */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 flex-shrink-0 ${
                      currentStep === step.number
                        ? 'bg-orange-600 text-white shadow-lg scale-110'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <ICONS.CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    ) : (
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    )}
                  </div>
                  <p className={`text-[10px] sm:text-xs lg:text-sm font-semibold mt-1 sm:mt-2 text-center line-clamp-2 ${
                    currentStep === step.number ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden lg:block text-center max-w-[70px]">
                    {step.description}
                  </p>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 sm:h-1 flex-1 transition-all duration-300 self-start mt-5 sm:mt-6 lg:mt-7 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div className="mt-6 mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-center gap-2">
              <ICONS.Edit className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">Edit Mode</p>
                <p className="text-xs text-blue-700">You are editing an existing report</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <Step1TruckInfo report={report} updateReport={updateReport} />
          )}
          {currentStep === 2 && (
            <Step2ScanItems />
          )}
          {currentStep === 3 && (
            <Step3DamageDetails />
          )}
          {currentStep === 4 && (
            <Step4ReviewFinalize
              report={report}
              personnelData={personnelData}
              selectedPersonnel={selectedPersonnel}
              onPersonnelChange={handlePersonnelChange}
              updateReport={updateReport}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200">
          <button
            onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as any)}
            disabled={currentStep === 1}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ICONS.ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !canProceedToStep2()) {
                  showToast('Please fill in all required fields (Driver Name, Plate No.)', 'error');
                  return;
                }
                if (currentStep === 2 && !canProceedToStep3()) {
                  showToast('Please add at least one item', 'error');
                  return;
                }
                if (currentStep === 3 && !canProceedToStep4()) {
                  showToast('Please fill in Damage Type for all items', 'error');
                  return;
                }
                setCurrentStep((currentStep + 1) as any);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-lg"
            >
              Next
              <ICONS.ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                <ICONS.X className="w-4 h-4 sm:w-5 sm:h-5" />
                Clear
              </button>
              <button
                onClick={saveReport}
                disabled={isLoading || !selectedPersonnel.admin || !selectedPersonnel.guard || !selectedPersonnel.supervisor}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg font-semibold transition-all shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed ${
                  isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <ICONS.Save className="w-4 h-4 sm:w-5 sm:h-5" />
                {isLoading ? 'Saving...' : isEditMode ? 'Update Report' : 'Save Report'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateReportTab;