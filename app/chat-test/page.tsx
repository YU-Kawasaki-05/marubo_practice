/** @file
 * チャット機能動作確認用の一時ページ
 * 目的: ChatInterface コンポーネントの単体動作確認
 * 環境: ログイン済みであることを前提とする（未ログインだと ChatInterface 内で alert が出る）
 */

import { ChatInterface } from '@features/chat/components/ChatInterface'

export default function ChatTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Chat Interface Verification</h1>
      <p className="text-center text-gray-600 mb-8">
        Vercel AI SDK + OpenAI API 接続テスト<br/>
        (※ .env.local に OPENAI_API_KEY が設定されていること)
      </p>
      
      <ChatInterface />
    </div>
  )
}
