import '../styles/globals.css'
import ActionCaredProvider from './contexts/action-cared'
import PDPAProvider from './contexts/pdpa'

export const metadata = {
  title: 'Exhibition Matching',
  description: 'QR Code Scanner for Exhibition Matching',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <ActionCaredProvider>
          <PDPAProvider>
            {children}
          </PDPAProvider>
        </ActionCaredProvider>
      </body>
    </html>
  )
}

