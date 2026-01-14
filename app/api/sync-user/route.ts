import { type NextRequest } from 'next/server'

import { AppError, errorResponse } from '../../../src/shared/lib/errors'
import { generateRequestId, getBearerToken } from '../../../src/shared/lib/request'
import { jsonResponse } from '../../../src/shared/lib/response'
import { getSupabaseAdminClient } from '../../../src/shared/lib/supabaseAdmin'
import type { AllowedEmailRow } from '../../../src/shared/types/database'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const requestId = generateRequestId('sync')

  try {
    const token = getBearerToken(req)
    const supabase = getSupabaseAdminClient()

    // 1. Verify User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user || !user.email) {
      throw new AppError(401, 'UNAUTHORIZED', 'ログインセッションが無効です。', {
        originalError: authError?.message || 'No user found',
      })
    }

    const email = user.email.toLowerCase().trim()

    // 2. Check Allowlist
    const { data: allowedEmail, error: allowlistError } = await supabase
      .from('allowed_email')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    // Handle "Not Found" specifically
    if (!allowedEmail) {
      // If maybeSingle returns null (no error), it means not found
      throw new AppError(403, 'ALLOWLIST_NOT_FOUND', '許可されていないメールアドレスです。', {
        email,
      })
    }

    if (allowlistError) {
      console.error('Allowlist Error:', allowlistError)
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', '許可リストの確認中にエラーが発生しました。')
    }

    const allowRow = allowedEmail as AllowedEmailRow

    // 3. Logic Branch by Status
    switch (allowRow.status) {
      case 'revoked':
        throw new AppError(403, 'ALLOWLIST_REVOKED', 'アカウントが停止されています。', {
          email,
          notes: allowRow.notes || null,
        })
      case 'pending':
        throw new AppError(409, 'ALLOWLIST_PENDING', '利用開始準備中です。', { email })
      case 'active':
        // OK, proceed
        break
      default:
        throw new AppError(403, 'ALLOWLIST_Review', '不明なステータスです。')
    }

    // 4. Upsert App User
    // We want to insert if not exists, or update email if exists.
    // Important: We should NOT overwrite 'role' if it's already set (e.g. to 'staff').
    // Postgres ON CONFLICT DO UPDATE...
    
    // First, try to select to see if user exists, because simple upsert from JS client
    // might be tricky to "update only email, keep role".
    // Actually, simple upsert with ignoreDuplicates: false updates all fields provided.
    // If we only provide { auth_uid, email }, other fields like 'role' might not be touched provided they are not in the payload?
    // No, upsert usually requires all required fields for insert.
    // Let's use clean approach:
    
    const { data: existingUser } = await supabase
      .from('app_user')
      .select('id, role')
      .eq('auth_uid', user.id)
      .single()

    let appUserData: { id: string; role: string }

    if (existingUser) {
      // Exist: Update email only (if changed)
      const { error: updateError } = await supabase
        .from('app_user')
        .update({ email })
        .eq('id', existingUser.id)
      
      if (updateError) throw new Error(updateError.message)
      
      appUserData = { id: existingUser.id, role: existingUser.role }
    } else {
      // New: Insert (role defaults to 'student')
      const { data: newUser, error: insertError } = await supabase
        .from('app_user')
        .insert({
          auth_uid: user.id,
          email: email,
          // role will default to 'student' via DB default
        })
        .select('id, role')
        .single()
        
      if (insertError) throw new Error(insertError.message)
      if (!newUser) throw new Error('Failed to create user')
        
      appUserData = { id: newUser.id, role: newUser.role }
    }

    return jsonResponse(requestId, {
      appUserId: appUserData.id,
      role: appUserData.role,
      allowedEmailStatus: allowRow.status,
    })

  } catch (error) {
    return errorResponse(requestId, error as Error)
  }
}
