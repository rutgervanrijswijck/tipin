import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationSettings from '@/components/NotificationSettings'
import { getNotificationPreferencesServer } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const preferences = await getNotificationPreferencesServer()

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/?tab=team" className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition">
          ←
        </Link>
        <h1 className="font-bold text-lg text-black flex items-center gap-2">
          🔔 Notifications
        </h1>
      </div>

      <div className="max-w-md mx-auto p-4 mt-2">
        <NotificationSettings initialPreferences={preferences} />
      </div>
    </main>
  )
}
