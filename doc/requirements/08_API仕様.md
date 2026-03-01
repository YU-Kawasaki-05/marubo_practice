# 8. API仕様

### エンドポイント一覧

| # | メソッド | パス | 説明 | 認証 | ロール |
|---|---|---|---|---|---|
| 1 | GET | `/api/health` | ヘルスチェック | 不要 | — |
| 2 | POST | `/api/chat` | AIチャット（ストリーミング） | Bearer | student / staff |
| 3 | GET | `/api/conversations` | 会話一覧 | Bearer | student / staff |
| 4 | GET | `/api/conversations/[id]` | 会話詳細 | Bearer | student / staff（自身のみ） |
| 5 | POST | `/api/attachments/sign` | 署名URL発行 | Bearer | student / staff |
| 6 | POST | `/api/sync-user` | ユーザー同期 | Bearer | 全認証ユーザー |
| 7 | GET | `/api/admin/allowlist` | 許可リスト一覧 | Bearer | staff |
| 8 | POST | `/api/admin/allowlist` | 許可メール追加 | Bearer | staff |
| 9 | PATCH | `/api/admin/allowlist/[email]` | 許可メール更新 | Bearer | staff |
| 10 | POST | `/api/admin/allowlist/import` | CSV一括インポート | Bearer | staff |
| 11 | GET | `/api/admin/conversations` | 会話検索（全生徒） | Bearer | staff |
| 12 | GET | `/api/admin/conversations/[id]` | 会話詳細（全生徒） | Bearer | staff |
| 13 | GET | `/api/admin/grant` | スタッフ一覧・監査ログ | Bearer | staff + GRANT_ALLOWED |
| 14 | POST | `/api/admin/grant` | 権限付与/剥奪 | Bearer | staff + GRANT_ALLOWED |

### 各エンドポイント詳細

#### POST /api/chat

- **説明**: AIチャットメッセージを受信し、ストリーミング応答を返す
- **リクエスト**:
  ```json
  {
    "messages": [
      { "id": "...", "role": "user", "parts": [{ "type": "text", "text": "..." }] }
    ],
    "attachments": [
      { "storagePath": "user-id/uuid.jpg", "mimeType": "image/jpeg", "size": 12345 }
    ]
  }
  ```
- **レスポンス（成功）**: `200` — ストリーミングテキスト（`x-conversation-id` ヘッダ付き）
- **レスポンス（エラー）**: `401` Unauthorized / `500` Internal Server Error

#### POST /api/attachments/sign

- **説明**: Supabase Storage の署名アップロードURL を発行する
- **リクエスト**:
  ```json
  { "filename": "photo.jpg", "mimeType": "image/jpeg", "size": 1234567 }
  ```
- **レスポンス（成功）**: `200`
  ```json
  { "requestId": "sign-...", "data": { "signedUrl": "...", "storagePath": "...", "token": "..." } }
  ```
- **レスポンス（エラー）**: `400` バリデーションエラー / `401` 認証エラー / `500` 署名失敗

#### GET /api/conversations

- **説明**: ログインユーザーの会話一覧を取得する
- **クエリパラメータ**: `limit` (1-50, デフォルト20), `cursor` (ページネーション)
- **レスポンス（成功）**: `200`
  ```json
  { "data": [{ "id": "...", "title": "...", "created_at": "..." }], "nextCursor": "..." }
  ```

#### GET /api/conversations/[id]

- **説明**: 会話詳細（メッセージ＋添付）を取得する
- **レスポンス（成功）**: `200`
  ```json
  {
    "data": {
      "id": "...", "title": "...", "createdAt": "...",
      "messages": [
        {
          "id": "...", "role": "user", "content": "...", "createdAt": "...",
          "attachments": [{ "id": "...", "storagePath": "...", "mimeType": "...", "sizeBytes": 0 }]
        }
      ]
    }
  }
  ```

#### POST /api/sync-user

- **説明**: Auth ユーザーを `app_user` テーブルに同期し、Allowlistステータスを確認する
- **レスポンス（成功）**: `200`
  ```json
  { "requestId": "sync-...", "data": { "appUserId": "...", "role": "student", "allowedEmailStatus": "active" } }
  ```
- **レスポンス（エラー）**: `401` / `403` (許可リスト未登録・停止) / `409` (準備中)

#### GET /api/admin/allowlist

- **クエリパラメータ**: `status` (active/pending/revoked), `search` (メール部分一致)
- **レスポンス（成功）**: `200`
  ```json
  { "requestId": "...", "data": [{ "email": "...", "status": "active", "label": "...", ... }] }
  ```

#### POST /api/admin/allowlist

- **リクエスト**:
  ```json
  { "email": "student@example.com", "status": "active", "label": "山田太郎", "notes": "..." }
  ```
- **レスポンス（成功）**: `201`

#### PATCH /api/admin/allowlist/[email]

- **リクエスト**:
  ```json
  { "status": "revoked", "notes": "退塾" }
  ```
- **レスポンス（成功）**: `200`

#### POST /api/admin/allowlist/import

- **リクエスト**: JSON `{ "csv": "email,status,label\n...", "mode": "insert" }` または raw CSV
- **レスポンス（成功）**: `200` `{ "requestId": "...", "data": { "inserted": 5, "updated": 0 } }`

#### GET /api/admin/conversations

- **クエリパラメータ**: `email`, `from`, `to`, `keyword`, `page` (デフォルト1), `limit` (デフォルト20, 最大50)
- **レスポンス（成功）**: `200`
  ```json
  { "requestId": "...", "data": { "results": [...], "total": 42, "page": 1, "limit": 20 } }
  ```

#### GET/POST /api/admin/grant

- **GET レスポンス**: `200` `{ "data": { "staffUsers": [...], "auditLog": [...] } }`
- **POST リクエスト**: `{ "email": "...", "action": "grant" }`
- **POST レスポンス**: `200` `{ "data": { "email": "...", "previousRole": "student", "newRole": "staff", "note": "..." } }`

---

> **文書バージョン**: 1.0
> **作成日**: 2026-03-01
> **最終更新日**: 2026-03-01
