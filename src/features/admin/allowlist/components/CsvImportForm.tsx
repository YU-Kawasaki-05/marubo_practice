'use client'

import { useState, ChangeEvent } from 'react'
import type { AllowedEmailStatus } from '../../../../../shared/types/database'

type ParseResult = {
  header: string[]
  rows: string[][]
  error?: string
}

export function CsvImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParseResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    setFile(selected || null)
    setPreview(null) // ファイルが変わったらプレビューをリセット
  }

  const handlePreview = async () => {
    if (!file) return

    setIsParsing(true)
    try {
      // 文字コード自動判定: まず UTF-8 でデコードを試み、失敗したら Shift_JIS (Excel標準) で再試行する
      const buffer = await file.arrayBuffer()
      let text = ''
      
      try {
        // fatal: true にすると、不正なバイト列（Shift_JISなど）が含まれる場合にエラーになる
        const decoder = new TextDecoder('utf-8', { fatal: true })
        text = decoder.decode(buffer)
      } catch (e) {
        // UTF-8 ではない場合、Shift_JIS として読み込む
        const decoder = new TextDecoder('shift_jis')
        text = decoder.decode(buffer)
      }

      const result = parseCsvClient(text)
      setPreview(result)
    } catch (err: any) {
      alert(`CSV読み込みに失敗しました: ${err.message}`)
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">CSV 一括登録</h2>
      <p className="mt-1 text-sm text-slate-600">
        CSVファイルをアップロードして、許可メールを一括で登録・更新できます。
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">
          CSVファイルを選択
        </label>
        <div className="mt-2 text-sm text-slate-500">
          <p className="mb-2">
            ※ ヘッダー行 (email, status, label...) が必要です。
            <a href="/manual/csv_import" target="_blank" className="ml-2 text-indigo-600 underline">
              マニュアルを見る
            </a>
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>
      
      {file && (
        <div className="mt-4 rounded bg-slate-50 p-4 text-sm text-slate-600">
          選択中: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
        </div>
      )}

      {/* プレビューボタン */}
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          disabled={!file || isParsing}
          onClick={handlePreview}
          className="rounded bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
        >
          {isParsing ? '解析中...' : 'プレビュー'}
        </button>
      </div>

      {/* プレビュー表示エリア */}
      {preview && (
        <div className="mt-6">
          {preview.error ? (
            <p className="text-red-600 font-bold">{preview.error}</p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {preview.header.map((h, i) => (
                      <th key={i} className="px-4 py-2 text-left font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-slate-600">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 5 && (
                <p className="bg-slate-50 px-4 py-2 text-xs text-slate-500 text-center">
                  ...他 {preview.rows.length - 5} 件
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * 簡易的なCSVパーサー (クライアントサイド用)
 * ※ 本格的なパースはサーバー側(API)で行うため、ここはあくまでプレビュー用の簡易実装です。
 */
function parseCsvClient(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
  if (lines.length < 2) {
    return { header: [], rows: [], error: 'データ行が見つかりません (ヘッダーのみ、または空です)' }
  }

  // 1行目をヘッダーとみなす
  const header = lines[0].split(',').map(c => c.trim())
  
  // 2行目以降をデータとみなす
  const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()))

  if (!header.includes('email')) {
    return { header, rows, error: '必須列 "email" が見つかりません' }
  }

  return { header, rows }
}
