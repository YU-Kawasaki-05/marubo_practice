import { convertToModelMessages, type ModelMessage, type UIMessage } from 'ai'

/**
 * UIMessageの配列を安全にModelMessageの配列に変換するユーティリティ
 * v6.0.33対応版
 * 
 * 主な機能:
 * 1. contentのみでpartsが欠落しているレガシーメッセージの補完
 * 2. 型不整合によるクラッシュの防止
 * 3. 公式の非同期変換関数のラップ
 */
export async function convertSafeMessages(messages: UIMessage[]): Promise<ModelMessage[]> {
  // 1. 入力値のバリデーション（null/undefinedチェック）
  if (!Array.isArray(messages)) {
    console.warn('convertSafeMessages received non-array input:', messages)
    return []
  }

  // 2. 前処理（Pre-processing）
  // SDKの変換関数に渡す前に、UIMessageとして不完全なオブジェクトを修復する
  type UIMessageWithLegacyContent = UIMessage & { content?: string }

  const sanitizedMessages: UIMessage[] = messages.map((msg, index) => {
    // 必須フィールドの存在確認
    if (!msg.role) {
      throw new Error(`Message at index ${index} is missing 'role' property.`)
    }

    // partsが存在せず、contentが文字列の場合の正規化
    // v6のconvertToModelMessagesはpartsの存在を期待するケースがあるため、明示的に構築する
    const runtimeParts = (msg as { parts?: unknown }).parts
    const legacyMessage = msg as UIMessageWithLegacyContent
    if (!Array.isArray(runtimeParts) && typeof legacyMessage.content === 'string') {
      return {
        ...msg,
        parts: [{ type: 'text', text: legacyMessage.content } as const],
      }
    }

    // 既にpartsが存在する場合、またはcontentもpartsもない場合（空メッセージ）はそのまま通過させる
    return msg
  })

  // 3. 非同期変換の実行
  try {
    // convertToModelMessagesは内部でツールの呼び出しと結果の紐付け（split）を行うため、
    // 自前でmap処理を書くよりも公式関数を利用する方が安全である。
    const modelMessages = await convertToModelMessages(sanitizedMessages)
    return modelMessages
  } catch (error) {
    console.error('Failed to convert messages to model format:', error)
    // エラーハンドリング: 必要に応じて空配列を返すか、エラーを再スローする
    throw error
  }
}
