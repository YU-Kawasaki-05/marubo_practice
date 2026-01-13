import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const targetEmail = process.argv[2]
  if (!targetEmail) {
    console.log('使用法: npx tsx scripts/grant-staff-role.ts <メールアドレス>')
    console.log('  または')
    console.log('        npx tsx scripts/grant-staff-role.ts --latest')
    process.exit(1)
  }

  let userToPromote

  if (targetEmail === '--latest') {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    // 作成日時でソートして最新を取得
    userToPromote = users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  } else {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    userToPromote = users.find((u) => u.email === targetEmail)
  }

  if (!userToPromote) {
    console.error('ユーザーが見つかりませんでした。')
    process.exit(1)
  }

  console.log(`対象ユーザー: ${userToPromote.email} (${userToPromote.id})`)

  // 1. Auth Metadata の更新
  const { error: updateError } = await supabase.auth.admin.updateUserById(userToPromote.id, {
    app_metadata: { role: 'staff' },
    user_metadata: { ...userToPromote.user_metadata, role: 'staff' } // 念のため両方
  })
  if (updateError) {
    console.error('Authメタデータの更新に失敗:', updateError)
    process.exit(1)
  }
  console.log('✅ Authメタデータを staff に更新しました')

  // 2. app_user テーブルへの反映 (sync)
  // 既存レコードがあれば update, なければ insert
  const { error: dbError } = await supabase.from('app_user').upsert({
    auth_uid: userToPromote.id,
    email: userToPromote.email,
    role: 'staff',
    display_name: 'Staff User',
    // created_at などは自動
  }, { onConflict: 'auth_uid' })

  if (dbError) {
    console.error('app_user テーブルの更新に失敗:', dbError)
    process.exit(1)
  }
  console.log('✅ app_user テーブルを更新しました (role: staff)')
}

main().catch((err) => {
  console.error('予期せぬエラー:', err)
  process.exit(1)
})
