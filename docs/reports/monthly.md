# 月次レポート仕様

本書は、毎月スタッフに自動送信される月次利用レポートの仕様を定義する。  
β 版の規模（約 20 名）に合わせ、シンプルで有用な指標に絞る。

---

## 1. 概要

| 項目 | 内容 |
|------|------|
| **目的** | 塾のスタッフが「先月どの程度利用されたか」を把握し、生徒の学習状況を俯瞰する |
| **送信タイミング** | **毎月 1 日 09:00 JST**（前月分を集計して送信） |
| **送信方法** | Resend 経由のメール |
| **送信先** | `ADMIN_EMAILS` 環境変数に登録された全スタッフ |
| **出力形式** | **HTML メール本文** + **CSV 添付ファイル** |

---

## 2. 実行の仕組み

### Vercel Cron

`docs/deployment.md` に記載の通り、Cron は **毎日 23:55 JST** に実行される。

```
[Cron 23:55 JST] → /api/reports/monthly
  → 「今日は月末か？」を判定
  → 月末なら翌朝送信用のレポートを生成・保存
  → 翌月 1 日の Cron 実行時にメール送信
```

**簡略化案（β 版推奨）**:  
β 版では上記を単純化し、**毎日 23:55 JST の Cron で「今日が月末か」を判定 → 月末ならその場で集計＆送信** とする。深夜の送信だが、スタッフは翌朝メールを確認する運用で問題ない。

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/reports/monthly",
      "schedule": "55 23 * * *",
      "timezone": "Asia/Tokyo"
    }
  ]
}
```

### Cron 認証

- Vercel Cron は `CRON_SECRET` ヘッダを自動付与する
- API 側で `Authorization: Bearer ${CRON_SECRET}` or Vercel の `x-vercel-cron` ヘッダを検証
- 手動実行時は `requireStaff()` による認証

---

## 3. 集計指標

### HTML メール本文に含める指標（サマリー）

| # | 指標 | 算出方法 |
|---|------|---------|
| 1 | **アクティブ生徒数** | 当月に 1 件以上メッセージを送った `app_user` のユニーク数 |
| 2 | **総会話数** | 当月に作成された `conversation` の件数 |
| 3 | **総質問数** | 当月の `message` のうち `sender = 'user'` の件数 |
| 4 | **総回答数** | 当月の `message` のうち `sender = 'assistant'` の件数 |
| 5 | **1 人あたり平均質問数** | 総質問数 ÷ アクティブ生徒数 |
| 6 | **最も活発な日** | 質問数が最多の日付 |

### CSV 添付ファイルに含める指標（詳細）

**ファイル名**: `marubo_ai_report_YYYY-MM.csv`

| 列 | 内容 |
|----|------|
| `email` | 生徒のメールアドレス |
| `display_name` | 表示名（なければ空） |
| `conversations` | 当月の会話数 |
| `questions` | 当月の質問数（`sender = 'user'`） |
| `first_activity` | 当月最初のメッセージ日時 |
| `last_activity` | 当月最後のメッセージ日時 |

**ソート順**: 質問数の降順

---

## 4. 集計 SQL（参考実装）

```sql
-- 月間サマリー（HTML メール用）
SELECT
  COUNT(DISTINCT c.user_id) AS active_students,
  COUNT(DISTINCT c.id)      AS total_conversations,
  COUNT(CASE WHEN m.sender = 'user' THEN 1 END)      AS total_questions,
  COUNT(CASE WHEN m.sender = 'assistant' THEN 1 END)  AS total_answers
FROM conversation c
JOIN message m ON m.conv_id = c.id
WHERE c.created_at >= :month_start   -- '2026-02-01T00:00:00+09:00'
  AND c.created_at <  :month_end;    -- '2026-03-01T00:00:00+09:00'

-- 生徒別詳細（CSV 用）
SELECT
  u.email,
  u.display_name,
  COUNT(DISTINCT c.id) AS conversations,
  COUNT(CASE WHEN m.sender = 'user' THEN 1 END) AS questions,
  MIN(m.created_at) AS first_activity,
  MAX(m.created_at) AS last_activity
