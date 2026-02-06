import { useState, useCallback } from 'react'
import { DamageReportService, DamageReport } from '@/lib/services/damageReportService'

export const useDamageReport = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [savedReports, setSavedReports] = useState<DamageReport[]>([])

  const loadReports = useCallback(async () => {
    try {
      const reports = await DamageReportService.loadReports()
      setSavedReports(reports)
    } catch (error) {
      console.error('Error loading reports:', error)
      throw error
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

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      await DamageReportService.deleteReport(reportId)
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
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
      throw error
    }
  }, [])

  const checkSerialNumber = useCallback(async (serialNumber: string) => {
    try {
      return await DamageReportService.checkSerialNumber(serialNumber)
    } catch (error) {
      console.error('Error checking serial number:', error)
      throw error
    }
  }, [])

  return {
    isLoading,
    savedReports,
    loadReports,
    saveReport,
    deleteReport,
    uploadPhoto,
    lookupBarcode,
    checkSerialNumber,
  }
}