import '../styles/globals.css'

export const metadata = {
  title: 'Exhibition Matching',
  description: 'QR Code Scanner for Exhibition Matching',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}

