import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { getSupabaseAdminClient } from '../src/shared/lib/supabaseAdmin'
import { parseAllowlistCsv, importAllowlistCsv } from '../src/shared/lib/allowlist'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const SEED_USER_EMAIL = 'seed-bot@example.com'
const SEED_USER_ID = '00000000-0000-0000-0000-000000000001' // Fixed UUID for repeatability

async function main() {
  const adminClient = getSupabaseAdminClient()

  console.log('1. Ensuring Seed User (Staff) exists...')
  // Insert a dummy staff user so foreign keys work
  const { error: userError } = await adminClient.from('app_user').upsert({
    id: SEED_USER_ID,
    email: SEED_USER_EMAIL,
    auth_uid: '00000000-0000-0000-0000-000000000001', // Dummy Auth UID
    role: 'staff',
    display_name: 'Seed Bot',
  })

  if (userError) {
    console.error('Failed to create seed user:', userError)
    process.exit(1)
  }
  console.log('   Seed user ready.')

  console.log('2. Reading CSV...')
  const csvPath = process.argv[2] || path.join(__dirname, 'data', 'allowlist.sample.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  
  console.log('3. Parsing CSV...')
  const records = parseAllowlistCsv(csvContent)
  console.log(`   Found ${records.length} records.`)

  console.log('4. Importing to Supabase...')
  try {
    const result = await importAllowlistCsv(records, {
      mode: 'upsert',
      staffUserId: SEED_USER_ID,
      requestId: 'script-seed-001',
    })
    console.log('   Success!')
    console.log('   Inserted/Upserted:', result.inserted + (result.updated || 0)) // updated might differ based on impl
  } catch (err: any) {
    console.error('   Import failed:')
    console.error(err.message)
    if (err.details) console.error(err.details)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
