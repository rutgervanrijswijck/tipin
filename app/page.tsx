import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttendanceToggle from '@/components/AttendanceToggle'
import CreateEventForm from '@/components/CreateEventForm'
import CreatePollForm from '@/components/CreatePollForm'
import PollCard from '@/components/PollCard'
import BottomNav from '@/components/BottomNav'

// Add 'past' to the searchParams type
export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string, past?: string }> }) {
  const { tab, past } = await searchParams
  const activeTab = tab === 'polls' ? 'polls' : tab === 'team' ? 'team' : 'schedule'
  
  // Parse how many past items to show (default 0)
  const pastLimit = parseInt(past || '0', 10)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isAanvoerder = profile?.role === 'coach'

  // --- FETCH LOGIC ---
  let futureEvents: any[] = []
  let pastEvents: any[] = []
  // We initialize polls, but we will fetch them regardless of the tab now
  
  const todayStr = new Date().toISOString()

  // 1. ALWAYS Fetch Polls (Required for the Notification Bubble)
  const { data: pollsData } = await supabase
      .from('polls')
      .select('*, poll_votes(user_id, option_index)')
      .order('created_at', { ascending: false })
  
  const polls = pollsData || []

  // 2. Fetch Events (Only needed for Schedule tab)
  if (activeTab === 'schedule') {
    // Fetch Future Events
    const { data: futures } = await supabase
      .from('events')
      .select('*, attendance(user_id, status, reason)') 
      .gte('start_time', todayStr)
      .order('start_time', { ascending: true })
    futureEvents = futures || []

    // Fetch Past Events (Only if requested via 'Load Earlier')
    const pastLimit = parseInt(past || '0', 10)
    if (pastLimit > 0) {
      const { data: pasts } = await supabase
        .from('events')
        .select('*, attendance(user_id, status, reason)') 
        .lt('start_time', todayStr)
        .order('start_time', { ascending: false })
        .limit(pastLimit)
      
      pastEvents = (pasts || []).reverse()
    }
  }

  // Calculate the notification count (This now works on ALL tabs)
  const unansweredPollsCount = polls.filter(poll => {
    const hasVoted = poll.poll_votes.some((v: any) => v.user_id === user.id)
    return !hasVoted
  }).length

  const getCounts = (attendance: any[]) => ({
    in: attendance.filter(a => a.status === 'in').length,
    out: attendance.filter(a => a.status === 'out').length,
    maybe: attendance.filter(a => a.status === 'maybe').length,
  })

  // Reusable Event Card Component to keep code clean
  const EventCard = ({ event, opacity = 1 }: { event: any, opacity?: number }) => {
    const counts = getCounts(event.attendance || [])
    const myStatus = event.attendance.find((a: any) => a.user_id === user.id)?.status
    
    return (
      <Link href={`/events/${event.id}`} className="block group">
        <div className={`bg-white p-3 rounded-r-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group-hover:border-blue-200 transition-all duration-300 relative overflow-hidden pl-7`} style={{ opacity }}>
          
          <div className={`absolute left-0 top-0 bottom-0 w-2.5 
            ${event.event_type === 'game' ? 'bg-orange-500' : event.event_type === 'training' ? 'bg-blue-500' : 'bg-green-500'}`} 
          />

          <div className="mb-4 flex justify-between items-start gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'long' })}
              </p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                <span className="mr-2">
                  {event.event_type === 'game' ? '⚔️' : event.event_type === 'training' ? '🏋️' : '🍻'}
                </span>
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
            <p className="text-gray-500 font-medium text-sm">
              {profile?.full_name?.split(' ')[0]}
            </p>
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
            {isAanvoerder && <CreateEventForm userId={user.id} />}
            
            {/* 1. LOAD EARLIER BUTTON */}
            <div className="flex justify-center mb-4">
               <Link 
                 href={`/?past=${pastLimit + 10}`} 
                 scroll={false} // Prevents jumping to top of page
                 className="text-xs font-semibold text-gray-500 bg-gray-200 px-4 py-2 rounded-full hover:bg-gray-300 transition"
               >
                 {pastLimit === 0 ? 'Load earlier events' : 'Load 10 more previous events'}
               </Link>
            </div>

            {/* 2. PAST EVENTS (Slightly faded) */}
            {pastEvents.map((event) => (
               <EventCard key={event.id} event={event} opacity={0.6} />
            ))}

            {/* Divider if we have past events */}
            {pastEvents.length > 0 && <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest my-4">Today</div>}

            {/* 3. FUTURE EVENTS */}
            {futureEvents.length === 0 && <div className="text-center text-gray-400 py-10">No upcoming events.</div>}
            {futureEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* POLLS TAB */}
        {activeTab === 'polls' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAanvoerder && <CreatePollForm />}

            {polls.map(poll => {
              const myVote = poll.poll_votes.find((v: any) => v.user_id === user.id)
              return (
                <PollCard 
                  key={poll.id} 
                  poll={poll} 
                  userId={user.id} 
                  myVoteIndex={myVote ? myVote.option_index : null}
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
            <div className="flex flex-col items-center justify-center pt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 rounded-full shadow-sm mb-6">
                  <span className="text-4xl">🚧</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Team Hub</h2>
              <p className="text-gray-500 text-center max-w-xs">
                We are building a space for team stats, contact info, and role management.
              </p>
              <span className="mt-8 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          )}

      </div>

      <BottomNav notificationCount={unansweredPollsCount} />
    </main>
  )
}