'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateEventServer(
  id: string,
  updates: {
    title: string
    event_type: string
    location?: string | null
    start_time: string
    answer_by?: string | null
    reason_required_out?: boolean
    reason_required_maybe?: boolean
  }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify caller is a captain
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'captain') {
    return { success: false, error: 'Only captains can edit events.' }
  }

  let dbClient: any = supabase
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      dbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    } catch {}
  }

  const { error } = await dbClient
    .from('events')
    .update({
      title: updates.title,
      event_type: updates.event_type,
      location: updates.location || null,
      start_time: updates.start_time,
      answer_by: updates.answer_by || null,
      reason_required_out: Boolean(updates.reason_required_out),
      reason_required_maybe: Boolean(updates.reason_required_maybe),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/?tab=schedule')
  revalidatePath(`/events/${id}`)
  return { success: true }
}
