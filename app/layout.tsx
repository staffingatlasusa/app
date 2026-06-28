import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StaffingAtlas — Contractor Management',
  description: 'Manage your remote team from one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
