/** @file
 * GET /api/conversations — 会話一覧
 */

import { NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@shared/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    const token = authHeader.replace('Bearer ', '')

    // 認証確認
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const cursor = url.searchParams.get('cursor')

    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 50)

    let query = supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)

    if (cursor) {
      // cursor format: `${created_at}_${id}`
      const [createdAt, id] = cursor.split('_')
      if (createdAt && id) {
        query = query.or(`and(created_at.eq.${createdAt},id.lt.${id}),created_at.lt.${createdAt}`)
      }
    }

    const { data, error } = await query
    if (error) {
      console.error('Fetch conversations error:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    let nextCursor: string | null = null
    if (data && data.length === limit) {
      const last = data[data.length - 1]
      nextCursor = `${last.created_at}_${last.id}`
    }

    return NextResponse.json({ data, nextCursor })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
