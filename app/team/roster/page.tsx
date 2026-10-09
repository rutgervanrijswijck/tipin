import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TeamHub from '@/components/TeamHub'

export default async function RosterPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: teamProfiles } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/?tab=team" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">←</Link>
        <h1 className="font-bold text-lg">Team Roster</h1>
      </div>
      <div className="max-w-md mx-auto p-4">
         <TeamHub profiles={teamProfiles || []} currentUserRole={profile?.role} currentUserId={user.id} />
      </div>
    </main>
  )
}
