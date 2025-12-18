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
| **BE-01** | todo | `allowed_email` マイグレーション適用 | **Step 1**: `supabase/migrations/20241204154500_allowlist_audit.sql` の内容を確認する（インデックスや制約が含まれているか）。<br>**Step 2**: ローカル開発環境（またはSupabaseプロジェクト）に対し、このSQLが適用されているか確認する。<br>**Step 3**: もし不足しているインデックスがあれば、新しいマイグレーションファイルを作成する。 |
| **BE-02** | review | `audit_allowlist` 実装 | (実装済み) `src/shared/lib/allowlist.ts` に `recordAuditLog` 関数を実装し、作成・更新・CSVインポート時に呼び出していることを確認。 |
| **BE-03** | review | `/api/admin/allowlist` 実装 | (実装済み) GET/POST/PATCH、CSV受け付け、リクエスト検証などを実装済み。 |
| **BE-04** | todo | `/api/sync-user` 拡張 | **Step 1**: `app/api/sync-user/route.ts` で、`allowed_email` テーブルを検索する処理を追加する。<br>**Step 2**: メールアドレスの状態（`active`, `pending`, `revoked`）に応じて、適切なエラーまたは成功レスポンスを返す分岐を作る。<br>**Step 3**: `app_user` テーブルへの保存処理を `upsert` (なければ作成、あれば更新) にし、何度呼んでもエラーにならないようにする。 |
| **BE-05** | todo | seed/import スクリプト | **Step 1**: `scripts/seed-allowlist.ts` で CSV ファイル を読み込む処理を書く。<br>**Step 2**: 読み込んだデータ をバリデーション（形式チェック）する処理を書く。<br>**Step 3**: バリデーション済みのデータを DB に一括登録（Bulk Upsert）する処理を書く。 |
| **BE-06** | todo | Supabase CLI マイグレーション運用 | **Step 1**: `package.json` に `db:migrate` などのコマンドショートカットを追加する。<br>**Step 2**: `docs/deployment.md` に、本番環境へのマイグレーション適用手順を書く。 |
| **BE-07** | review | Supabase モック切替 | (実装済み) `MOCK_SUPABASE=true` でメモリモックに切り替わる仕組みを実装済み。 |

### 3. フロントエンド実装 (FE)

ここが一番「動いている感」が出る部分です。小さく作っていきましょう。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **FE-01** | todo | `/admin/allowlist` UI | **Step 1 (表示)**: `app/admin/allowlist/page.tsx` で、APIから取得したデータを単純な `<table />` で表示する。<br>**Step 2 (検索)**: 検索ボックスを設置し、入力値が変わったら API を再取得するようにする。<br>**Step 3 (更新)**: 各行に「編集」ボタンを置き、クリックしたらステータス変更用のモーダル（または入力欄）を表示する。<br>**Step 4 (保存)**: 変更内容を API に送信（PATCH）し、成功したら一覧を更新する処理を書く。 |
| **FE-02** | todo | Allowlist hooks | **Step 1**: `useAllowlistQuery` (一覧取得) が正しく動くか確認。<br>**Step 2**: `useAllowlistMutation` (作成・更新) を作成する。<br>**Step 3**: `useCsvImport` (CSVアップロード) を作成する。 |
| **FE-03** | todo | CSV アップロード UI | **Step 1 (見た目)**: ファイル選択ボタン (`<input type="file">`) を配置し、ファイルが選択できる状態を作る。<br>**Step 2 (プレビュー)**: 選択されたファイルを読み込み、画面上に「これから取り込むデータ」として表形式でプレビュー表示する。<br>**Step 3 (送信)**: 「取り込み実行」ボタンを押し、API にデータを送信する処理をつなぎこむ。<br>**Step 4 (結果)**: 成功件数・失敗件数をトースト（通知）などで表示する。 |
| **FE-04** | todo | 学生向け警告表示 | **Step 1**: ログイン時に `/api/sync-user` の結果を受け取る処理を確認する。<br>**Step 2**: 結果が `pending` (承認待ち) や `revoked` (無効) の場合、画面全体または上部に警告メッセージを表示するコンポーネントを作る。<br>**Step 3**: 警告内に「お問い合わせはこちら」というリンクを設置する。 |

### 4. テスト & QA (QA)

作ったものが壊れていないか確認する作業です。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **QA-01** | todo | RLS/Allowed Email テスト | **Step 1**: テストコードで「スタッフ以外のユーザー」を作成する。<br>**Step 2**: そのユーザーで `allowed_email` テーブルを読み書きしようとして、エラーになることを確認する。 |
| **QA-02** | todo | API 統合テスト | **Step 1**: `/api/admin/allowlist` に対し、正常なデータを送って 200 OK が返るかテストする。<br>**Step 2**: 不正なデータ（メールアドレス形式違反など）を送って 400 Bad Request が返るかテストする。 |
| **QA-03** | todo | フロント E2E | (Playwright等の導入が必要なため、後回しでも可) 手動で「スタッフで追加 → 生徒でログイン」の流れを確認する手順書を作るだけでもOK。 |
| **QA-04** | todo | スクリプトテスト | `scripts/seed-allowlist.ts` を `--dry-run` (書き込まないモード) で実行し、エラーが出ないか確認する。 |
| **QA-05** | review | `/api/admin/allowlist` API テスト | (実装済み) Vitest + supertest でカバー済み。 |
| **QA-06** | review | Supabase モック E2E | (実装済み) MOCK_SUPABASE を用いたテスト環境整備済み。 |
| **FE-05** | todo | Allowlist 一覧プレースホルダ | `app/admin/allowlist/page.tsx` に最小 UI（一覧/件数表示）を実装し、後続の検索/フィルタ/更新 UI の土台にする。 |

### 5. 運用 / DevOps (OPS)

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **OPS-01** | todo | Migration ワークフロー整理 | `BE-06` と重複するため、そちらで実施。 |
| **OPS-02** | todo | CI 更新 | **Step 1**: `.github/workflows/test.yml` (なければ作成) に、`pnpm lint`, `pnpm typecheck`, `pnpm test` を実行するステップを追加する。 |
| **OPS-03** | blocked | Allowlist 変更通知設計 | (ユーザー確認待ち) |
| **OPS-04** | review | README 統合反映 | (完了確認) `README.new.md` が削除され、`README.md` に統合されているか確認する。 |

---

必要な情報や優先度が変わった場合は、このファイルで随時アップデートしてください。
