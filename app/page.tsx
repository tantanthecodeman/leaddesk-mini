import { LeadForm } from '@/components/LeadForm'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-stone-900">Let&apos;s talk about your project</h1>
        <p className="mt-2 text-stone-600">
          Tell us what you&apos;re building and your rough budget — we&apos;ll follow up within a day.
        </p>
      </div>
      <LeadForm />
    </main>
  )
}