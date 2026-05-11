import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Evento - Открий събития около теб',
  description: 'Evento - събития, билети и парти вечери около теб.',
}

export const viewport: Viewport = {
  themeColor: '#6c5ce7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-app-lang" content="bg" />
        <link rel="icon" href="/img/logo.svg" type="image/svg+xml" />

        {/* Bootstrap 5 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossOrigin="anonymous"
        />
        {/* Bootstrap Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        {/* App CSS */}
        <link rel="stylesheet" href="/css/site.css" />

        {/* Theme init — prevents flash */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('appTheme')||'light';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>

        {/* Bootstrap JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script src="/js/site.js" strategy="afterInteractive" />
        <Script src="/js/i18n.js" strategy="afterInteractive" />
        <Script src="/js/event-actions.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
