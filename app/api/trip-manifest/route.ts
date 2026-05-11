import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Fetch trip manifests
    const { data: manifests, error: manifestError } = await supabase
      .from('trip_manifests')
      .select('*')
      .order('manifest_date', { ascending: false })

    if (manifestError) {
      console.error('Supabase error:', manifestError)
      return NextResponse.json({ error: manifestError.message }, { status: 500 })
    }

    // Fetch excel uploads for material data
    const { data: excelUploads, error: excelError } = await supabase
      .from('excel_uploads')
      .select('document_number, material_data, serial_data')

    if (excelError) {
      console.error('Excel uploads error:', excelError)
      // Don't fail if we can't get excel data, just continue with what we have
    }

    // Create a mapping of document_number to material info
    const materialMap = new Map<string, any>()
    if (excelUploads && Array.isArray(excelUploads)) {
      for (const upload of excelUploads) {
        const docNum = upload.document_number
        // Use material_data or serial_data to extract material info
        const materialData = upload.material_data && Array.isArray(upload.material_data) ? upload.material_data[0] : null
        const serialData = upload.serial_data && Array.isArray(upload.serial_data) ? upload.serial_data[0] : null
        
        if (materialData || serialData) {
          materialMap.set(docNum, {
            materialCode: materialData?.materialCode || serialData?.materialCode || '',
            materialDesc: materialData?.materialDescription || serialData?.materialDesc || '',
          })
        }
      }
    }

    // Enrich manifests with material data
    const enrichedManifests = (manifests || []).map((manifest: any) => ({
      ...manifest,
      items: (manifest.items || []).map((item: any) => {
        const materialInfo = materialMap.get(item.document_number) || { materialCode: '', materialDesc: '' }
        return {
          ...item,
          material_code: materialInfo.materialCode,
          material_desc: materialInfo.materialDesc,
        }
      }),
    }))

    return NextResponse.json(enrichedManifests || [])
  } catch (error) {
    console.error('Route error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
