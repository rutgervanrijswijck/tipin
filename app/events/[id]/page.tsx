import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttendanceToggle from '@/components/AttendanceToggle'
import DeleteButton from '@/components/DeleteButton'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. GET USER FIRST (Critical: This must happen before we use user.id)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. GET PROFILE (Now safe to use user.id)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAanvoerder = profile?.role === 'coach'

  // 3. GET EVENT DATA
  const { data: event } = await supabase
    .from('events')
    .select('*, attendance(*, profiles(*))') // Fetch event + attendance + user names
    .eq('id', id)
    .single()

  // 4. GET ALL PLAYERS (To see who is missing)
  const { data: allPlayers } = await supabase.from('profiles').select('*')

  if (!event || !allPlayers) return <div className="p-8 text-center text-gray-500">Event not found</div>

  // Sort players into buckets
  const inPlayers = event.attendance.filter((a: any) => a.status === 'in')
  const outPlayers = event.attendance.filter((a: any) => a.status === 'out')
  const maybePlayers = event.attendance.filter((a: any) => a.status === 'maybe')
  
  const votedIds = event.attendance.map((a: any) => a.user_id)
  const noVotePlayers = allPlayers.filter(p => !votedIds.includes(p.id))

  // Find my current status
  const myAttendance = event.attendance.find((a: any) => a.user_id === user.id)

  // Helper component for list items
  const PlayerList = ({ title, players, color }: any) => (
    <div className="mb-6">
      <h3 className={`font-bold text-sm mb-2 uppercase tracking-wide ${color}`}>{title} ({players.length})</h3>
      {players.length === 0 ? <p className="text-sm text-gray-400 italic">Nobody yet.</p> : (
        <div className="space-y-2">
          {players.map((item: any) => {
            const p = item.profiles || item
            const reason = item.reason // Get the reason text
            
            return (
              <div key={p.id} className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {p.full_name?.[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{p.full_name}</span>
                </div>
                {/* Show Reason if it exists */}
                {reason && (
                  <div className="mt-2 ml-11 text-xs text-gray-500 bg-gray-50 p-2 rounded italic">
                    "{reason}"
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full flex-shrink-0">←</Link>
          <h1 className="font-bold text-lg truncate">{event.title}</h1>
        </div>
        {/* Delete Button (Only for Aanvoerder) */}
        {isAanvoerder && <DeleteButton id={event.id} table="events" redirectPath="/" />}
      </div>

      <div className="max-w-md mx-auto p-6">
        {/* Info Card */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <p className="text-sm text-gray-500 mb-1">
            {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' • '}
            {new Date(event.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute:'2-digit' })}
          </p>
          <p className="text-gray-900 font-medium mb-4">📍 {event.location || 'No location set'}</p>
          
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Update Status</p>
          
          <AttendanceToggle 
            eventId={event.id} 
            userId={user.id} 
            initialStatus={myAttendance?.status}
            initialReason={myAttendance?.reason}
            config={{
              reqOut: event.reason_required_out,
              reqMaybe: event.reason_required_maybe
            }}
          />
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 gap-4">
          <PlayerList title="Present" players={inPlayers} color="text-green-600" />
          <PlayerList title="Maybe" players={maybePlayers} color="text-orange-600" />
          <PlayerList title="Absent" players={outPlayers} color="text-red-600" />
          <PlayerList title="No Response" players={noVotePlayers} color="text-gray-400" />
        </div>
      </div>
    </main>
  )
}