import { beforeEach, describe, expect, it } from 'vitest'

import { POST as allowlistPost } from '../../../app/api/admin/allowlist/route'
import { POST as allowlistImportPost } from '../../../app/api/admin/allowlist/import/route'
import { resetSupabaseAdminClientForTest } from '../../../src/shared/lib/supabaseAdmin'

const BASE_URL = 'http://localhost/api/admin/allowlist'
const STAFF_HEADER = { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' }

async function parseJson(res: Response) {
  return (await res.json()) as any
}

describe('/api/admin/allowlist CSV import errors (mock supabase)', () => {
  beforeEach(() => {
    process.env.MOCK_SUPABASE = 'true'
    resetSupabaseAdminClientForTest()
  })

  it('detects duplicated emails inside CSV', async () => {
    const csv = ['email,status', 'dup@example.com,active', 'dup@example.com,pending'].join('\n')
    const res = await allowlistImportPost(
      new Request(`${BASE_URL}/import`, {
        method: 'POST',
        headers: STAFF_HEADER,
        body: JSON.stringify({ csv, mode: 'insert' }),
      }),
    )
    const body = await parseJson(res)
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('CSV_DUPLICATED_IN_FILE')
  })

  it('rejects invalid status value', async () => {
    const csv = ['email,status', 'bad@example.com,unknown'].join('\n')
    const res = await allowlistImportPost(
      new Request(`${BASE_URL}/import`, {
        method: 'POST',
        headers: STAFF_HEADER,
        body: JSON.stringify({ csv, mode: 'insert' }),
      }),
    )
    const body = await parseJson(res)
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('STATUS_INVALID')
  })

  it('rejects invalid CSV format', async () => {
    const csv = 'not,a,csv'
    const res = await allowlistImportPost(
      new Request(`${BASE_URL}/import`, {
        method: 'POST',
        headers: STAFF_HEADER,
        body: JSON.stringify({ csv, mode: 'insert' }),
      }),
    )
    const body = await parseJson(res)
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('CSV_MISSING_EMAIL') // ヘッダが足りない場合
  })

  it('rejects missing authorization', async () => {
    const csv = ['email,status', 'noauth@example.com,active'].join('\n')
    const res = await allowlistImportPost(
      new Request(`${BASE_URL}/import`, {
        method: 'POST',
        body: JSON.stringify({ csv, mode: 'insert' }),
      }),
    )
    const body = await parseJson(res)
    expect(res.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })
})
