# 5. API一覧

### 公開API（認証不要）

| # | メソッド | パス | 機能ID | 説明 | Runtime |
|---|---|---|---|---|---|
| 1 | GET | `/api/health` | FR-08 | ヘルスチェック | Edge |

### ユーザーAPI（認証必要）

| # | メソッド | パス | 機能ID | 説明 | Runtime |
|---|---|---|---|---|---|
| 2 | POST | `/api/chat` | FR-03 | AIチャット（ストリーミング） | Node.js |
| 3 | GET | `/api/conversations` | FR-05 | 会話一覧取得 | Node.js |
| 4 | GET | `/api/conversations/[id]` | FR-05 | 会話詳細取得 | Node.js |
| 5 | POST | `/api/attachments/sign` | FR-04 | 署名URL発行 | Node.js |
| 6 | POST | `/api/sync-user` | FR-01 | ユーザー同期 | Node.js |

### 管理者API（staff認証必要）

| # | メソッド | パス | 機能ID | 説明 | Runtime |
|---|---|---|---|---|---|
| 7 | GET | `/api/admin/allowlist` | FR-02 | 許可メール一覧 | Node.js |
| 8 | POST | `/api/admin/allowlist` | FR-02 | 許可メール追加 | Node.js |
| 9 | PATCH | `/api/admin/allowlist/[email]` | FR-02 | 許可メール更新 | Node.js |
| 10 | POST | `/api/admin/allowlist/import` | FR-02 | CSV一括インポート | Node.js |
| 11 | GET | `/api/admin/conversations` | FR-06 | 会話検索（全生徒） | Node.js |
| 12 | GET | `/api/admin/conversations/[id]` | FR-06 | 会話詳細（全生徒） | Node.js |
| 13 | GET | `/api/admin/grant` | FR-07 | スタッフ一覧・監査ログ | Node.js |
| 14 | POST | `/api/admin/grant` | FR-07 | 権限付与/剥奪 | Node.js |

---

> **文書バージョン**: 1.0
> **作成日**: 2026-03-01
> **最終更新日**: 2026-03-01
