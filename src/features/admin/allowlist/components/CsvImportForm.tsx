'use client'

import { useState, ChangeEvent } from 'react'

export function CsvImportForm() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    setFile(selected || null)
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

      {/* ここにプレビューと送信ボタンが入ります (Step 2, 3) */}
      <div className="mt-6">
        <button
          type="button"
          disabled={!file}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          プレビュー表示 (実装中)
        </button>
      </div>
    </section>
  )
}
