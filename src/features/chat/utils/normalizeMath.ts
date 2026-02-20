/**
 * 数式のデリミタを正規化するユーティリティ
 *
 * 主な役割:
 * 1. AIが誤って出力する `\[ ... \]` や `\( ... \)` を、这里的Markdownパーサー(remark-math)が認識できる
 *    `$$...$$` (ブロック) や `$...$` (インライン) に変換する。
 * 2. コードブロック (```...```) やインラインコード (`...`) 内の記述は変換しないように保護する。
 */
export function normalizeMathDelimiters(text: string): string {
  // コードブロックとインラインコードを一時的なプレースホルダーに置換する
  const placeholders: string[] = []
  const textWithPlaceholders = text.replace(
    /(```[\s\S]*?```|`[^`\n]+`)/g,
    (match) => {
      placeholders.push(match)
      return `__CODE_BLOCK_${placeholders.length - 1}__`
    }
  )

  // 数式デリミタの正規化
  // 1. \[ ... \] -> $$ ... $$ (ブロック数式)
  // 2. \( ... \) -> $ ... $ (インライン数式)
  // 補足: \ をエスケープするために \\ と記述
  const normalized = textWithPlaceholders
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // \[ ... \] -> $$ ... $$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')     // \( ... \) -> $ ... $

  // プレースホルダーを元のコードブロックに戻す
  return normalized.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return placeholders[Number(index)]
  })
}
