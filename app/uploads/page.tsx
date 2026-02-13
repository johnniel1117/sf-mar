'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ExcelUpload {
  id: string
  file_name: string
  document_number: string
  ship_to_name: string | null
  total_quantity: number
  shape_names: string[]
  created_at: string
  material_data: any[]
  serial_data: any[]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default function UploadsPage() {
  const [uploads, setUploads] = useState<ExcelUpload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('excel_uploads')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('Fetched uploads:', data)
      setUploads(data || [])
    } catch (err) {
      console.error('Error fetching uploads:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Saved Excel Uploads</h1>
        <p className="text-gray-600 mb-8">View all uploaded Excel files and their data</p>

        {uploads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No uploads found yet. Upload an Excel file to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {uploads.map((upload) => (
              <Card key={upload.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{upload.file_name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Document Number</p>
                      <p className="font-semibold text-lg">
                        {upload.document_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ship To</p>
                      <p className="font-semibold text-lg">
                        {upload.ship_to_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Quantity</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {upload.total_quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-semibold text-lg">
                        {upload.material_data?.length || 0}
                      </p>
                    </div>
                  </div>

                  {upload.shape_names && upload.shape_names.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">Material Shapes</p>
                      <div className="flex flex-wrap gap-2">
                        {upload.shape_names.slice(0, 5).map((shape, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {shape}
                          </span>
                        ))}
                        {upload.shape_names.length > 5 && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                            +{upload.shape_names.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}