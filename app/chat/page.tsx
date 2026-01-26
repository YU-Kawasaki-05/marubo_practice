import Link from 'next/link'

import { AllowlistGuard } from '../../src/features/allowlist/components/AllowlistGuard'
import { ChatInterface } from '../../src/features/chat/components/ChatInterface'

export const metadata = {
  title: 'AIチャット - Marubo AI',
}

export default function ChatPage() {
  return (
    <AllowlistGuard redirectToHome={false}>
      {/* 
        モバイルブラウザのアドレスバーによるレイアウト崩れを防ぐため 
        h-[100dvh] (Dynamic Viewport Height) を使用
      */}
      <div className="flex flex-col h-[100dvh] bg-gray-50">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-800">Marubo AI</h1>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Beta
            </span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ✕ 閉じる
          </Link>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <ChatInterface />
        </main>
      </div>
    </AllowlistGuard>
  )
}
