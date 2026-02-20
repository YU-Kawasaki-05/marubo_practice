/** @file
 * GET /api/conversations/[id] — 会話詳細 + メッセージ一覧
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import type { Database } from '@shared/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = req.headers.get('Authorization')
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

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id

    // 会話ヘッダ取得（ユーザー一致を確認）
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('id', conversationId)
      .eq('user_id', userData.user.id)
      .single()

    if (convError) {
      console.error('Fetch conversation error:', convError)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // メッセージ一覧取得（昇順）
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })

    if (msgError) {
      console.error('Fetch messages error:', msgError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        messages: messages?.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at,
        })) ?? [],
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
