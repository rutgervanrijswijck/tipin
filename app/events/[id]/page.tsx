import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttendanceToggle from '@/components/AttendanceToggle'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch Event + All Attendance
  const { data: event } = await supabase
    .from('events')
    .select('*, attendance(*, profiles(*))') // Nested join to get names!
    .eq('id', id)
    .single()

  // 2. Fetch ALL Team Members (to see who hasn't voted)
  const { data: allPlayers } = await supabase.from('profiles').select('*')

  if (!event || !allPlayers) return <div>Event not found</div>

  // 3. Sort players into buckets
  const inPlayers = event.attendance.filter((a: any) => a.status === 'in')
  const outPlayers = event.attendance.filter((a: any) => a.status === 'out')
  const maybePlayers = event.attendance.filter((a: any) => a.status === 'maybe')
  
  const votedIds = event.attendance.map((a: any) => a.user_id)
  const noVotePlayers = allPlayers.filter(p => !votedIds.includes(p.id))

  // Find my current status
  const myVote = event.attendance.find((a: any) => a.user_id === user.id)?.status

  // Helper component for list items
  const PlayerList = ({ title, players, color }: any) => (
    <div className="mb-6">
      <h3 className={`font-bold text-sm mb-2 uppercase tracking-wide ${color}`}>{title} ({players.length})</h3>
      {players.length === 0 ? <p className="text-sm text-gray-400 italic">Nobody yet.</p> : (
        <div className="space-y-2">
          {players.map((item: any) => {
            const p = item.profiles || item
            // Check if there is a reason attached
            const reason = item.reason 
            
            return (
              <div key={p.id} className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {p.full_name?.[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{p.full_name}</span>
                </div>
                
                {/* DISPLAY REASON IF IT EXISTS */}
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
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">←</Link>
        <h1 className="font-bold text-lg truncate">{event.title}</h1>
      </div>

      <div className="max-w-md mx-auto p-6">
        {/* Info Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          <p className="text-sm text-gray-500 mb-1">
            {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' • '}
            {new Date(event.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute:'2-digit' })}
          </p>
          <p className="text-gray-900 font-medium mb-4">📍 {event.location}</p>
          
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Update Status</p>
          <AttendanceToggle 
            eventId={event.id} 
            userId={user.id} 
            initialStatus={myVote} 
            initialReason={event.attendance.find((a: any) => a.user_id === user.id)?.reason}
            config={{
              reqOut: event.reason_required_out,
              reqMaybe: event.reason_required_maybe
            }}
          />
        </div>

        {/* Lists */}
        <div className="grid grid-cols-2 gap-4">
          <PlayerList title="Present" players={inPlayers} color="text-green-600" />
          <PlayerList title="Absent" players={outPlayers} color="text-red-600" />
          <PlayerList title="Maybe" players={maybePlayers} color="text-orange-600" />
          <PlayerList title="No Response" players={noVotePlayers} color="text-gray-500" />
        </div>
      </div>
    </main>
  )
}