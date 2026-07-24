import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { statusSchema } from '@/lib/validation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = statusSchema.safeParse(body.status)

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const { error } = await supabase
    .from('leads')
    .update({ status: result.data })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Could not update lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}