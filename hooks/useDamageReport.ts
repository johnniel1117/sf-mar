'use client';

import { useState, useCallback } from 'react'
import { DamageReportService, type DamageReport } from '@/lib/services/damageReportService'

export function useDamageReport() {
  const [isLoading, setIsLoading] = useState(false)
  const [savedReports, setSavedReports] = useState<DamageReport[]>([])

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const reports = await DamageReportService.loadReports()
      setSavedReports(reports)
    } catch (error) {
      console.error('Error loading reports:', error)
      setSavedReports([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveReport = useCallback(async (report: DamageReport) => {
    setIsLoading(true)
    try {
      await DamageReportService.saveReport(report)
    } catch (error) {
      console.error('Error saving report:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateReport = useCallback(async (reportId: string, report: DamageReport) => {
    setIsLoading(true)
    try {
      await DamageReportService.updateReport(reportId, report)
    } catch (error) {
      console.error('Error updating report:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteReport = useCallback(async (reportNumber: string) => {
    setIsLoading(true)
    try {
      await DamageReportService.deleteReport(reportNumber)
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadPhoto = useCallback(async (file: File, reportId: string) => {
    try {
      return await DamageReportService.uploadPhoto(file, reportId)
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    }
  }, [])

  const lookupBarcode = useCallback(async (barcode: string) => {
    try {
      return await DamageReportService.lookupBarcode(barcode)
    } catch (error) {
      console.error('Error looking up barcode:', error)
      return null
    }
  }, [])

  const saveMaterialMapping = useCallback(async (serialNumber: string, materialDescription: string, category?: string) => {
    try {
      return await DamageReportService.saveMaterialMapping(serialNumber, materialDescription, category)
    } catch (error) {
      console.error('Error saving material mapping:', error)
      throw error
    }
  }, [])

  const updateMaterialMapping = useCallback(async (id: string, updates: any) => {
    try {
      return await DamageReportService.updateMaterialMapping(id, updates)
    } catch (error) {
      console.error('Error updating material mapping:', error)
      throw error
    }
  }, [])

  const deleteMaterialMapping = useCallback(async (id: string) => {
    try {
      return await DamageReportService.deleteMaterialMapping(id)
    } catch (error) {
      console.error('Error deleting material mapping:', error)
      throw error
    }
  }, [])

  const getMaterialMappings = useCallback(async (searchTerm?: string) => {
    try {
      return await DamageReportService.getMaterialMappings(searchTerm)
    } catch (error) {
      console.error('Error fetching material mappings:', error)
      return []
    }
  }, [])

  const checkSerialNumber = useCallback(async (serialNumber: string) => {
    try {
      return await DamageReportService.checkSerialNumber(serialNumber)
    } catch (error) {
      console.error('Error checking serial number:', error)
      return { exists: false }
    }
  }, [])

  return {
    isLoading,
    savedReports,
    loadReports,
    saveReport,
    updateReport,
    deleteReport,
    uploadPhoto,
    lookupBarcode,
    saveMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping,
    getMaterialMappings,
    checkSerialNumber,
  }
}
