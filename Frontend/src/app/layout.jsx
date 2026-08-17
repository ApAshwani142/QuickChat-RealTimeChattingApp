import './globals.css'

export const metadata = {
  title: 'QuickChat | Secure Real-Time Messaging & 2FA Protection',
  description: 'Experience lightning-fast real-time messaging with state-of-the-art security. QuickChat features Multi-Factor Authentication (MFA), password hashing, and instant JWT-protected communications.',
  keywords: 'QuickChat, secure chat, real-time messaging, two factor authentication, 2FA, MFA, JWT auth, secure messenger',
  authors: [{ name: 'QuickChat Team' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'QuickChat | Secure Real-Time Messaging & 2FA Protection',
    description: 'Experience lightning-fast real-time messaging with state-of-the-art security. QuickChat features Multi-Factor Authentication (MFA), password hashing, and instant JWT-protected communications.',
    siteName: 'QuickChat',
  },
}

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'QuickChat',
    'alternateName': 'QuickChat Messenger',
    'description': 'A highly secure real-time chatting application featuring 2FA, password hashing, and JWT authorization.',
    'applicationCategory': 'CommunicationApplication',
    'operatingSystem': 'All',
    'browserRequirements': 'Requires JavaScript. Requires HTML5.',
    'securityDetails': 'Multi-Factor Authentication (TOTP), Bcrypt Hashing, JSON Web Tokens (JWT) Authorizations'
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2050/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💬</text></svg>" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
