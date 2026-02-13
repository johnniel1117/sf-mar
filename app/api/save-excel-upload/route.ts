import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface MaterialData {
  materialCode: string
  materialDescription: string
  category: string
  qty: number
  remarks: string
  shipName: string
}

interface SerialData {
  dnNo: string
  orderItem: string
  factoryCode: string
  location: string
  binCode: string
  materialCode: string
  materialDesc: string
  barcode: string
  materialType: string
  productStatus: string
  shipTo: string
  shipToName: string
  shipToAddress: string
  soldTo: string
  soldToName: string
  scanBy: string
  scanTime: string
}

interface UploadPayload {
  fileName: string
  dnNo?: string
  traNo?: string
  totalQuantity: number
  data: MaterialData[]
  serialData: SerialData[]
}

export async function POST(request: NextRequest) {
  try {
    const payload: UploadPayload = await request.json()

    console.log("Received payload:", {
      fileName: payload.fileName,
      dnNo: payload.dnNo,
      traNo: payload.traNo,
      totalQuantity: payload.totalQuantity,
      dataCount: payload.data?.length,
      serialDataCount: payload.serialData?.length,
    })

    // Calculate total quantity from material data
    const totalQty = payload.data.reduce((sum, item) => sum + (item.qty || 0), 0)

    // Determine document_number: use traNo if available, otherwise dnNo
    const documentNumber = payload.traNo || payload.dnNo

    if (!documentNumber) {
      return NextResponse.json(
        { error: 'Either TRA number or DN number must be provided' },
        { status: 400 }
      )
    }

    // Extract ship-to name from serial data (use first record's shipToName)
    const shipToName = payload.serialData && payload.serialData.length > 0 
      ? payload.serialData[0].shipToName 
      : null

    // Check if document_number already exists (get all matching rows)
    const { data: existingUploads, error: checkError } = await supabase
      .from('excel_uploads')
      .select('id, file_name, created_at, document_number')
      .eq('document_number', documentNumber)

    if (checkError) {
      console.error("Error checking for duplicates:", checkError)
      return NextResponse.json(
        { error: checkError.message },
        { status: 400 }
      )
    }

    if (existingUploads && existingUploads.length > 0) {
      console.log(`Duplicate found - document_number already exists: ${documentNumber} (${existingUploads.length} existing records)`)
      return NextResponse.json(
        { 
          error: `Document ${documentNumber} has already been uploaded`,
          duplicate: true,
          existingUpload: {
            id: existingUploads[0].id,
            fileName: existingUploads[0].file_name,
            createdAt: existingUploads[0].created_at,
            documentNumber: existingUploads[0].document_number
          },
          duplicateCount: existingUploads.length
        },
        { status: 409 } // 409 Conflict status code
      )
    }

    // Prepare data for Supabase
    const uploadRecord = {
      file_name: payload.fileName,
      document_number: documentNumber,
      ship_to_name: shipToName,
      total_quantity: totalQty,
      material_data: payload.data,
      serial_data: payload.serialData,
      shape_names: payload.data.map(d => d.materialDescription).filter(Boolean),
      created_at: new Date().toISOString(),
    }

    console.log("Saving to Supabase:", {
      ...uploadRecord,
      material_data: `[${uploadRecord.material_data.length} items]`,
      serial_data: `[${uploadRecord.serial_data.length} items]`
    })

    // Insert into Supabase
    const { data, error } = await supabase
      .from('excel_uploads')
      .insert([uploadRecord])
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log("Successfully saved:", data)

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      data: data[0],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}