FROM app_user u
JOIN conversation c ON c.user_id = u.id
JOIN message m ON m.conv_id = c.id
WHERE c.created_at >= :month_start
  AND c.created_at <  :month_end
GROUP BY u.id, u.email, u.display_name
ORDER BY questions DESC;
```

> 日時の範囲は JST 基準で当月 1 日 00:00:00 〜 翌月 1 日 00:00:00 とする。

---

## 5. HTML メールテンプレート（概要）

```
件名: 【Marubo AI】2026年2月 月次利用レポート

━━━━━━━━━━━━━━━━━━━━━━━━━━
  Marubo AI 月次レポート — 2026年2月
━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 サマリー
  アクティブ生徒数:    18 名
  総会話数:            156 件
  総質問数:            423 件
  1人あたり平均質問数: 23.5 件
  最も活発な日:        2026-02-12 (42件)

📎 添付ファイル
  生徒別の詳細データを CSV で添付しています。

━━━━━━━━━━━━━━━━━━━━━━━━━━
※ このメールは Marubo AI から自動送信されています。
```

- HTML 版はシンプルなテーブルレイアウト（メールクライアント互換性重視）
- テキストフォールバックも含める

---

## 6. 手動リトライ

### API エンドポイント

`GET /api/reports/monthly?month=2026-02&dryRun=false`

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `month` | string (`YYYY-MM`) | はい（手動時） | 対象月 |
| `dryRun` | boolean | いいえ | `true` の場合、集計のみ実行しメールは送信しない。デフォルト `false` |

### 認証

- **Cron 経由**: `CRON_SECRET` ヘッダで認証
- **手動実行**: `requireStaff()` で認証

### レスポンス

```json
{
  "requestId": "report_01h9...",
  "data": {
    "month": "2026-02",
    "dryRun": false,
    "summary": {
      "activeStudents": 18,
      "totalConversations": 156,
      "totalQuestions": 423,
      "totalAnswers": 410
    },
    "emailsSent": 3
  }
}
```

---

## 7. monthly_summary テーブルの活用

`docs/database.md` に定義済みの `monthly_summary` テーブルにレポート生成時の集計結果を保存する。  
これにより、同月の再実行時に DB から結果を引くことができ、再集計コストを回避できる。

ただし β 版では規模が小さいため、**毎回集計する方式**でも十分高速（数十 ms 以内）。  
`monthly_summary` への保存は将来の規模拡大に備えた準備として残す。

---

## 8. エラーハンドリング

| エラー | 対応 |
|--------|------|
| 集計 SQL 失敗 | S1 通知。エラーをログに記録。リトライ可能 |
| Resend API 失敗 | S1 通知。「集計は成功したがメール送信に失敗」をログに記録。手動リトライで再送 |
| 対象月にデータがない | 正常扱い。「当月の利用データはありませんでした」という内容のメールを送信 |

---

## 9. 環境変数

| 変数 | 用途 | 例 |
|------|------|-----|
| `ADMIN_EMAILS` | レポート送信先（`;` 区切り） | `staff1@example.com;staff2@example.com` |
| `MAIL_FROM` | 送信元アドレス | `"noreply@your-domain.example"` |
| `RESEND_API_KEY` | Resend API キー | `re_xxxx` |
| `CRON_SECRET` | Vercel Cron の認証トークン | 自動設定 |
| `APP_TIMEZONE` | タイムゾーン | `Asia/Tokyo` |

---

## 関連ドキュメント

- [デプロイメント](./deployment.md)（Cron 設定、環境変数）
- [データベース設計](./database.md)（`monthly_summary` テーブル）
- [運用 Runbook](./operational/runbook.md)（月次レポート失敗時のリトライ）
- [TODO / Roadmap](./todo.md)（SPEC-10, BE-14〜15, FE-08）
