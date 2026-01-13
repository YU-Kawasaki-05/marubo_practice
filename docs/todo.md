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
| **BE-06** | todo | Supabase CLI マイグレーション運用 | **Step 1**: `package.json` に `db:migrate` などのコマンドショートカットを追加する。<br>**Step 2**: `docs/deployment.md` に、本番環境へのマイグレーション適用手順を書く。 |
| **BE-07** | review | Supabase モック切替 | (実装済み) `MOCK_SUPABASE=true` でメモリモックに切り替わる仕組みを実装済み。 |

### 3. フロントエンド実装 (FE)

ここが一番「動いている感」が出る部分です。小さく作っていきましょう。

| ID | Status | 概要 | 詳細ステップ (Step) |
|----|--------|------|------|
| **FE-01** | progress | `/admin/allowlist` UI | **Step 1 (表示/検索)**: (完了) `app/admin/allowlist/page.tsx` でデータ表示と検索絞り込みを実装済み。<br>**Step 2 (更新)**: 各行にステータス変更用ドロップダウンを配置し、API (PATCH) とつなぎこんで更新できるようにする。<br>**Step 3 (UX向上)**: 更新中のローディング表示や、エラー時のトースト通知などを追加して使いやすくする。 |
| **FE-02** | review | Allowlist hooks | (実装済み) `useAllowlistQuery` 実装済み。`useAllowlistMutations` は FE-01 Step 2 で実装予定。 |
| **FE-03** | todo | CSV アップロード UI | **Step 1 (UI)**: `src/features/admin/allowlist/components/CsvImportForm.tsx` を作成し、ファイル選択とボタンのみの基本形を作る。<br>**Step 2 (Parser)**: 選択したCSVをクライアントサイドでパースし、テーブル形式でプレビュー表示するロジックを実装する。<br>**Step 3 (Integration)**: `useAllowlistMutations` に `importCsv` 関数を追加し、APIへの送信処理を実装する。<br>**Step 4 (Validation)**: CSVのフォーマット不正（列不足など）を検知し、ユーザーに通知する。<br>**Step 5 (Doc)**: `memo/manual/csv_import.md` に利用方法とCSVフォーマットのマニュアルを作成する。 |
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
