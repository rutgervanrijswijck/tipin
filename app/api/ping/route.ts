import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lightweight Supabase client initialization for health checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function verifyAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // No secret configured; allow ping

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('key') === cronSecret) return true

  return false
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = performance.now()

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Touch database: fetch 1 id from profiles to keep connection pool & compute warm
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    const latencyMs = Math.round(performance.now() - startTime)

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          db: 'error',
          message: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        app: 'TipIn',
        db: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime)
    return NextResponse.json(
      {
        status: 'error',
        message: err?.message || 'Internal server error',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  }
}

export async function HEAD(request: Request) {
  return GET(request)
}
