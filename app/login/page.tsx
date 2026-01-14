'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { getSupabaseBrowserClient } from '../../src/shared/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        throw error
      }
      // ログイン成功したら管理画面へ
      router.push('/admin/allowlist')
      // router.refresh() // 必要に応じてキャッシュ更新
    } catch (err) {
      const error = err as Error
      if (error.message.includes('Invalid login credentials')) {
        setMessage('メールアドレスまたはパスワードが間違っています。')
      } else {
        setMessage(`ログインエラー: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    setMessage(null)
    const cleanEmail = email.trim()
    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      })
      if (error) {
        throw error
      }
      setMessage('登録確認メールを送信しました。（開発環境等でオートコンファームの場合はそのままログインボタンを押してください）')
    } catch (err) {
      console.error(err)
      const error = err as Error
      if (error.message.includes('invalid')) {
        setMessage(`エラー: メールアドレスの形式が無効か、許可されていないドメインです。別のメールアドレス（例: student1@example.com や Gmailなど）を試してください。\n詳細: ${error.message}`)
      } else if (error.message.includes('User already registered')) {
        setMessage('このメールアドレスは既に登録されています。ログインしてください。')
      } else {
        setMessage(`エラーが発生しました: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">ログイン</h1>
        
        {message && (
          <div className="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-700 break-words whitespace-pre-wrap">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="例: student1@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? '処理中...' : 'ログイン'}
            </button>
          </div>
        </form>

        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500 mb-2">アカウントをお持ちでない場合</p>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={isLoading || !email || !password}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            新規登録 (Sign Up)
          </button>
        </div>
      </div>
    </main>
  )
}
