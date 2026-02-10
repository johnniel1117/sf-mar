import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const identifier = decodeURIComponent(params.id).trim()

    // Try to fetch by report_number first (most common case)
    let { data: report, error } = await supabase
      .from('damage_reports')
      .select(`
        *,
        damage_items (*)
      `)
      .eq('report_number', identifier)
      .single()

    // If not found and identifier looks like a UUID, try by id
    if (error && identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from('damage_reports')
        .select(`
          *,
          damage_items (*)
        `)
        .eq('id', identifier)
        .single()
      
      report = result.data
      error = result.error
    }

    if (error || !report) {
      return NextResponse.json(
        { error: 'Damage report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        items: report.damage_items || []
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const identifier = decodeURIComponent(params.id).trim()

    // Try to find by report_number first
    let { data: report, error: fetchError } = await supabase
      .from('damage_reports')
      .select('id')
      .eq('report_number', identifier)
      .single()

    // If not found and identifier looks like a UUID, try by id
    if (fetchError && identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from('damage_reports')
        .select('id')
        .eq('id', identifier)
        .single()
      
      report = result.data
      fetchError = result.error
    }

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Damage report not found' },
        { status: 404 }
      )
    }

    // Delete associated items first
    const { error: itemsDeleteError } = await supabase
      .from('damage_items')
      .delete()
      .eq('damage_report_id', report.id)

    if (itemsDeleteError) {
      console.error('Error deleting items:', itemsDeleteError)
      // Continue anyway if cascade is set up in database
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('damage_reports')
      .delete()
      .eq('id', report.id)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete damage report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Damage report deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const identifier = decodeURIComponent(params.id).trim()
    const body = await request.json()

    // Try to find by report_number first
    let { data: report, error: fetchError } = await supabase
      .from('damage_reports')
      .select('id')
      .eq('report_number', identifier)
      .single()

    // If not found and identifier looks like a UUID, try by id
    if (fetchError && identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from('damage_reports')
        .select('id')
        .eq('id', identifier)
        .single()
      
      report = result.data
      fetchError = result.error
    }

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Damage report not found' },
        { status: 404 }
      )
    }

    // Prepare update object (only include fields that are provided)
    const updateData: any = {}
    
    if (body.report_date !== undefined) updateData.report_date = body.report_date
    if (body.seal_no !== undefined) updateData.seal_no = body.seal_no?.trim()
    if (body.driver_name !== undefined) updateData.driver_name = body.driver_name?.trim()
    if (body.plate_no !== undefined) updateData.plate_no = body.plate_no?.trim()
    if (body.container_no !== undefined) updateData.container_no = body.container_no?.trim()
    if (body.prepared_by !== undefined) updateData.prepared_by = body.prepared_by?.trim()
    if (body.noted_by !== undefined) updateData.noted_by = body.noted_by?.trim() || null
    if (body.acknowledged_by !== undefined) updateData.acknowledged_by = body.acknowledged_by?.trim() || null
    if (body.narrative_findings !== undefined) updateData.narrative_findings = body.narrative_findings || ''
    if (body.actions_required !== undefined) updateData.actions_required = body.actions_required || ''
    if (body.status !== undefined) updateData.status = body.status

    // Update the report
    const { error: updateError } = await supabase
      .from('damage_reports')
      .update(updateData)
      .eq('id', report.id)

    if (updateError) {
      console.error('Error updating report:', updateError)
      return NextResponse.json(
        { error: 'Failed to update damage report' },
        { status: 500 }
      )
    }

    // Handle items update if provided
    if (body.items !== undefined && Array.isArray(body.items)) {
      // Delete existing items
      await supabase
        .from('damage_items')
        .delete()
        .eq('damage_report_id', report.id)

      // Insert new items
      if (body.items.length > 0) {
        const itemsToInsert = body.items.map((item: any, index: number) => ({
          damage_report_id: report.id,
          item_number: index + 1,
          barcode: item.barcode?.trim() || '',
          material_code: item.material_code?.trim() || '',
          material_description: item.material_description?.trim() || '',
          damage_type: item.damage_type?.trim() || '',
          damage_description: item.damage_description?.trim() || '',
          photo_url: item.photo_url || null,
          mapping_id: item.mapping_id || null,
        }))

        const { error: itemsError } = await supabase
          .from('damage_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('Error updating items:', itemsError)
          // Continue anyway
        }
      }
    }

    // Fetch complete updated report
    const { data: completeReport } = await supabase
      .from('damage_reports')
      .select(`
        *,
        damage_items (*)
      `)
      .eq('id', report.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Damage report updated successfully',
      data: {
        ...completeReport,
        items: completeReport?.damage_items || []
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  // PUT is typically used for full replacement, but we'll make it work like PATCH
  return PATCH(request, context)
}