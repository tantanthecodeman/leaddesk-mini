'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Lead = {
  id: string
  name: string
  email: string
  budget_range: string
  message: string
  status: 'New' | 'Contacted' | 'Closed'
  created_at: string
}

const STATUS_FLOW: Record<Lead['status'], Lead['status']> = {
  New: 'Contacted',
  Contacted: 'Closed',
  Closed: 'New',
}

const STATUS_COLOR: Record<Lead['status'], string> = {
  New: 'bg-blue-100 text-blue-800',
  Contacted: 'bg-amber-100 text-amber-800',
  Closed: 'bg-green-100 text-green-800',
}

export function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(
      (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    )
  }, [leads, search])

  async function toggleStatus(lead: Lead) {
    const nextStatus = STATUS_FLOW[lead.status]
    setUpdatingId(lead.id)

    const previous = leads
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: nextStatus } : l))
    )

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (!res.ok) {
      setLeads(previous)
    }

    setUpdatingId(null)
    router.refresh()
  }

  return (
    <div>
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3 text-stone-600">{lead.email}</td>
                <td className="px-4 py-3 text-stone-600">{lead.budget_range}</td>
                <td className="max-w-xs truncate px-4 py-3 text-stone-600">{lead.message}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(lead)}
                    disabled={updatingId === lead.id}
                    className="disabled:opacity-50"
                  >
                    <Badge className={STATUS_COLOR[lead.status]}>
                      {updatingId === lead.id ? 'Updating...' : lead.status}
                    </Badge>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No leads match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}