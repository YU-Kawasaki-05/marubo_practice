# TODO / Roadmap

本書は、今後実装予定の機能や改善点を整理する **開発ロードマップ** です。
初心者でも着実に開発を進められるよう、タスクを細かいステップ（Step）に分解しています。

**進め方のコツ**:
1. 基本的に **ID順** または **Step順** に進めてください。
2. 1つのStepが終わるごとに、動作確認（`pnpm dev` や `pnpm test`）を行うと手戻りが少なくなります。
3. 詰まったら、前のStepに戻って見直すか、エラーログを確認しましょう。

---

## タスク一覧

> **Status Legend**: `todo` = 未着手, `progress` = 進行中, `blocked` = 調整待ち, `review` = 実装済みレビュー待ち, `done` = 完了

### 1. 仕様・ドキュメント整備 (SPEC)

開発の迷いをなくすための「地図」を作るフェーズです。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **SPEC-01** | review | 許可メール運用詳細追記 | (完了済み) `docs/security.md` に招待メール文面と監査ログ保持期間を、`docs/architecture.md` にCSV取り扱いルールを追記済み。 |
| **SPEC-02** | review | Allowlist UI/CSV 仕様確定 | (完了済み) `/admin/allowlist` のUX、バリデーション、CSV列定義などを `docs/api.md` に追記済み。 |
| **SPEC-03** | review | `/api/sync-user` メッセージ定義 | (完了済み) `pending/revoked/not-found` の表示文言を `docs/api.md` に追加済み。 |
| **SPEC-04** | review | 退会/削除ポリシー整理 | (完了済み) `docs/database.md` に論理削除方針を、`docs/operational/runbook.md` に退会処理手順を追記済み。 |
| **SPEC-05** | done | 保護者共有要件確認 | (完了) **方針決定**: 個人情報保護のため、CSVの保護者への配布・共有は行わない。<br>※ 必要な場合はスタッフが個別に連絡する運用とする。 |
| **SPEC-06** | done | Onboarding/README 更新 | (完了) `docs/onboarding.md` 作成済み。`README.md` にセットアップ手順統合済み。 |

### 2. バックエンド実装 (BE)

サーバー側のロジックとデータベース周りを整備します。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **BE-01** | done | `allowed_email` マイグレーション適用 | (完了) **手動適用済み**: Supabase WebコンソールのSQL Editorにて、`20241204154500_allowlist_audit.sql` ベースのSQLを実行・適用済み。 |
| **BE-02** | review | `audit_allowlist` 実装 | (実装済み) `src/shared/lib/allowlist.ts` に `recordAuditLog` 関数を実装し、作成・更新・CSVインポート時に呼び出していることを確認。 |
| **BE-03** | review | `/api/admin/allowlist` 実装 | (実装済み) GET/POST/PATCH、CSV受け付け、リクエスト検証などを実装済み。 |
| **BE-04** | review | `/api/sync-user` 拡張 | (実装済み) `active` で同期、`pending/revoked` でエラー、`not-found` で拒否するロジックを実装済み。 |
| **BE-05** | review | seed/import スクリプト | (実装済み) `scripts/seed-allowlist.ts` を作成。`scripts/data/allowlist.sample.csv` からデータを読み込み、Seed Bot ユーザー経由で DB に登録/更新できることを確認。 |
| **BE-06** | todo | Supabase CLI マイグレーション運用 | **Blocker解消**: DB パスワード受領済み。<br>**Step 1**: `package.json` に `db:migrate` などのコマンドショートカットを追加する。<br>**Step 2**: `docs/deployment.md` に、本番環境へのマイグレーション適用手順を書く。 |
| **BE-07** | review | Supabase モック切替 | (実装済み) `MOCK_SUPABASE=true` でメモリモックに切り替わる仕組みを実装済み。 |

### 3. フロントエンド実装 (FE)

ここが一番「動いている感」が出る部分です。小さく作っていきましょう。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **FE-01** | review | `/admin/allowlist` UI | **Step 1 (表示/検索)**: (完了) `app/admin/allowlist/page.tsx` でデータ表示と検索絞り込みを実装済み。<br>**Step 2 (更新)**: (完了) 各行にステータス変更用ドロップダウンを配置し、API (PATCH) とつなぎこんで更新できるようにした。<br>**Step 3 (UX向上)**: (一部完了) 簡易的なリロード処理で対応済み。 |
| **FE-02** | done | Allowlist hooks | (完了) `useAllowlistQuery` および `useAllowlistMutations` (create, update, importCsv) 実装済み。 |
| **FE-03** | done | CSV アップロード UI | **Step 1 (UI)**: (完了) `src/features/admin/allowlist/components/CsvImportForm.tsx` を作成。<br>**Step 2 (Parser)**: (完了) クライアントサイドでのパース実装済み（Shift_JIS対応）。<br>**Step 3 (Integration)**: (完了) API統合済み。<br>**Step 4 (Validation)**: (完了) CSVフォーマット簡易チェック実装済み。<br>**Step 5 (Doc)**: (完了) `docs/manual/csv_import.md` を作成済み。 |
| **FE-04** | done | 学生向け警告表示 | **Step 1 (RLS設定)**: (完了) `allowed_email` に `SELECT` 許可ポリシーを追加済み。<br>**Step 2 (データ取得)**: (完了) `useMyAllowlistStatus` 実装済み。<br>**Step 3 (警告UI)**: (完了) `AccountStatusBanner` 実装済み。<br>**Step 4 (配置)**: (完了) `app/layout.tsx` にバナーを配置済み。 |

