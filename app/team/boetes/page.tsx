import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BoeteManager from '@/components/BoeteManager'

export const dynamic = 'force-dynamic'

export default async function BoetesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isCaptain = profile?.role === 'captain'

  const { data: boetes } = await supabase
    .from('boetes')
    .select('*, profiles(full_name), boete_types(name)')
    .eq('status', 'unpaid')
    .order('issued_at', { ascending: false })

  const { data: boeteTypes } = await supabase.from('boete_types').select('*').order('name', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/?tab=team" className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition">←</Link>
        <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">💸 Penalty Pot (Boetes)</h1>
      </div>
      <BoeteManager initialBoetes={boetes || []} boeteTypes={boeteTypes || []} isCaptain={isCaptain} />
    </main>
  )
}
