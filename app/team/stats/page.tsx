import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() } } })

  const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('status', 'active')
  const { data: attendance } = await supabase.from('attendance').select('user_id, status, events(event_type)')

  const stats = profiles?.map(p => {
    const userAttendance = attendance?.filter(a => a.user_id === p.id && a.events) || []
    const total = userAttendance.length
    const present = userAttendance.filter(a => a.status === 'in').length
    const rate = total === 0 ? 0 : Math.round((present / total) * 100)
    return { ...p, rate, total, present }
  }).sort((a, b) => b.rate - a.rate) || []

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/?tab=team" className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition">←</Link>
        <h1 className="font-bold text-lg text-gray-900">📊 Attendance Leaderboard</h1>
      </div>
      <div className="max-w-md mx-auto p-4 mt-2">
        <div className="space-y-3">
          {stats.map((s, idx) => (
             <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
               <div className="flex items-center gap-4">
                 <span className={`font-black w-6 text-center ${idx === 0 ? 'text-yellow-500 text-xl' : idx === 1 ? 'text-gray-400 text-lg' : idx === 2 ? 'text-amber-700 text-lg' : 'text-gray-300'}`}>
                   {idx + 1}
                 </span>
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 uppercase border border-blue-100">
                     {s.full_name?.charAt(0)}
                   </div>
                   <Link href={`/team/player/${s.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition">
                     {s.full_name}
                   </Link>
                 </div>
               </div>
               <div className="text-right">
                 <p className={`font-bold text-xl ${s.rate >= 80 ? 'text-green-600' : s.rate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                   {s.rate}%
                 </p>
                 <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">{s.present} / {s.total} joined</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </main>
  )
}
