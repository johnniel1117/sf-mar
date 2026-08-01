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
  cbm?: number
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

    // Calculate total CBM from material data
    const totalCbm = payload.data.reduce((sum, item) => {
      const itemCbm = (item.cbm || 0) * (item.qty || 0)
      return sum + itemCbm
    }, 0)

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

    // Check if document_number already exists
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

    // Prepare data for Supabase
    const uploadRecord = {
      file_name: payload.fileName,
      document_number: documentNumber,
      ship_to_name: shipToName,
      total_quantity: totalQty,
      total_cbm: totalCbm,
      material_data: payload.data,
      serial_data: payload.serialData,
      shape_names: payload.data.map(d => d.materialDescription).filter(Boolean),
      updated_at: new Date().toISOString(),
    }

    let result
    let action = 'inserted'

    if (existingUploads && existingUploads.length > 0) {
      // Update existing record
      console.log(`Updating existing document: ${documentNumber} (ID: ${existingUploads[0].id})`)
      
      const { data, error: updateError } = await supabase
        .from('excel_uploads')
        .update(uploadRecord)
        .eq('id', existingUploads[0].id)
        .select()

      if (updateError) {
        console.error("Supabase update error:", updateError)
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      result = data
      action = 'updated'
    } else {
      // Insert new record
      console.log("Saving new document to Supabase:", {
        ...uploadRecord,
        material_data: `[${uploadRecord.material_data.length} items]`,
        serial_data: `[${uploadRecord.serial_data.length} items]`
      })

      const { data, error: insertError } = await supabase
        .from('excel_uploads')
        .insert([uploadRecord])
        .select()

      if (insertError) {
        console.error("Supabase insert error:", insertError)
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        )
      }

      result = data
    }

    console.log(`Successfully ${action}:`, result)

    return NextResponse.json({
      success: true,
      message: `Data ${action} successfully`,
      action: action,
      data: result[0],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ── GET: retrieve previously saved record(s) by DN / TRA number ──────────────
//
// Single lookup:  GET /api/save-excel-upload?dnNo=0004500001
//                 -> returns the single matching row as a JSON object
//
// Bulk lookup:    GET /api/save-excel-upload?dnNos=0004500001,0004500002
//                 -> returns an array of matching rows (only the ones found)
//
// Response row shape (raw Supabase row from `excel_uploads`):
//   {
//     id, file_name, document_number, ship_to_name,
//     total_quantity, total_cbm, material_data, serial_data,
//     shape_names, created_at, updated_at
//   }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const singleParam = searchParams.get('dnNo') || searchParams.get('documentNumber')
    const bulkParam = searchParams.get('dnNos') || searchParams.get('documentNumbers')

    const documentNumbers = bulkParam
      ? bulkParam.split(',').map(s => s.trim()).filter(Boolean)
      : singleParam
        ? [singleParam.trim()]
        : []

    if (documentNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Provide a dnNo (single) or dnNos (comma-separated) query parameter' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('excel_uploads')
      .select('*')
      .in('document_number', documentNumbers)

    if (error) {
      console.error('Supabase select error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No saved record found for the given DN number(s)' },
        { status: 404 }
      )
    }

    // Single lookup returns a single object; bulk lookup returns an array
    if (!bulkParam) {
      return NextResponse.json(data[0])
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}