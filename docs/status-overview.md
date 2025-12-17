# リポジトリ状況サマリー

この文書は現行コードベースの構成と目的を短時間で把握するためのスナップショットです。詳細は既存ドキュメント（README と各 docs/*.md）を参照してください。

### このドキュメントで整理した内容
- 何が作られているか（ユーザー/スタッフのユースケースと機能範囲）
- どんな技術スタックとアーキテクチャで構築されているか（Next.js + Supabase + LLM 構成）
- どこに何が置かれているか（主要ディレクトリと役割）
- どうセットアップ・テスト・運用するか（必須手順と推奨コマンド）
- 現在の検証状況（動作確認済みの項目）

## プロダクト概要
- 目的：生徒がテキスト/画像で質問し、AI が Markdown/数式対応の回答を返す。会話は保存され、スタッフが閲覧し、月末に CSV/HTML レポートを受け取る。対象は少人数 β 運用（約 20 名）を想定。【F:README.md†L1-L37】
- 主要役割：生徒（質問・履歴閲覧）とスタッフ（全会話検索・許可メール管理・レポート受信/再実行）。Google ログインを採用し、スタッフは管理ロールで保護。【F:docs/architecture.md†L16-L49】

## 技術スタックとアーキテクチャ
- フロント：Next.js 14 App Router + TypeScript + Tailwind + Zustand。Markdown/LaTeX は react-markdown + remark/rehype の組み合わせで描画。【F:docs/architecture.md†L55-L64】
- バックエンド：Next.js Route Handlers (Node runtime) から Supabase（Auth/Postgres/Storage）を利用。LLM はプライマリとフォールバックを切り替え可能。【F:docs/architecture.md†L55-L65】
- バッチ/メール：Vercel Cron（毎日 23:55 JST）で月次レポート送信。Resend を使用し、SPF/DKIM/DMARC 必須。【F:docs/architecture.md†L55-L67】
- 主要ルート：/app/chat (生徒 UI)、/app/admin (スタッフ UI)、/app/api/** にチャット送信・添付署名発行・月次レポート・ユーザー同期・管理者付与などを実装。【F:docs/architecture.md†L73-L101】

## ディレクトリ構成（抜粋）
- `app/`：UI と API ルート。KaTeX CSS のグローバル import は `app/layout.tsx`。【F:docs/architecture.md†L103-L121】
- `src/features/`：機能単位のロジック（auth/chat/conversations/admin/reports）。管理者許可リスト UI ロジックや月次 SQL/CSV 生成がここにまとまる。【F:docs/architecture.md†L103-L121】
- `src/shared/`：Supabase クライアント、LLM クライアント、メール送信、エラーラッパー、共通コンポーネント/フック/ユーティリティ。【F:docs/architecture.md†L103-L121】
- `supabase/`：SQL マイグレーション（SQL Editor と CLI 両対応）。`supabase/migrations/20241204154500_allowlist_audit.sql` を初期適用することで必須テーブルが作成される。【F:README.md†L45-L63】

## 開発・運用の基本フロー
- セットアップ：`pnpm i` → `.env.local` に Supabase/LLM/Resend キー設定 → `pnpm dev` で起動。Supabase では allowlist/audit 用 SQL を最初に適用。【F:README.md†L39-L65】
- 品質/テスト：`pnpm lint`（ESLint）・`pnpm typecheck`（strict TS）・`pnpm test`（Vitest + jsdom）。テスト方針や RLS テスト方法は `docs/testing.md` と `docs/rls.md` を参照。【F:package.json†L6-L21】【F:README.md†L1-L37】
- 権限/RLS：学生とスタッフでロールを分離し、Service Role キーはサーバー API のみで使用する方針。Storage 署名 URL は短寿命で発行し、クォータ/レート制限は DB ベースで実装。【F:README.md†L1-L37】【F:docs/architecture.md†L28-L50】

## 直近の確認状況
- リポジトリは Node 18+ で動作する Next.js プロジェクトとしてセットアップ済み。依存関係は pnpm 管理で、モノレポ構成はなし。【F:package.json†L1-L49】
- Vitest によるサニティテスト (`tests/basic.test.ts`) は成功（2025-02-27 実行）。【60f288†L1-L8】
- Supabase 招待待ちでも進められるよう、`MOCK_SUPABASE=true` でメモリモックに切り替え可能。Route Handler とモックの挙動を確認するテスト（11件）が `pnpm test` で成功済み（2025-02-27 実行）。【F:tests/api/admin/allowlist.test.ts†L1-L99】【F:tests/allowlistHook.mock.test.tsx†L1-L65】
- Supabase 初期マイグレーションは `/supabase/migrations/20241204154500_allowlist_audit.sql` に整備済み。`allowed_email` に `updated_by` を含み、`audit_allowlist` で操作履歴を保持する。【F:supabase/migrations/20241204154500_allowlist_audit.sql†L1-L33】
