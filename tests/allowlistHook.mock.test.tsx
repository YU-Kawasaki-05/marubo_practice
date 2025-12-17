import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { GET as allowlistGet, POST as allowlistPost } from '../app/api/admin/allowlist/route'
import { useAllowlistQuery } from '../src/features/admin/allowlist/hooks/useAllowlistQuery'
import { resetSupabaseAdminClientForTest } from '../src/shared/lib/supabaseAdmin'

const BASE_URL = 'http://localhost/api/admin/allowlist'
const STAFF_HEADER = { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' }

async function handleRequest(url: string, init?: RequestInit) {
  // Route handlers expect Request + headers
  if (url.startsWith('/api/admin/allowlist') && (!init || init.method === undefined || init.method === 'GET')) {
    return allowlistGet(
      new Request(`${BASE_URL}`, {
        method: 'GET',
        headers: init?.headers,
      }),
    )
  }
  throw new Error(`Unhandled request: ${url}`)
}

function TestComponent() {
  const { data, loading, error } = useAllowlistQuery({ fetcher: handleRequest as any, headers: STAFF_HEADER })

  if (loading) return <div>loading</div>
  if (error) return <div>error</div>
  return <div>count:{data?.length ?? 0}</div>
}

describe('useAllowlistQuery (mock supabase)', () => {
  beforeEach(async () => {
    process.env.MOCK_SUPABASE = 'true'
    resetSupabaseAdminClientForTest()
    // seed 2 records via POST handler
    await allowlistPost(
      new Request(BASE_URL, {
        method: 'POST',
        headers: STAFF_HEADER,
        body: JSON.stringify({ email: 'hook01@example.com', status: 'active' }),
      }),
    )
    await allowlistPost(
      new Request(BASE_URL, {
        method: 'POST',
        headers: STAFF_HEADER,
        body: JSON.stringify({ email: 'hook02@example.com', status: 'pending' }),
      }),
    )
  })

  it('loads allowlist entries via hook with mock fetcher', async () => {
    render(<TestComponent />)
    await waitFor(() => screen.getByText(/count:/))
    expect(screen.getByText('count:2')).toBeInTheDocument()
  })
})
