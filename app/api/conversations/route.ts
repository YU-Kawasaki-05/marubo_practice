/** @file
 * GET /api/conversations — 会話一覧
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import type { Database } from '@shared/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    // DEBUG: 認証情報の受け取り確認（必要がなくなったら削除してください）
    console.log('authorization head:', authHeader?.slice(0, 20))
    console.log('cookie:', req.headers.get('cookie'))

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // 認証確認
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1] ?? '', 'base64').toString('utf8'),
      )
      console.log(
        'jwt iss/aud/exp:',
        payload?.iss,
        payload?.aud,
        payload?.exp,
        'expires in:',
        payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : null,
      )
    } catch (e) {
      console.log('jwt decode failed')
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    console.log('getUser error:', userError, 'user:', userData?.user?.id)

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
    console.log('rows length:', data?.length ?? 0, 'query error:', error)
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
