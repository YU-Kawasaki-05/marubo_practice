import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

/**
 * AIの応答を表示するためのMarkdownコンポーネント
 * 
 * - React.memo化: ストリーミング中に過去のメッセージが再レンダリングされるのを防ぐ
 * - plugins: 数式(KaTeX), GFM(テーブル等)をサポート
 */
export const MemoizedMarkdown = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        className="prose prose-sm max-w-none break-words dark:prose-invert"
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // パラグラフの余白調整
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          // その他のカスタマイズが必要ならここに追加
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => {
    // コンテンツが完全に一致する場合のみ再レンダリングをスキップ
    return prevProps.content === nextProps.content
  }
)

MemoizedMarkdown.displayName = 'MemoizedMarkdown'
