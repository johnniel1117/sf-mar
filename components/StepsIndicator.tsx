'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { STEPS } from '@/lib/constants/damageReportConstants'
import type { Step } from '@/lib/constants/damageReportConstants'

const icons = {
  Truck: require('lucide-react').Truck,
  Barcode: require('lucide-react').Barcode,
  ClipboardList: require('lucide-react').ClipboardList,
  Users: require('lucide-react').Users,
  CheckCircle2: CheckCircle2,
} as const

interface StepsIndicatorProps {
  currentStep: Step
  isEditMode: boolean
}

export function StepsIndicator({ currentStep, isEditMode }: StepsIndicatorProps) {
  return (
    <div className=" p-3 sm:p-6">
      <div className="flex items-start justify-between gap-1 sm:gap-2 mb-6">
        {STEPS.map((step, index) => {
          const StepIcon = icons[step.icon as keyof typeof icons]
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
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  ) : (
                    <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  )}
                </div>
                <p
                  className={`text-[10px] sm:text-xs lg:text-sm font-semibold mt-1 sm:mt-2 text-center line-clamp-2 ${
                    currentStep === step.number ? 'text-orange-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden lg:block text-center max-w-[70px]">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 sm:h-1 flex-1 transition-all duration-300 self-start mt-5 sm:mt-6 lg:mt-7 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="mt-6 mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Edit Mode</p>
              <p className="text-xs text-blue-700">You are editing an existing report</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
