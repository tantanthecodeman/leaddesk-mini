'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leadSchema, type LeadInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const BUDGET_OPTIONS = [
  { value: '<1k', label: 'Under $1,000' },
  { value: '1k-5k', label: '$1,000 – $5,000' },
  { value: '5k-20k', label: '$5,000 – $20,000' },
  { value: '20k+', label: '$20,000+' },
] as const

type FormErrors = Partial<Record<keyof LeadInput, string>>

export function LeadForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '', email: '', budgetRange: '', message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = leadSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const [key, value] of Object.entries(result.error.flatten().fieldErrors)) {
        fieldErrors[key as keyof LeadInput] = value?.[0]
      }
      setErrors(fieldErrors)
      return
    }

    setStatus('submitting')

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),
    })

    if (!res.ok) {
      setStatus('idle')
      setErrors({ email: 'Something went wrong. Please try again.' })
      return
    }

    setStatus('success')
    router.refresh()
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-8 text-center">
        <p className="text-lg font-medium text-stone-900">Message received.</p>
        <p className="mt-1 text-stone-600">We&apos;ll get back to you within a day.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Jane Cooper"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="jane@company.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Budget range</label>
        <select
          value={formData.budgetRange}
          onChange={(e) => handleChange('budgetRange', e.target.value)}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Select a range</option>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.budgetRange && <p className="mt-1 text-sm text-red-600">{errors.budgetRange}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Message</label>
        <Textarea
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Tell us a bit about what you need..."
          rows={4}
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
      </div>

      <Button type="submit" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  )
}