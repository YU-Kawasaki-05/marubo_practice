# FR-03: AIチャット機能

## 3.1 機能概要

OpenAI GPT-4o-mini を利用し、生徒のテキスト・画像による質問に対してAIがストリーミング形式で回答する。回答はMarkdown + LaTeX形式でレンダリングされる。

## 3.2 詳細仕様

### FR-03-1: テキスト送信・ストリーミング受信

- **エンドポイント**: `POST /api/chat`
- **フロントエンド**: Vercel AI SDK の `useChat` フック（ChatInterface コンポーネント）
- **AIモデル**: `gpt-4o-mini`（コスト最適化）
- **処理フロー**:
  1. フロントエンドが `useChat` の `append()` でメッセージを送信
  2. APIルートが Bearer トークンを検証
  3. `convertSafeMessages()` で UIMessage → ModelMessage に安全変換
  4. `streamText()` で OpenAI API にストリーミングリクエスト
  5. ストリーミング応答を `toUIMessageStreamResponse()` でクライアントに返却
  6. `onFinish` コールバックで会話・メッセージをDBに永続化
  7. `x-conversation-id` ヘッダで会話IDを返却

### FR-03-2: システムプロンプト

```
あなたは親切で分かりやすい塾の先生です。中高生の学習をサポートしてください。
数式は必ずLaTeX形式($...$ または $$...$$)で記述してください。
角括弧 [] や [ ] は数式デリミタとして使用しないでください。
```

### FR-03-3: LaTeX数式対応

- **インライン数式**: `$...$`
- **ブロック数式**: `$$...$$`
- **レンダリング**: KaTeX + remark-math + rehype-katex
- **正規化**: `normalizeMath()` で角括弧形式のデリミタを `$$` に変換

### FR-03-4: Markdownレンダリング

- **ライブラリ**: react-markdown 9.0.1
- **プラグイン**:
  - `remark-gfm`: GitHub Flavored Markdown（テーブル、取り消し線等）
  - `remark-math`: 数式パース
  - `rehype-katex`: 数式レンダリング
  - `rehype-sanitize`: XSS対策
- **最適化**: `MemoizedMarkdown` コンポーネントで `React.memo` を使用

### FR-03-5: 会話タイトル自動生成

```typescript
const makeTitle = () => {
  // ユーザーメッセージのテキストが存在する場合: 先頭50文字
  if (userText && userText.trim().length > 0) {
    return userText.trim().slice(0, 50)
  }
  // テキストがない場合: 日時フォーマット "YYYY-MM-DD HH:MM"
  const d = new Date()
  return `${d.getFullYear()}-${...}-${...} ${...}:${...}`
}
```

### FR-03-7: 会話管理

- **新規会話**: 送信ごとに新しい `conversationId`（UUID）を生成
- **既存会話選択**: サイドバーからクリックで会話を選択し、メッセージを読み込み
- **切替ロジック**: 会話選択時に `GET /api/conversations/[id]` でメッセージを取得

## 3.3 データ構造

```typescript
// UIMessage型（Vercel AI SDK）
type UIMessage = {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }>
  content?: string  // legacy互換
}

// 添付入力
type AttachmentInput = {
  storagePath: string
  mimeType?: string
  size?: number
}

// チャットAPIリクエスト
type ChatRequest = {
  messages: UIMessage[]
  attachments?: AttachmentInput[]
}

// DB永続化データ
type MessageInsert = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
}
```

## 3.4 アルゴリズム: メッセージ変換

```typescript
// ai-message-converter.ts
async function convertSafeMessages(uiMessages: UIMessage[]): Promise<ModelMessage[]> {
  // 1. 入力が配列か検証
  if (!Array.isArray(uiMessages)) {
    console.warn('convertSafeMessages: messages is not an array')
    return []
  }

  // 2. legacy メッセージの修復
  //    parts が undefined のメッセージに parts を補完
  const repaired = uiMessages.map((msg) => {
    if (!msg.parts || msg.parts.length === 0) {
      const text = typeof msg.content === 'string' ? msg.content : ''
      return { ...msg, parts: [{ type: 'text' as const, text }] }
    }
    return msg
  })

  // 3. Vercel AI SDK の convertToModelMessages() で変換
  return convertToModelMessages(repaired)
}
```

## 3.5 出力例

**ユーザー入力**: 「二次方程式の解の公式を教えてください」

**AI応答（Markdown + LaTeX）**:
```markdown
二次方程式 $ax^2 + bx + c = 0$ の解の公式は以下の通りです。

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

ここで：
- $a$, $b$, $c$ は二次方程式の係数です
- $b^2 - 4ac$ は **判別式** と呼ばれます
```

## 3.6 エラーハンドリング

| エラー箇所 | 対応 |
|---|---|
| OPENAI_API_KEY 未設定 | 500 "Missing OPENAI_API_KEY environment variable" |
| Authorization ヘッダなし | 401 "Unauthorized: No Authorization header" |
| トークン無効 | 401 "Unauthorized: Invalid token" |
| OpenAI API エラー | 500 JSON `{ error: エラーメッセージ }` |
| DB保存失敗 | ログ出力のみ（ストリーミング応答は正常続行） |

---

> **文書バージョン**: 1.0
> **作成日**: 2026-03-01
> **最終更新日**: 2026-03-01
