import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Attendance App',
  description: 'Staff Attendance Mobile Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}