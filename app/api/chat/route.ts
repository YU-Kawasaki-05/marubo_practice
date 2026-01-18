/** @file
 * `/api/chat` Route Handler
 * 機能：チャットメッセージを受信し、AIからの応答をストリーミングで返す。
 * 入力：JSON { messages: CoreMessage[] }
 * 出力：Streaming Text Response
 * 依存：Vercel AI SDK, OpenAI, Supabase Auth
 * セキュリティ：ログイン済みユーザーのみ実行可能。
 */

import { openai } from '@ai-sdk/openai'
import { streamText, type CoreMessage } from 'ai'
import { createClient } from '@supabase/supabase-js'

// Next.jsのEdge Runtimeではなく、互換性重視でNode.js Runtimeを使用
export const runtime = 'nodejs'

// 環境変数からSupabase接続情報を作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: Request) {
  try {
    // 1. 認証チェック: ログインしているユーザーか確認する
    // クライアントから送られてきた認証トークンを取り出す
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized: No Authorization header', { status: 401 })
    }

    // Supabaseを使ってトークンが本物か検証する
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (error || !user) {
      return new Response('Unauthorized: Invalid token', { status: 401 })
    }

    // 2. ユーザーからのメッセージデータを受け取る
    // Vercel AI SDKが扱いやすい形式 { messages: [] } で送られてくる想定
    const { messages }: { messages: CoreMessage[] } = await req.json()

    // 3. AI（OpenAI）に応答を生成させる
    // streamText関数を使うと、AIの回答を少しずつ（ストリーミング）返せる
    const result = await streamText({
      model: openai('gpt-4o-mini'), // コストが安くて高速なモデルを指定
      system: 'あなたは親切で分かりやすい塾の先生です。中高生の学習をサポートしてください。数式はLaTeX形式($...$)で書いてください。', // AIへの「役割」指示
      messages,
      // 必要があればここに temperature (創造性) などを設定可能
    })

    // 4. ストリーミング形式でレスポンスを返す
    // これにより、フロントエンド側で文字が「カタカタ」と表示される演出ができる
    return result.toDataStreamResponse()
    
  } catch (err) {
    console.error('Chat API Error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
