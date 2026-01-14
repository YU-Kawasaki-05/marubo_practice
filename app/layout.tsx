import type { Metadata } from 'next'

import { AccountStatusBanner } from '../src/features/allowlist/components/AccountStatusBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marubo AI',
  description: '塾向けチャットボット（β）',
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <AccountStatusBanner />
        {children}
      </body>
    </html>
  )
}
