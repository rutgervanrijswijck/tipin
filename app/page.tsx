import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PollCard from '@/components/PollCard'
import AttendanceToggle from '@/components/AttendanceToggle'

// Dynamic imports for code-splitting large or captain-only components
const CalendarView = dynamic(() => import('@/components/CalendarView'))
const CreateEventForm = dynamic(() => import('@/components/CreateEventForm'))
const CreatePollForm = dynamic(() => import('@/components/CreatePollForm'))

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string, past?: string, future?: string, view?: string }> }) {
  const { tab, past, future, view } = await searchParams
  const activeTab = tab === 'polls' ? 'polls' : tab === 'team' ? 'team' : 'schedule'
  const isCalendarView = view === 'calendar'
  
  // Parse pagination limits
  const pastLimit = parseInt(past || '0', 10)
  const futureLimit = parseInt(future || '15', 10)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // --- FETCH LOGIC (Selective + Parallelized) ---
  const todayStr = new Date().toISOString()

  // 1. Fetch Profile (only required columns)
  const profilePromise = supabase.from('profiles').select('role, full_name, avatar_url').eq('id', user.id).single()
  
  // 2. Fetch Polls (only full payload when rendered on polls tab or calendar view)
  const pollsPromise = (activeTab === 'polls' || isCalendarView)
    ? supabase
        .from('polls')
        .select('id, question, relevant_date, options, max_choices, poll_votes(user_id, option_index)')
        .order('created_at', { ascending: false })
        .limit(20)
    : Promise.resolve({ data: [] } as any)

  // 3. Fetch Events (only required columns, lean limits)
  let futuresPromise: any = Promise.resolve({ data: null })
  let pastsPromise: any = Promise.resolve({ data: null })

  if (activeTab === 'schedule') {
    futuresPromise = supabase
      .from('events')
      .select('id, title, event_type, start_time, answer_by, reason_required_out, reason_required_maybe, attendance(user_id, status, reason)') 
      .gte('start_time', todayStr)
      .order('start_time', { ascending: true })
      .limit(isCalendarView ? 100 : futureLimit)

    if (pastLimit > 0) {
      pastsPromise = supabase
        .from('events')
        .select('id, title, event_type, start_time, answer_by, reason_required_out, reason_required_maybe, attendance(user_id, status, reason)') 
        .lt('start_time', todayStr)
        .order('start_time', { ascending: false })
        .limit(pastLimit)
    }
  }

  const [
    { data: profile },
    { data: pollsData },
    { data: futures },
    { data: pasts }
  ] = await Promise.all([profilePromise, pollsPromise, futuresPromise, pastsPromise])

  const isAanvoerder = profile?.role === 'captain'
  const polls = pollsData || []
  let futureEvents = futures || []
  let pastEvents = (pasts || []).reverse()

  const getCounts = (attendance: any[]) => ({
    in: attendance.filter(a => a.status === 'in').length,
    out: attendance.filter(a => a.status === 'out').length,
    maybe: attendance.filter(a => a.status === 'maybe').length,
  })

  // Urgent unanswered event detection: deadline within 7 days from now and not yet answered
  const now = new Date()
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000

  const isUrgentUnanswered = (e: any) => {
    if (!e.answer_by) return false
    const myStatus = e.attendance?.find((a: any) => a.user_id === user.id)?.status
    if (myStatus === 'in' || myStatus === 'out' || myStatus === 'maybe') return false

    const deadline = new Date(e.answer_by)
    const diff = deadline.getTime() - now.getTime()
    return diff > -24 * 60 * 60 * 1000 && diff <= oneWeekMs
  }

  // Bring unanswered urgent events to the top of the upcoming list
  const urgentFutureEvents = futureEvents.filter((e: any) => isUrgentUnanswered(e))
  const regularFutureEvents = futureEvents.filter((e: any) => !isUrgentUnanswered(e))
  const sortedFutureEvents = [...urgentFutureEvents, ...regularFutureEvents]

  // Reusable Event Card Component with prefetch={false} to stop network congestion
  const EventCard = ({ event, opacity = 1 }: { event: any, opacity?: number }) => {
    const counts = getCounts(event.attendance || [])
    const myStatus = event.attendance.find((a: any) => a.user_id === user.id)?.status
    const isUrgent = isUrgentUnanswered(event)
    const emoji = event.event_type === 'match_home' || event.event_type === 'match_away' ? '⚔️' : event.event_type === 'training' ? '🏋️' : '🍻'
    
    return (
      <Link href={`/events/${event.id}`} prefetch={false} className="block group">
        <div 
          className={`p-3 rounded-2xl shadow-sm border transition-all duration-200 relative overflow-hidden pl-5
            ${isUrgent 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200 group-hover:border-amber-400' 
              : 'bg-white border-white group-hover:border-blue-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
            }`} 
          style={{ opacity }}
        >
          {/* Left Stripe Indicator */}
          <div className={`w-1.5 h-full absolute left-0 top-0 
            ${isUrgent
              ? 'bg-amber-500'
              : event.event_type === 'match_home' || event.event_type === 'match_away' ? 'bg-orange-500' : event.event_type === 'training' ? 'bg-blue-500' : 'bg-green-500'}`} 
          />

          {/* Urgent Deadline Notice Header */}
          {isUrgent && event.answer_by && (
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md mb-2">
              <span className="flex items-center gap-1">
                <span>⏰</span> Response requested!
              </span>
              <span>
                By {new Date(event.answer_by).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(event.answer_by).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Header Row: Emoji next to Title, Date & Time on Right */}
          <div className="mb-2 flex justify-between items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base leading-none shrink-0">{emoji}</span>
                {isUrgent && (
                  <span className="bg-red-500 text-white text-[10px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 shadow-sm" title="Deadline within a week!">
                    !
                  </span>
                )}
                <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                  {event.title}
                </h2>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'long' })}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-blue-600">
                {new Date(event.start_time).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] text-gray-500">
                {new Date(event.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute:'2-digit' })}
              </p>
            </div>
          </div>

          {/* Count Badges */}
          <div className="flex gap-2 mb-2 text-xs font-semibold">
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">👍 {counts.in}</span>
              <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded">🤔 {counts.maybe}</span>
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">👎 {counts.out}</span>
          </div>

          <AttendanceToggle 
            eventId={event.id} 
            userId={user.id} 
            initialStatus={myStatus}
            initialReason={event.attendance.find((a: any) => a.user_id === user.id)?.reason}
            config={{
              reqOut: event.reason_required_out,
              reqMaybe: event.reason_required_maybe
            }}
          />
        </div>
      </Link>
    )
  }

  // --- Optimization: Strip Data for CalendarView (Only when calendar view is open) ---
  const calendarEvents = isCalendarView ? [...pastEvents, ...futureEvents].map((e: any) => ({
    id: e.id,
    start_time: e.start_time,
    event_type: e.event_type,
    title: e.title,
    replyText: e.attendance?.find((a: any) => a.user_id === user.id)?.status || null
  })) : []

  const calendarPolls = isCalendarView ? polls.filter((p: any) => p.relevant_date).map((p: any) => {
    const myVote = p.poll_votes?.find((v: any) => v.user_id === user.id)
    return {
      id: p.id,
      relevant_date: p.relevant_date,
      question: p.question,
      replyText: myVote && p.options ? p.options[myVote.option_index] : null
    }
  }) : []

  return (
    <main className="min-h-screen bg-[#F2F4F7] pb-32">
      
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 mb-6 shadow-sm rounded-b-[2rem]">
        <div className="max-w-md mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              🏑TipIn
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href={`/team/player/${user.id}`} 
              prefetch={false} 
              className="group flex items-center gap-2.5 transition"
            >
              <span className="text-gray-700 font-bold text-sm group-hover:text-blue-600 transition">
                {profile?.full_name?.split(' ')[0]}
              </span>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-500 transition">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || 'Profile'} className="w-full h-full object-cover" />
                ) : (
                  <span>{profile?.full_name?.charAt(0) || '👤'}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5">
        
        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Bar: 'Load earlier events' button next to 'List / Calendar' view toggle */}
            <div className="flex items-center justify-between gap-2 mb-1">
              {!isCalendarView ? (
                <Link 
                  href={`/?past=${pastLimit + 10}${futureLimit !== 15 ? `&future=${futureLimit}` : ''}`} 
                  scroll={false}
                  prefetch={false}
                  className="text-xs font-semibold text-gray-600 bg-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
                >
                  {pastLimit === 0 ? 'Load earlier events' : `Load +10 earlier`}
                </Link>
              ) : <div />}

              <div className="flex bg-gray-200 p-0.5 rounded-lg shrink-0">
                <Link href={`/?tab=schedule&view=list`} scroll={false} prefetch={false} className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${!isCalendarView ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>List</Link>
                <Link href={`/?tab=schedule&view=calendar`} scroll={false} prefetch={false} className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${isCalendarView ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Calendar</Link>
              </div>
            </div>

            {isCalendarView ? (
              <CalendarView events={calendarEvents} polls={calendarPolls} userId={user.id} />
            ) : (
              <>
                {isAanvoerder && <CreateEventForm userId={user.id} />}

                {/* 2. PAST EVENTS (Slightly faded) */}
                {pastEvents.map((event: any) => (
                   <EventCard key={event.id} event={event} opacity={0.6} />
                ))}

                {/* Divider if we have past events */}
                {pastEvents.length > 0 && <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest my-3">Today</div>}

                {/* 3. FUTURE EVENTS (Urgent unanswered events brought to the top!) */}
                {sortedFutureEvents.length === 0 && <div className="text-center text-gray-400 py-10">No upcoming events.</div>}
                
                {sortedFutureEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}

                {/* 4. LOAD MORE FUTURE EVENTS BUTTON (Only if there could be more) */}
                {futureEvents.length >= futureLimit && (
                  <div className="flex justify-center pt-2 pb-2">
                     <Link 
                       href={`/?future=${futureLimit + 15}${pastLimit > 0 ? `&past=${pastLimit}` : ''}`} 
                       scroll={false}
                       prefetch={false}
                       className="text-xs font-semibold text-gray-500 bg-gray-200 px-4 py-2 rounded-full hover:bg-gray-300 transition"
                     >
                       Load 15 more upcoming events
                     </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* POLLS TAB */}
        {activeTab === 'polls' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAanvoerder && <CreatePollForm />}

            {polls.map((poll: any) => {
              const myVotes = poll.poll_votes.filter((v: any) => v.user_id === user.id).map((v: any) => v.option_index)
              
              // Precalculate totals to avoid sending all poll_votes to the client
              const counts = poll.options.map((_: any, index: number) => 
                poll.poll_votes ? poll.poll_votes.filter((v: any) => v.option_index === index).length : 0
              )
              const uniqueVoters = new Set(poll.poll_votes?.map((v:any) => v.user_id)).size

              // Pass a stripped-down poll object
              const strippedPoll = {
                id: poll.id,
                question: poll.question,
                relevant_date: poll.relevant_date,
                options: poll.options,
                max_choices: poll.max_choices
              }

              return (
                <PollCard 
                  key={poll.id} 
                  poll={strippedPoll} 
                  userId={user.id} 
                  myVotes={myVotes}
                  counts={counts}
                  uniqueVoters={uniqueVoters}
                  detailLink={`/polls/${poll.id}`} 
                />
              )
            })}
            {polls.length === 0 && (
              <div className="text-center text-gray-800 py-20 opacity-70">
                <div className="text-6xl mb-4">📊</div>
                <p>No polls active</p>
              </div>
            )}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
             <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2">Team Headquarters</h2>
             <div className="grid grid-cols-2 gap-4">
                <Link href="/team/roster" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl">👥</div>
                   <span className="font-bold text-gray-800">Roster</span>
                </Link>
                <Link href="/team/stats" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition">
                   <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl">📊</div>
                   <span className="font-bold text-gray-800">Stats</span>
                </Link>
                <Link href="/team/adt-timer" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition">
                   <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-3xl">⏱️</div>
                   <span className="font-bold text-gray-800">Adt-Timer</span>
                </Link>
                <Link href="/team/boetes" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition">
                   <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl">💸</div>
                   <span className="font-bold text-gray-800">Boetes</span>
                </Link>
             </div>
          </div>
        )}

      </div>
    </main>
  )
}