import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      {user && (
        <header className="border-b border-stone-200 px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-stone-500">{user.email}</span>
          <LogoutButton />
        </header>
      )}
      {children}
    </div>
  )
}