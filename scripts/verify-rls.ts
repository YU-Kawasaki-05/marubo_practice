import 'dotenv/config'

// .env.local を明示的に読み込む
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

/**
 * QA-01: RLS Verification Script
 * 
 * 目的: "User A cannot see User B's allowed_email row" を検証する。
 * 前提: 
 *   - 実際の Supabase プロジェクトに対して実行する。
 *   - 2つのテスト用ユーザー（User A, User B）が認証可能であること。
 *   - しかし、今回は簡易的に「匿名(無認証)でアクセスして何も見えないこと」と
 *     「開発者が自分のトークンでアクセスして自分の行だけ見えること」を確認するスクリプトとする。
 * 
 * 使い方:
 *   npx tsx scripts/verify-rls.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.')
  process.exit(1)
}

async function main() {
  console.log('--- QA-01: RLS Security Check ---')

  // 1. Anon Client (No Auth)
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  console.log('\n[Check 1] Trying to fetch allowed_email as Anonymous (No Login)...')
  const { data: anonData, error: anonError } = await anonClient
    .from('allowed_email')
    .select('*')
  
  if (anonError) {
    console.error('Unexpected error:', anonError.message)
  } else {
    console.log(`Result count: ${anonData.length}`)
    if (anonData.length === 0) {
      console.log('✅ Success: Anonymous user sees 0 rows.')
    } else {
      console.error('❌ Failure: Anonymous user can see rows! RLS might be disabled.')
    }
  }

  // 2. Service Role (Admin) - Skip for now as we don't want to expose service role key in script easily
  // Instead, we encourage user to try with their own token if available.
  
  const userToken = process.env.TEST_USER_TOKEN
  if (userToken) {
    console.log('\n[Check 2] Trying to fetch allowed_email as Logged-in User...')
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    })
    
    // Check 'me'
    const { data: { user } } = await userClient.auth.getUser()
    const email = user?.email
    
    if (email) {
      console.log(`User: ${email}`)
      const { data: userData } = await userClient.from('allowed_email').select('*')
      const count = userData?.length ?? 0
      console.log(`Visible rows: ${count}`)
      
      const others = userData?.filter(r => r.email !== email)
      if (others && others.length > 0) {
        console.error(`❌ Failure: User can see ${others.length} other rows!`)
      } else {
        console.log('✅ Success: User sees only their own row (or none).')
      }
    } else {
      console.log('⚠️ Skipped: Token is invalid or expired.')
    }
  } else {
    console.log('\n[Check 2] Skipped (No TEST_USER_TOKEN env provided)')
    console.log('  To test specific user, run: TEST_USER_TOKEN=... npx tsx scripts/verify-rls.ts')
  }
}

main().catch(console.error)
