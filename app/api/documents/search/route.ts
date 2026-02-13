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
    const { data, error } = await supabase
      .from('excel_uploads')
      .select('document_number, ship_to_name, total_quantity')
      .ilike('document_number', `%${searchText}%`)
      .limit(20)
    
    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Map to expected format
    const results = data.map(doc => ({
      documentNumber: doc.document_number,
      shipToName: doc.ship_to_name || 'N/A',
      quantity: doc.total_quantity || 0
    }))
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}