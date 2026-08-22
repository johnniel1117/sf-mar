import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchText = query.trim().toUpperCase()

    // Search for documents that CONTAIN the search text
    // Include total_cbm in the select query
    const { data, error } = await supabase
      .from('excel_uploads')
      .select('document_number, ship_to_name, total_quantity, total_cbm, serial_data')
      .ilike('document_number', `%${searchText}%`)
      .limit(20)
    
    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Map to expected format with CBM calculation
    const results = data.map(doc => {
      // Calculate CBM if available
      let totalCbm = doc.total_cbm || 0
      
      // If total_cbm is not set but serial_data exists, calculate it
      if (!totalCbm && doc.serial_data && Array.isArray(doc.serial_data)) {
        totalCbm = doc.serial_data.reduce((sum: number, item: any) => {
          const itemCbm = item.cbm || 0
          const itemQty = item.quantity || 1
          return sum + (itemCbm * itemQty)
        }, 0)
      }

      let materialCounts: Record<string, number> = {}
      if (doc.serial_data) {
        try {
          const serials = typeof doc.serial_data === 'string' ? JSON.parse(doc.serial_data) : doc.serial_data
          if (Array.isArray(serials)) {
            for (const serial of serials) {
              const materialCode = String(serial.materialCode || '').trim()
              if (materialCode) materialCounts[materialCode] = (materialCounts[materialCode] || 0) + 1
            }
          }
        } catch { /* Keep the document result when serial data is malformed. */ }
      }

      return {
        documentNumber: doc.document_number,
        shipToName: doc.ship_to_name || 'N/A',
        quantity: doc.total_quantity || 0,
        cbm: totalCbm,
        materialCounts,
      }
    })
    
    console.log('Search results with CBM:', results.filter(r => r.cbm > 0))
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}