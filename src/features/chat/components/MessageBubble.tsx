import { type UIMessage } from 'ai'

import { normalizeMathDelimiters } from '../utils/normalizeMath'

import { MemoizedMarkdown } from './MemoizedMarkdown'

interface MessageBubbleProps {
  message: UIMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const legacyContentMessage = message as UIMessage & { content?: string }

  // AI SDK v6 Data Stream Protocol対応:
  // message.content が空でも message.parts にテキストが含まれている場合はそれを結合して表示する
  const rawContent =
    (typeof legacyContentMessage.content === 'string' ? legacyContentMessage.content : '') ||
    message.parts
      .flatMap((part) => (part.type === 'text' ? [part.text] : []))
      .join('') ||
    ''

  // 数式デリミタの正規化（\[...\] -> $$...$$, \(...\) -> $...$）
  // ユーザーの入力はそのまま表示したいので、AIの応答のみ正規化する（あるいは両方しても良いが、一旦は安全側に倒す）
  // ただし、ユーザーも数式を入力する場合があるため、統一的に正規化しても良い。
  // ここでは要件に従い「AI応答の数式が表示されない」問題を解決するため、単純に content 全体に適用する。
  const textContent = normalizeMathDelimiters(rawContent)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border text-gray-800 shadow-sm'
        }`}
      >
        {isUser ? (
          // ユーザーのメッセージはそのままプレーンテキストで表示
          <div className="whitespace-pre-wrap">{textContent}</div>
        ) : (
          // AIのメッセージはMarkdownとしてレンダリング
          <MemoizedMarkdown content={textContent} />
        )}

        {/* contentが空で、かつpartsがある場合のフォールバック（Tool calls等） */}
        {/* テキストがない場合のみ表示 */}
        {!textContent && message.parts && message.parts.length > 0 && (
          <div className="text-xs text-gray-500 mt-1 italic">
            (構造化データを受信中...)
            {/* 必要に応じてここにPartのレンダリングを追加 */}
          </div>
        )}
      </div>
    </div>
  )
}
