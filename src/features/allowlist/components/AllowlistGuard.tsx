'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { useMyAllowlistStatus } from '../../allowlist/hooks/useMyAllowlistStatus'

interface AllowlistGuardProps {
  children: ReactNode
  /**
   * 権限がない場合にトップページへリダイレクトするかどうか
   * fallback UIを表示せずに強制移動したい場合に true にする
   * @default false
   */
  redirectToHome?: boolean
}

/**
 * 許可されたユーザーのみコンテンツを表示するガードコンポーネント
 *
 * @description
 * ユーザーの Allowlist ステータスを確認し、'allowed' の場合のみ children をレンダリングします。
 * それ以外 (未ログイン、pending, revoked, not_found) の場合は適切なメッセージを表示するか、
 * トップページへリダイレクトします。
 */
export function AllowlistGuard({
  children,
  redirectToHome = false,
}: AllowlistGuardProps) {
  const router = useRouter()
  const { status, loading } = useMyAllowlistStatus()
  const isLoading = loading

  // リダイレクトモード時の処理
  useEffect(() => {
    // status が 'active' であれば許可 (API/Type定義に合わせ 'active' = 'allowed')
    if (redirectToHome && !isLoading && status !== 'active') {
      router.push('/')
    }
  }, [isLoading, status, redirectToHome, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-500">
          権限を確認しています...
        </p>
      </div>
    )
  }

  // 許可されていない場合
  // ChatFeatureでは 'active' のみを許可とする
  if (status !== 'active') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="mx-auto w-12 text-center text-4xl mb-4">
          {status === 'pending' ? '⏳' : '🚫'}
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {status === 'pending'
            ? '利用申請中です'
            : '利用権限がありません'}
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {status === 'pending'
            ? '管理者が確認するまでしばらくお待ちください。承認されるとメールで通知されます。'
            : 'このアカウントはチャット機能の利用が許可されていません。管理者に問い合わせてください。'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
        >
          ホームへ戻る
        </button>
      </div>
    )
  }

  // 権限あり
  return <>{children}</>
}