### 4. テスト & QA (QA)

作ったものが壊れていないか確認する作業です。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **QA-01** | done | RLS/Allowed Email テスト | **Step 1**: (完了) `scripts/verify-rls.ts` を作成。<br>**Step 2**: 匿名/未許可ユーザーで0件、許可ユーザーで1件のみ閲覧できることを検証済み。 |
| **QA-02** | done | API 統合テスト | **Step 1**: `/api/admin/allowlist` に対し、正常なデータを送って 200 OK が返るかテストする。<br>**Step 2**: 不正なデータ（メールアドレス形式違反など）を送って 400 Bad Request が返るかテストする。（`tests/api/admin/allowlist.test.ts` で実装済み） |
| **QA-03** | todo | フロント E2E | (Playwright等の導入が必要なため、後回しでも可) 手動で「スタッフで追加 → 生徒でログイン」の流れを確認する手順書を作るだけでもOK。 |
| **QA-04** | progress | チャット永続化の回帰テスト | **Step 1 (todo)**: 保存→一覧→詳細のハッピーパスを API 統合テストで実装。<br>**Step 2 (todo)**: トークンなし/期限切れで 401/403 になることを確認するテストを追加。 |
| **QA-05** | todo | スクリプトテスト | `scripts/seed-allowlist.ts` を `--dry-run` (書き込まないモード) で実行し、エラーが出ないか確認する。 |
| **QA-06** | review | `/api/admin/allowlist` API テスト | (QA-02に統合) |
| **QA-07** | review | Supabase モック E2E | (実装済み) MOCK_SUPABASE を用いたテスト環境整備済み。 |

// ...existing code...
### 5. 運用 / DevOps (OPS)

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **OPS-01** | todo | Migration ワークフロー整理 | `BE-06` と重複するため、そちらで実施。 |
| **OPS-02** | done | CI 更新 | **Step 1**: (完了) `.github/workflows/test.yml` を作成し、Push時に Lint/Typecheck/Test が実行されるように構成済み。 |
| **OPS-03** | blocked | Allowlist 変更通知設計 | (ユーザー確認待ち) |
| **OPS-04** | review | README 統合反映 | (完了確認) `README.new.md` が削除され、`README.md` に統合されているか確認する。 |

### 6. チャット機能実装 (CHAT)

教育用AIチャットの中核機能を実装します。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **CHAT-01** | done | 技術選定 & セットアップ | **Step 1**: (完了) Vercel AI SDK (`ai`), `openai` SDK をインストール済み。<br>**Step 2**: (完了) 環境変数 (`OPENAI_API_KEY`) を `.env.local` に設定済み。 |
| **CHAT-02** | done | バックエンド API 実装 | **Step 1**: (完了) `/app/api/chat/route.ts` を作成済み。<br>**Step 2**: (完了) `streamText` を用いてOpenAIへのストリーミングリクエストを実装済み。<br>**Step 3**: (完了) システムプロンプトを設定済み。 |
| **CHAT-03** | done | チャット UI 実装 | **Step 1**: (完了) `src/features/chat/components/ChatInterface.tsx` を作成し、`useChat` でメッセージ送受信を行えるようにする。<br>**Step 1.5 (Fix done)**: (完了) Supabase認証トークンを `useChat` に正しく渡すため、コンポーネントを分割してトークン取得後に初期化するように修正済み。<br>**Step 1.6 (Fix done)**: (完了) `toDataStreamResponse` のプロトコル不一致を修正済み。<br>**Step 1.7 (Fix done)**: (完了) Data Stream Protocol使用時、`message.content`が空になる問題を修正 (`MessageBubble`で`parts`からテキスト復元)。<br>**Step 2 (UI)**: (完了) メッセージ表示コンポーネント作成 (`MessageBubble`)。<br>**Step 3 (Markdown)**: (完了) `react-markdown` を導入し、太字やリストを表示できるようにする。<br>**Step 4 (Math)**: (完了) `remark-math`, `rehype-katex` を導入し、数式 ($...$) をきれいに表示できるようにする。<br>**Step 5 (Style)**: (完了) `MemoizedMarkdown` で AIの応答エリアに適切なスタイル（背景色、余白）を適用済み。 |
| **CHAT-04** | progress | 画面統合 | **Step 1**: `/app/chat/page.tsx` を AllowlistGuard 付きで配置する。<br>**Step 2**: チャット画面で自動スクロール（新メッセージ受信時に最下部へ）。 |
| **CHAT-05** | progress | チャット永続化 & 履歴UI | **Blocker解消**: DB パスワード受領済み。<br>**Step 1 (done)**: Supabase スキーマ適用を確認（`db push` 済み）。<br>**Step 2 (done)**: `/api/chat` に onFinish 保存処理を追加し、`conversationId` をヘッダで返す。<br>**Step 3 (done)**: `/api/conversations` (GET 一覧) を実装（limit/cursor、`created_at desc`）。<br>**Step 4 (done)**: `/api/conversations/[id]` (GET 詳細) を実装（messages 昇順）。<br>**Step 5 (todo)**: フロント サイドバー最小版を実装（一覧取得→クリックで詳細取得を表示）。<br>**Step 6 (todo)**: 保存→一覧→詳細の統合テストを1件追加。 |

---

必要な情報や優先度が変わった場合は、このファイルで随時アップデートしてください。
