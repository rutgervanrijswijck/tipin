import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdtTimerManager from '@/components/AdtTimerManager'

export const dynamic = 'force-dynamic'

export default async function AdtTimerPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('status', 'active').order('full_name', { ascending: true })
  const { data: adts } = await supabase.from('adts').select('*').order('recorded_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/?tab=team" className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition">←</Link>
        <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">⏱️ Adt-Timer</h1>
      </div>
      
      <AdtTimerManager profiles={profiles || []} initialAdts={adts || []} />
    </main>
  )
}
