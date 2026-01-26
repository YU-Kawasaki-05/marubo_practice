/** @file
 * チャット機能のメインUIコンポーネント (Basic Implementation)
 * 機能：メッセージの表示、入力、送信、AI応答のストリーミング表示
 * 依存：Vercel AI SDK (useChat), Supabase Client
 */

'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useState } from 'react'
import { MessageBubble } from './MessageBubble'

import { getSupabaseBrowserClient } from '@shared/lib/supabaseClient'

/**
 * 内部コンポーネント: トークンが確定してからマウントされる
 * useChat はここで初めて初期化されるため、確実に token が headers に入る
 */
function ChatInterfaceInner({ token }: { token: string }) {
  // デバッグ: トークンが正しく渡されているか確認
  useEffect(() => {
    console.log('ChatInterfaceInner: Token available:', !!token, token?.slice(0, 10))
  }, [token])

  // Vercel AI SDK の useChat (v6系) は input 管理を提供しないため、自前で管理する
  const [input, setInput] = useState('')
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    // プロトコルをData Stream (デフォルト) に戻す
    headers: { 'Authorization': `Bearer ${token}` },
    onError: (error) => {
      console.error('Chat API Error:', error)
      alert('エラーが発生しました: ' + error.message)
    },
  })

  // DEBUG: messages ステートの変化を詳細にログ出力 (必要に応じてコメント解除)
  /*
  useEffect(() => {
    console.log('ChatInterfaceInner: Messages Updated. Count:', messages.length);
    console.log('Full messages array:', messages);
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log('Last Message Detail:', {
        id: lastMsg.id,
        role: lastMsg.role,
        content: lastMsg.content,
        // @ts-ignore
        parts: lastMsg.parts,
      });
    }
  }, [messages]);
  */

  // status から isLoading を判定 ('submitted' または 'streaming' の間はロード中)
  const isLoading = status === 'submitted' || status === 'streaming'

  // 入力ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // メッセージ送信時のハンドラ
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input
    setInput('') // 入力欄をクリア
    
    try {
      // sendMessage を使ってメッセージを追加・送信
      await sendMessage({
        role: 'user',
        content: userMessage,
      }, {
        // 明示的にヘッダーを渡す (useChatのheadersが効かない場合の保険)
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (e) {
      console.error(e)
      // エラー時は入力を戻すなどの処理が必要だが、今回は簡易実装
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-sm max-w-2xl mx-auto my-8">
      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>こんにちは！何か質問はありますか？</p>
            <p className="text-sm">例: 「二次方程式の解の公式を教えて」</p>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-gray-500 animate-pulse">
              AIが考え中...
            </div>
          </div>
        )}
      </div>

      {/* 入力フォームエリア */}
      <div className="border-t p-4 bg-gray-50">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
            disabled={isLoading || !input?.trim()}
          >
            送信
          </button>
        </form>
      </div>
    </div>
  )
}

/**
 * メインコンポーネント: 認証状態を管理するためのラッパー
 */
export function ChatInterface() {
  const [token, setToken] = useState<string | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  // マウント時にセッショントークンを取得
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setToken(session.access_token)
        }
      } catch (e) {
        console.error('Auth Check Error:', e)
      } finally {
        setIsAuthChecking(false)
      }
    }
    fetchSession()
  }, [])

  // まだ認証情報の取得が終わっていない場合
  if (isAuthChecking) {
    return <div className="p-4 text-center">読み込み中... (ログイン状態を確認しています)</div>
  }

  // ログインしていない場合（トークンがない場合）
  if (!token) {
    return <div className="p-4 text-center text-red-500 font-bold">チャットを利用するにはログインが必要です。</div>
  }

  // トークンがある場合のみ Inner コンポーネントをマウント
  return <ChatInterfaceInner token={token} />
}
