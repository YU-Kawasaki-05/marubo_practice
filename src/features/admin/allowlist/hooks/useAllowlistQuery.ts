import { useEffect, useMemo, useState } from 'react'

type AllowedEmailStatus = 'active' | 'pending' | 'revoked'

export type AllowedEmail = {
  email: string
  status: AllowedEmailStatus
  label: string | null
  notes: string | null
  updatedAt?: string
  updatedBy?: string | null
}

type Fetcher = typeof fetch

type UseAllowlistQueryOptions = {
  fetcher?: Fetcher
  headers?: HeadersInit
}

export function useAllowlistQuery(options: UseAllowlistQueryOptions = {}) {
  const { fetcher = fetch, headers } = options
  const [data, setData] = useState<AllowedEmail[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  const headersMemo = useMemo(() => headers, [headers && JSON.stringify(headers)])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetcher('/api/admin/allowlist', { headers: headersMemo })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message ?? `Failed to load allowlist (${res.status})`)
        }
        const json = await res.json()
        if (!mounted) return
        setData(json.data ?? [])
      } catch (err) {
        if (!mounted) return
        setError(err as Error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [fetcher, headersMemo])

  return { data, error, loading }
}
