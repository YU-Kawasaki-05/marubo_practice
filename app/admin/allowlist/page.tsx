import Link from 'next/link'

import { useAllowlistQuery } from '../../../src/features/admin/allowlist/hooks/useAllowlistQuery'

export const runtime = 'nodejs'

export default function AllowlistPage() {
  const { data, loading, error } = useAllowlistQuery()

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">許可メール一覧</h1>
        <p className="mt-4 text-slate-600">読み込み中…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">許可メール一覧</h1>
        <p className="mt-4 text-red-600">エラー: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Allowlist</p>
          <h1 className="text-2xl font-bold text-slate-900">許可メール一覧</h1>
          <p className="text-sm text-slate-600">スタッフ専用の許可メール管理です。</p>
        </div>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          戻る
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">登録件数</p>
            <p className="text-2xl font-bold text-slate-900">{data?.length ?? 0}</p>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {data?.map((item) => (
            <div key={item.email} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{item.email}</p>
                <p className="text-xs text-slate-600">label: {item.label ?? '-'}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  item.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : item.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="px-4 py-6 text-sm text-slate-600">まだ登録がありません。</div>
          )}
        </div>
      </section>
    </main>
  )
}
