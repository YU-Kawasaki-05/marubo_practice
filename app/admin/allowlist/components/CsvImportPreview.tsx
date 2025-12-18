import { useState } from 'react'

import { useAllowlistMutations } from '../../../../src/features/admin/allowlist/hooks/useAllowlistMutations'

type Props = {
  onImport?: () => void
}

export function CsvImportPreview({ onImport }: Props) {
  const [csv, setCsv] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'insert' | 'upsert'>('insert')
  const [loading, setLoading] = useState(false)

  const { importCsv } = useAllowlistMutations()

  const handleImport = async () => {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await importCsv(csv, mode)
      setResult(`取り込み成功: inserted=${res.inserted}, updated=${res.updated}`)
      onImport?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">CSV 取り込み</h2>
        <p className="text-sm text-slate-600">CSV を貼り付けてプレビュー・取り込みをテストできます。</p>
      </div>
      <div className="space-y-3 px-4 py-4">
        <textarea
          className="h-32 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder={'email,status,label\nuser1@example.com,active,ClassA'}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>モード:</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'insert' | 'upsert')}
            >
              <option value="insert">insert（新規のみ）</option>
              <option value="upsert">upsert（既存は上書き）</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '取り込み中…' : '取り込みを実行'}
          </button>
        </div>
        {result && <p className="text-sm text-green-700">{result}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </section>
  )
}
