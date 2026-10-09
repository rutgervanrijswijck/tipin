import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttendanceToggle from '@/components/AttendanceToggle'
import DeleteButton from '@/components/DeleteButton'
import CaptainPenaltyButtons from '@/components/CaptainPenaltyButtons'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. GET USER FIRST
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: event },
    { data: allPlayers },
    { data: boeteTypes },
    { data: eventBoetes }
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('events').select('*, attendance(*, profiles(*))').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name, status'),
    supabase.from('boete_types').select('id, name, default_amount'),
    supabase.from('boetes').select('id, user_id, boete_type_id, boete_types(name)').eq('event_id', id)
  ])

  const isAanvoerder = profile?.role === 'captain'

  if (!event || !allPlayers) return <div className="p-8 text-center text-gray-500">Event not found</div>

  const boeteTypesMap = Object.fromEntries((boeteTypes || []).map((b: any) => [b.name, b]))
  const existingBoetes = eventBoetes || []

  // Sort players into buckets
  const inPlayers = event.attendance.filter((a: any) => a.status === 'in')
  const outPlayers = event.attendance.filter((a: any) => a.status === 'out')
  const maybePlayers = event.attendance.filter((a: any) => a.status === 'maybe')
  
  const votedIds = event.attendance.map((a: any) => a.user_id)
  const noVotePlayers = allPlayers.filter(p => !votedIds.includes(p.id))
  const missingActivePlayers = allPlayers.filter(p => p.status === 'active' && !votedIds.includes(p.id))

  // Deadline logic
  const isPastDeadline = Boolean(event.answer_by && new Date(event.answer_by) < new Date())

  // Lazy Missed Deadline Fine Calculation for Events
  if (isPastDeadline && missingActivePlayers.length > 0) {
    const missedType = boeteTypesMap['Missed deadline']
    if (missedType) {
      const alreadyFinedIds = existingBoetes
        .filter((b: any) => b.boete_type_id === missedType.id)
        .map((b: any) => b.user_id)

      const playersToFine = missingActivePlayers.filter(p => !alreadyFinedIds.includes(p.id))

      if (playersToFine.length > 0) {
        await supabase.from('boetes').insert(
          playersToFine.map(p => ({
            user_id: p.id,
            event_id: event.id,
            boete_type_id: missedType.id,
            amount: missedType.default_amount,
            reason: `Missed deadline for event: ${event.title}`
          }))
        )
      }
    }
  }

  // Find my current status
  const myAttendance = event.attendance.find((a: any) => a.user_id === user.id)

  // Helper component for list items
  const PlayerList = ({ title, players, color, statusType }: any) => (
    <div className="mb-6">
      <h3 className={`font-bold text-sm mb-2 uppercase tracking-wide ${color}`}>{title} ({players.length})</h3>
      {players.length === 0 ? <p className="text-sm text-gray-400 italic">Nobody yet.</p> : (
        <div className="space-y-2">
          {players.map((item: any) => {
            const p = item.profiles || item
            const reason = item.reason
            const playerFines = existingBoetes.filter((b: any) => b.user_id === p.id)
            
            return (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {p.full_name?.[0]}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 truncate">{p.full_name}</span>
                  </div>

                  {/* Captain Fine Buttons */}
                  {isAanvoerder && (
                    <CaptainPenaltyButtons
                      userId={p.id}
                      eventId={event.id}
                      status={statusType}
                      boeteTypesMap={boeteTypesMap}
                      eventTitle={event.title}
                    />
                  )}
                </div>

                {/* Show reason if provided */}
                {reason && (
                  <div className="ml-11 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg italic">
                    "{reason}"
                  </div>
                )}

                {/* Show fines issued for this event */}
                {playerFines.length > 0 && (
                  <div className="ml-11 flex flex-wrap gap-1.5">
                    {playerFines.map((f: any) => (
                      <span key={f.id} className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        💸 {f.boete_types?.name || 'Penalty'}
                      </span>
                    ))}
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
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link href="/" prefetch={false} className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full flex-shrink-0">←</Link>
          <h1 className="font-bold text-lg text-black truncate">{event.title}</h1>
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
          <p className="text-gray-900 font-medium mb-2">📍 {event.location || 'No location set'}</p>

          {event.answer_by && (
            <p className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md w-fit mb-4">
              ⏰ Answer by: {new Date(event.answer_by).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          {isPastDeadline && !isAanvoerder ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              ⚠️ The deadline to adjust your attendance has passed. Only captains can make changes now.
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 gap-4">
          <PlayerList title="Present" players={inPlayers} color="text-green-600" statusType="in" />
          <PlayerList title="Maybe" players={maybePlayers} color="text-orange-600" statusType="maybe" />
          <PlayerList title="Absent" players={outPlayers} color="text-red-600" statusType="out" />
          <PlayerList title="No Response" players={noVotePlayers} color="text-gray-400" statusType="novote" />
        </div>
      </div>
    </main>
  )
}