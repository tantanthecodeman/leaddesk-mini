import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = leadSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    name: result.data.name,
    email: result.data.email,
    budget_range: result.data.budgetRange,
    message: result.data.message,
  })

  if (error) {
    return NextResponse.json({ error: 'Could not save lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') ?? ''

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Could not fetch leads' }, { status: 500 })
  }

  return NextResponse.json({ leads: data })
}