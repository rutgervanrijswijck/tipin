import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PollCard from '@/components/PollCard'
import BottomNav from '@/components/BottomNav'
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
  const profilePromise = supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  
  // 2. Fetch Polls (only full payload when rendered on polls tab or calendar view)
  const pollsPromise = (activeTab === 'polls' || isCalendarView)
    ? supabase
        .from('polls')
        .select('id, question, relevant_date, options, max_choices, poll_votes(user_id, option_index)')
        .order('created_at', { ascending: false })
        .limit(20)
    : supabase
        .from('polls')
        .select('id, poll_votes(user_id)')
        .limit(20)

  // 3. Fetch Events (only required columns, lean limits)
  let futuresPromise: any = Promise.resolve({ data: null })
  let pastsPromise: any = Promise.resolve({ data: null })

  if (activeTab === 'schedule') {
    futuresPromise = supabase
      .from('events')
      .select('id, title, event_type, start_time, reason_required_out, reason_required_maybe, attendance(user_id, status, reason)') 
      .gte('start_time', todayStr)
      .order('start_time', { ascending: true })
      .limit(isCalendarView ? 100 : futureLimit)

    if (pastLimit > 0) {
      pastsPromise = supabase
        .from('events')
        .select('id, title, event_type, start_time, reason_required_out, reason_required_maybe, attendance(user_id, status, reason)') 
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

  // Calculate the notification count (works efficiently across all tabs)
  const unansweredPollsCount = polls.filter((poll: any) => {
    const hasVoted = poll.poll_votes?.some((v: any) => v.user_id === user.id)
    return !hasVoted
  }).length

  const getCounts = (attendance: any[]) => ({
    in: attendance.filter(a => a.status === 'in').length,
    out: attendance.filter(a => a.status === 'out').length,
    maybe: attendance.filter(a => a.status === 'maybe').length,
  })

  // Reusable Event Card Component with prefetch={false} to stop network congestion
  const EventCard = ({ event, opacity = 1 }: { event: any, opacity?: number }) => {
    const counts = getCounts(event.attendance || [])
    const myStatus = event.attendance.find((a: any) => a.user_id === user.id)?.status
    
    return (
      <Link href={`/events/${event.id}`} prefetch={false} className="block group">
        <div className={`bg-white p-3 rounded-r-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group-hover:border-blue-200 transition-all duration-300 relative overflow-hidden pl-7`} style={{ opacity }}>
          
          <div className={`w-2 h-full absolute left-0 top-0 
            ${event.event_type === 'match_home' || event.event_type === 'match_away' ? 'bg-orange-500' : event.event_type === 'training' ? 'bg-blue-500' : 'bg-green-500'}`} 
          />

          <div className="mb-4 flex justify-between items-start gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'long' })}
              </p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow-sm mb-2">
                  {event.event_type === 'match_home' || event.event_type === 'match_away' ? '⚔️' : event.event_type === 'training' ? '🏋️' : '🍻'}
                </div>
                {event.title}
              </h2>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-lg font-bold text-blue-600">
                {new Date(event.start_time).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(event.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute:'2-digit' })}
              </p>
            </div>
          </div>

          {/* Count Badges */}
          <div className="flex gap-2 mb-4 text-xs font-semibold">
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded">👍 {counts.in}</span>
              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">🤔 {counts.maybe}</span>
              <span className="bg-red-50 text-red-700 px-2 py-1 rounded">👎 {counts.out}</span>
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
            <Link href={`/team/player/${user.id}`} prefetch={false} className="text-gray-500 font-medium text-sm hover:text-blue-600 transition">
              {profile?.full_name?.split(' ')[0]}
            </Link>
            <form action="/auth/signout" method="post">
              <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5">
        
        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* View Toggle */}
            <div className="flex bg-gray-200 p-1 rounded-lg w-fit mx-auto mb-4">
              <Link href={`/?tab=schedule&view=list`} scroll={false} prefetch={false} className={`px-4 py-1 text-sm rounded-md font-semibold transition-all ${!isCalendarView ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>List</Link>
              <Link href={`/?tab=schedule&view=calendar`} scroll={false} prefetch={false} className={`px-4 py-1 text-sm rounded-md font-semibold transition-all ${isCalendarView ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Calendar</Link>
            </div>

            {isCalendarView ? (
              <CalendarView events={calendarEvents} polls={calendarPolls} userId={user.id} />
            ) : (
              <>
                {isAanvoerder && <CreateEventForm userId={user.id} />}
                
                {/* 1. LOAD EARLIER BUTTON */}
                <div className="flex justify-center mb-4">
                   <Link 
                     href={`/?past=${pastLimit + 10}${futureLimit !== 15 ? `&future=${futureLimit}` : ''}`} 
                     scroll={false}
                     prefetch={false}
                     className="text-xs font-semibold text-gray-500 bg-gray-200 px-4 py-2 rounded-full hover:bg-gray-300 transition"
                   >
                     {pastLimit === 0 ? 'Load earlier events' : 'Load 10 more previous events'}
                   </Link>
                </div>

                {/* 2. PAST EVENTS (Slightly faded) */}
                {pastEvents.map((event: any) => (
                   <EventCard key={event.id} event={event} opacity={0.6} />
                ))}

                {/* Divider if we have past events */}
                {pastEvents.length > 0 && <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest my-4">Today</div>}

                {/* 3. FUTURE EVENTS */}
                {futureEvents.length === 0 && <div className="text-center text-gray-400 py-10">No upcoming events.</div>}
                {futureEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}

                {/* 4. LOAD MORE FUTURE EVENTS BUTTON (Only if there could be more) */}
                {futureEvents.length >= futureLimit && (
                  <div className="flex justify-center pt-2 pb-4">
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

      <BottomNav notificationCount={unansweredPollsCount} />
    </main>
  )
}