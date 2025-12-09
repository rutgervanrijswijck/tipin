import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()

  // 1. Connect to Supabase on the server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
            // Note: writing cookies in Server Components requires Server Actions or Middleware
            // This is just for reading data for now
        }
      }
    }
  )

  // 2. Fetch events
  const { data: events } = await supabase.from('events').select('*')

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏑 Team Schedule</h1>
      {events?.map((event) => (
        <div key={event.id} className="border p-4 mb-4 rounded bg-gray-50">
          <h2 className="font-bold">{event.title}</h2>
          <p className="text-sm text-gray-600">
            {new Date(event.start_time).toLocaleDateString()} @ {event.location}
          </p>
          <div className="mt-2 text-sm bg-blue-100 inline-block px-2 py-1 rounded">
             {event.event_type}
          </div>
        </div>
      ))}
      {(!events || events.length === 0) && <p>No events found.</p>}
    </main>
  )
}