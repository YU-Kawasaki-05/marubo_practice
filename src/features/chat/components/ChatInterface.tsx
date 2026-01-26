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
    // api: '/api/chat', // デフォルトが '/api/chat' なので省略可 (型エラー回避)
    // プロトコルをData Stream (デフォルト) に戻す
    // headers: { 'Authorization': `Bearer ${token}` }, // useChat初期化オプションにはheadersがないため削除
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
      // v6.0.33 の型定義に従い { role, content } ではなく { text } を渡す (または CreateUIMessage)
      // headers はここで渡す必要がある
      await sendMessage({
        text: userMessage,
      }, {
        // 明示的にヘッダーを渡す
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
    <div className="flex flex-col h-full bg-white max-w-4xl mx-auto">
      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-xl font-bold mb-2">こんにちは！</h2>
            <p>学習に関する質問を自由にしてください。</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-sm text-left">
              <button 
                onClick={() => { setInput('二次方程式の解の公式を教えて'); }}
                className="p-3 border rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                「二次方程式の解の公式を教えて」
              </button>
              <button 
                 onClick={() => { setInput('英単語の効率的な覚え方は？'); }}
                 className="p-3 border rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                「英単語の効率的な覚え方は？」
              </button>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-gray-500 animate-pulse text-sm">
              AIが考え中...
            </div>
          </div>
        )}
      </div>

      {/* 入力フォームエリア */}
      <div className="border-t p-4 bg-white sticky bottom-0 z-10">
        <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm"
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

  // マウント時にセッシュントークンを取得し、変更を監視する
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    
    // 初期化: 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token)
      }
      setIsAuthChecking(false)
    })

    // 監視: 認証状態（トークンリフレッシュ等）の変化をリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token)
      } else {
        setToken(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
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
