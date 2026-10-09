import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import ProfileAvatarEditor from '@/components/ProfileAvatarEditor'
import SignOutButton from '@/components/SignOutButton'

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: currentUserProfile },
    { data: profile },
    { data: attendanceData }
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('attendance').select('status, event_id, events(event_type)').eq('user_id', id)
  ])

  const isCaptain = currentUserProfile?.role === 'captain'
  const isMe = user.id === id

  if (!profile) return <div className="p-4 text-center">Player not found</div>

  const calcRate = (types: string[]) => {
    const relevant = attendanceData?.filter(a => a.events && types.includes((a.events as any).event_type as string)) || []
    if (relevant.length === 0) return '-'
    const present = relevant.filter(a => a.status === 'in').length
    return Math.round((present / relevant.length) * 100) + '%'
  }

  const overallRate = calcRate(['training', 'match_home', 'match_away', 'social'])
  const trainingRate = calcRate(['training'])
  const matchRate = calcRate(['match_home', 'match_away'])
  const socialRate = calcRate(['social'])

  async function updateName(formData: FormData) {
    'use server'
    const newName = formData.get('full_name') as string
    if (newName) {
      const cookieStore = await cookies()
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
      )
      await supabaseAdmin.from('profiles').update({ full_name: newName }).eq('id', id)
      revalidatePath(`/team/player/${id}`)
      revalidatePath('/team/roster')
      revalidatePath('/')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/?tab=team" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">←</Link>
        <h1 className="font-bold text-lg text-black">Player Profile</h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="mb-4">
            <ProfileAvatarEditor
              userId={id}
              fullName={profile.full_name || ''}
              initialAvatarUrl={profile.avatar_url || null}
              isEditable={isMe || isCaptain}
            />
          </div>
           
          {(isMe || isCaptain) ? (
            <form action={updateName} className="flex gap-2 justify-center mb-2">
              <input name="full_name" defaultValue={profile.full_name} className="border border-gray-200 px-3 py-1 rounded-xl text-center font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-xl font-bold hover:bg-blue-100 transition">Save</button>
            </form>
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.full_name}</h2>
          )}
           
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full font-semibold uppercase">{profile.role}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
              profile.status === 'active' ? 'bg-green-100 text-green-700' :
              profile.status === 'on-leave' ? 'bg-orange-100 text-orange-700' :
              profile.status === 'trainingslid' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-200 text-gray-700'
            }`}>
              {profile.status === 'trainingslid' ? 'Trainingslid' : profile.status || 'active'}
            </span>
          </div>
           
          <p className="text-sm text-gray-500">
            Joined: {new Date(profile.joined_at || new Date()).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Attendance Stats Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Attendance Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Overall</p>
              <p className="text-2xl font-bold text-gray-900">{overallRate}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-500 font-bold uppercase mb-1">Trainings</p>
              <p className="text-2xl font-bold text-blue-900">{trainingRate}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-500 font-bold uppercase mb-1">Matches</p>
              <p className="text-2xl font-bold text-orange-900">{matchRate}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-500 font-bold uppercase mb-1">Socials</p>
              <p className="text-2xl font-bold text-green-900">{socialRate}</p>
            </div>
          </div>
        </div>

        {/* Account Management (Only for current user) */}
        {isMe && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-bold text-gray-900 mb-2 border-b pb-2">Account Settings</h3>
            
            <Link
              href={`/team/player/${id}/change-password`}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-98"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Change Password
            </Link>

            <SignOutButton />
          </div>
        )}
      </div>
    </main>
  )
}
