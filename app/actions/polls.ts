'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updatePollServer(
  id: string,
  updates: {
    question: string
    options: string[]
    max_choices?: number
    relevant_date?: string | null
    answer_by?: string | null
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
    return { success: false, error: 'Only captains can edit polls.' }
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
    .from('polls')
    .update({
      question: updates.question,
      options: updates.options,
      max_choices: updates.max_choices || 1,
      relevant_date: updates.relevant_date || null,
      answer_by: updates.answer_by || null,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/?tab=polls')
  revalidatePath(`/polls/${id}`)
  return { success: true }
}
