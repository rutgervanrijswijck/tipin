'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function deleteEntity(table: 'events' | 'polls', id: string) {
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

  // Verify caller has captain role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'captain') {
    return { success: false, error: 'Only captains can delete events or polls.' }
  }

  // Select client to use (adminClient if service key present, else user client)
  let dbClient: any = supabase
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      dbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    } catch {}
  }

  try {
    if (table === 'events') {
      // 1. Clean up boetes referencing this event
      // First try deleting; if that fails or is restricted, set event_id to null
      const { error: boeteDelError } = await dbClient
        .from('boetes')
        .delete()
        .eq('event_id', id)

      if (boeteDelError) {
        // Fallback: unlink boetes so foreign key constraint is satisfied
        await dbClient
          .from('boetes')
          .update({ event_id: null })
          .eq('event_id', id)
      }

      // 2. Clean up carpools and passengers for this event
      const { data: carpools } = await dbClient
        .from('carpools')
        .select('id')
        .eq('event_id', id)

      if (carpools && carpools.length > 0) {
        const carpoolIds = carpools.map((c: any) => c.id)
        await dbClient
          .from('carpool_passengers')
          .delete()
          .in('carpool_id', carpoolIds)

        await dbClient
          .from('carpools')
          .delete()
          .eq('event_id', id)
      }

      // 3. Clean up attendance records for this event
      await dbClient
        .from('attendance')
        .delete()
        .eq('event_id', id)

      // 4. Delete the event itself
      const { error: eventError } = await dbClient
        .from('events')
        .delete()
        .eq('id', id)

      if (eventError) {
        return { success: false, error: eventError.message }
      }

      revalidatePath('/')
      revalidatePath('/?tab=schedule')
      revalidatePath(`/events/${id}`)
      return { success: true }
    } else if (table === 'polls') {
      // 1. Clean up poll votes
      await dbClient
        .from('poll_votes')
        .delete()
        .eq('poll_id', id)

      // 2. Delete the poll
      const { error: pollError } = await dbClient
        .from('polls')
        .delete()
        .eq('id', id)

      if (pollError) {
        return { success: false, error: pollError.message }
      }

      revalidatePath('/')
      revalidatePath('/?tab=polls')
      revalidatePath(`/polls/${id}`)
      return { success: true }
    }

    return { success: false, error: 'Unknown table type' }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred while deleting' }
  }
}
