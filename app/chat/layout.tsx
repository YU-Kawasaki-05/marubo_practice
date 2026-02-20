import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AIチャット - Marubo AI',
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
