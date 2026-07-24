import { createClient } from '@/lib/supabase/server'
import { LeadsTable } from '@/components/LeadsTable'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="p-8 text-red-600">Could not load leads.</p>
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Leads</h1>
      <LeadsTable initialLeads={leads ?? []} />
    </main>
  )
}