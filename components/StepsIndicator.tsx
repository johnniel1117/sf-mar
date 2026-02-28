'use client'

import React from 'react'
import { CheckCircle2, Truck, Barcode, ClipboardList, Users } from 'lucide-react'
import { STEPS } from '@/lib/constants/damageReportConstants'
import type { Step } from '@/lib/constants/damageReportConstants'

const icons = {
  Truck,
  Barcode,
  ClipboardList,
  Users,
  CheckCircle2,
} as const

interface StepsIndicatorProps {
  currentStep: Step
  isEditMode: boolean
}

export function StepsIndicator({ currentStep, isEditMode }: StepsIndicatorProps) {
  return (
    <div className="px-4 sm:px-6 pt-5 pb-4">
      {/* Step row */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const StepIcon = icons[step.icon as keyof typeof icons]
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div className={`
                  w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center
                  transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? 'bg-[#E8192C] text-white shadow-lg shadow-[#E8192C]/40 scale-110'
                    : isCompleted
                    ? 'bg-[#E8192C]/20 text-[#E8192C] border border-[#E8192C]/40'
                    : 'bg-[#282828] text-[#9A9A9A] border border-[#3E3E3E]'
                  }
                `}>
                  {isCompleted
                    ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    : <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  }
                </div>

                {/* Label */}
                <p className={`
                  text-[10px] sm:text-xs font-bold mt-1.5 text-center leading-tight
                  ${isActive ? 'text-white' : isCompleted ? 'text-[#E8192C]' : 'text-[#9A9A9A]'}
                `}>
                  {step.title}
                </p>

                {/* Description — desktop only */}
                <p className="hidden lg:block text-[9px] text-[#9A9A9A] mt-0.5 text-center max-w-[72px] leading-tight">
                  {step.description}
                </p>
              </div>

              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div
                  className="flex-shrink-0 mx-1 sm:mx-2"
                  style={{ marginBottom: '22px' }}
                >
                  <div className={`
                    h-0.5 w-6 sm:w-10 rounded-full transition-all duration-300
                    ${isCompleted ? 'bg-[#E8192C]' : 'bg-[#3E3E3E]'}
                  `} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Edit mode badge */}
      {isEditMode && (
        <div className="mt-5 flex items-center gap-2.5 px-4 py-3 bg-blue-600/10 border border-blue-500/30 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-400">Edit Mode</p>
            <p className="text-[10px] text-[#9A9A9A] mt-0.5">You are editing an existing report</p>
          </div>
        </div>
      )}
    </div>
  )
}