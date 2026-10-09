'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function togglePollVoteServer(pollId: string, optionIndex: number) {
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

  // 1. If service role key is available, execute with full admin bypass
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

      const { data: existingVotes } = await adminClient
        .from('poll_votes')
        .select('id, option_index')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)

      const existingVote = existingVotes?.find((v: any) => v.option_index === optionIndex)

      if (existingVote) {
        // UNVOTE: Remove vote
        await adminClient.from('poll_votes').delete().eq('id', existingVote.id)
        revalidatePath('/?tab=polls')
        revalidatePath(`/polls/${pollId}`)
        revalidatePath('/')
        return { success: true, action: 'unvoted' }
      } else {
        // VOTE: Add vote
        const { data: poll } = await adminClient
          .from('polls')
          .select('max_choices')
          .eq('id', pollId)
          .single()
        const maxChoices = poll?.max_choices || 1

        if (maxChoices === 1 && existingVotes && existingVotes.length > 0) {
          await adminClient.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', user.id)
        }
        await adminClient.from('poll_votes').insert({
          poll_id: pollId,
          user_id: user.id,
          option_index: optionIndex,
        })
        revalidatePath('/?tab=polls')
        revalidatePath(`/polls/${pollId}`)
        revalidatePath('/')
        return { success: true, action: 'voted' }
      }
    } catch {}
  }

  // 2. Try stored procedure toggle_poll_vote (SECURITY DEFINER)
  const { data: rpcData, error: rpcError } = await supabase.rpc('toggle_poll_vote', {
    p_poll_id: pollId,
    p_option_index: optionIndex,
  })

  if (!rpcError) {
    revalidatePath('/?tab=polls')
    revalidatePath(`/polls/${pollId}`)
    revalidatePath('/')
    return { success: true, action: rpcData?.action || 'toggled' }
  }

  // 3. Fallback: Direct database query via user session
  const { data: existingVotes } = await supabase
    .from('poll_votes')
    .select('id, option_index')
    .eq('poll_id', pollId)
    .eq('user_id', user.id)

  const existingVote = existingVotes?.find((v: any) => v.option_index === optionIndex)

  if (existingVote) {
    // UNVOTE
    const { data: deleted, error: deleteError } = await supabase
      .from('poll_votes')
      .delete()
      .eq('id', existingVote.id)
      .select()

    if (!deleteError && deleted && deleted.length > 0) {
      revalidatePath('/?tab=polls')
      revalidatePath(`/polls/${pollId}`)
      revalidatePath('/')
      return { success: true, action: 'unvoted' }
    }

    return {
      success: false,
      error:
        deleteError?.message ||
        'Unvoting was blocked by database permissions. Please apply the SQL in supabase_update_v3.sql in the Supabase SQL editor.',
    }
  } else {
    // VOTE
    const { data: poll } = await supabase
      .from('polls')
      .select('max_choices')
      .eq('id', pollId)
      .single()
    const maxChoices = poll?.max_choices || 1

    if (maxChoices === 1 && existingVotes && existingVotes.length > 0) {
      await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', user.id)
    }

    const { error: insertError } = await supabase.from('poll_votes').insert({
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    })

    if (!insertError) {
      revalidatePath('/?tab=polls')
      revalidatePath(`/polls/${pollId}`)
      revalidatePath('/')
      return { success: true, action: 'voted' }
    }

    return { success: false, error: insertError.message }
  }
}
