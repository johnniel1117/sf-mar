import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Get sample of documents with their CBM data
    const { data: samples, error: sampleError } = await supabase
      .from('excel_uploads')
      .select('document_number, total_cbm, serial_data')
      .limit(5)

    if (sampleError) {
      return NextResponse.json({ error: sampleError.message }, { status: 500 })
    }

    // Get count of records with CBM > 0
    const { count: cbmCount, error: countError } = await supabase
      .from('excel_uploads')
      .select('*', { count: 'exact', head: true })
      .gt('total_cbm', 0)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get total records
    const { count: totalCount, error: totalError } = await supabase
      .from('excel_uploads')
      .select('*', { count: 'exact', head: true })

    // Check column information
    const { data: firstRow } = await supabase
      .from('excel_uploads')
      .select('*')
      .limit(1)

    const columns = firstRow && firstRow.length > 0 ? Object.keys(firstRow[0]) : []

    return NextResponse.json({
      totalRecords: totalCount || 0,
      recordsWithCBM: cbmCount || 0,
      columns: columns,
      samples: samples || [],
      message: 'Use browser console to see full data'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}