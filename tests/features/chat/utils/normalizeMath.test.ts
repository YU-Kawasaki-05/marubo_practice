import { normalizeMathDelimiters } from '../../../../src/features/chat/utils/normalizeMath'
import { describe, it, expect } from 'vitest'

describe('normalizeMathDelimiters', () => {
  it('converts display math \[ ... \] to $$ ... $$', () => {
    const input = 'Here is a formula: \\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]'
    const expected = 'Here is a formula: $$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$'
    expect(normalizeMathDelimiters(input)).toBe(expected)
  })

  it('converts inline math \( ... \) to $ ... $', () => {
    const input = 'Let \\( x > 0 \\) be true.'
    const expected = 'Let $ x > 0 $ be true.'
    expect(normalizeMathDelimiters(input)).toBe(expected)
  })

  it('handles mixed math types', () => {
    const input = 'Assume \\( a = b \\). Then: \\[ a^2 = b^2 \\]'
    const expected = 'Assume $ a = b $. Then: $$ a^2 = b^2 $$'
    expect(normalizeMathDelimiters(input)).toBe(expected)
  })

  it('preserves code blocks without modification', () => {
    const input = 'Check out this code:\n```python\nprint("\\[ escapes \\]")\n```\nAnd this formula: \\[ y = x \\]'
    const expected = 'Check out this code:\n```python\nprint("\\[ escapes \\]")\n```\nAnd this formula: $$ y = x $$'
    expect(normalizeMathDelimiters(input)).toBe(expected)
  })

  it('preserves inline code without modification', () => {
    const input = 'Use `\\[ ... \\]` for block math but here is real math: \\[ z = 0 \\]'
    const expected = 'Use `\\[ ... \\]` for block math but here is real math: $$ z = 0 $$'
    expect(normalizeMathDelimiters(input)).toBe(expected)
  })

  it('correctly handles multiple lines', () => {
    const input = `
      Start
      \\[
        \\sum_{i=1}^n i
      \\]
      End
    `
    const expected = `
      Start
      $$
        \\sum_{i=1}^n i
      $$
      End
    `
    expect(normalizeMathDelimiters(input)).toBe(expected)
  })

  // Prob2で言及されていた、モデルが誤って [ ... ] を使うパターンは
  // 基本的なLaTeXの \[ ... \] とは異なるかもしれないが、
  // LaTeXの標準的なデリミタである \[ \] を正規化対象にするのが第一歩。
  // もしモデルがバックスラッシュなしの [ ... ] を使う場合は別途対応が必要だが、
  // リスク・留意点にあるように過剰検知のリスクがあるため、まずは標準的なデリミタのみ対応する。
})
