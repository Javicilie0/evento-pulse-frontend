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
        <link rel="icon" href="/img/img/logo.svg" type="image/svg+xml" />

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://translate.google.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css/site.css" />

        <Script
          id="theme-lang-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var theme = localStorage.getItem('appTheme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
                var lang = localStorage.getItem('appLang') === 'en' ? 'en' : 'bg';
                document.documentElement.lang = lang;
                var meta = document.querySelector('meta[name="x-app-lang"]');
                if (meta) meta.setAttribute('content', lang);
                function applyLangCookies(nextLang) {
                  var exp = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  if (nextLang === 'en') {
                    document.cookie = 'googtrans=/bg/en; path=/;';
                    document.cookie = 'googtrans=/bg/en; path=/; domain=.' + location.hostname;
                  } else {
                    document.cookie = 'googtrans=; ' + exp;
                    document.cookie = 'googtrans=; ' + exp + ' domain=' + location.hostname + ';';
                    document.cookie = 'googtrans=; ' + exp + ' domain=.' + location.hostname + ';';
                  }
                }
                window.__eventoApplyLangCookies = applyLangCookies;
                applyLangCookies(lang);
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>

        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script src="/js/site.js" strategy="afterInteractive" />
        <Script src="/js/i18n.js" strategy="afterInteractive" />
        <Script src="/js/event-actions.js" strategy="afterInteractive" />
        <Script
          id="evento-ui-globals"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.toggleAppTheme = function () {
                var current = document.documentElement.getAttribute('data-theme') || 'light';
                var next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('appTheme', next);
                var btn = document.getElementById('app-theme-btn');
                if (btn) btn.innerHTML = next === 'dark'
                  ? '<i class="bi bi-sun"></i>'
                  : '<i class="bi bi-moon-stars"></i>';
              };
              window.toggleAppLang = function () {
                var current = localStorage.getItem('appLang') || 'bg';
                var next = current === 'en' ? 'bg' : 'en';
                localStorage.setItem('appLang', next);
                document.documentElement.lang = next;
                var meta = document.querySelector('meta[name="x-app-lang"]');
                if (meta) meta.setAttribute('content', next);
                if (window.__eventoApplyLangCookies) window.__eventoApplyLangCookies(next);
                location.reload();
              };
              window.googleTranslateElementInit = function () {
                if (!window.google || !window.google.translate) return;
                new window.google.translate.TranslateElement({
                  pageLanguage: 'bg',
                  includedLanguages: 'en',
                  autoDisplay: false
                }, 'google_translate_element');
              };
              (function(){
                var themeBtn = document.getElementById('app-theme-btn');
                var theme = document.documentElement.getAttribute('data-theme');
                if (themeBtn) themeBtn.innerHTML = theme === 'dark'
                  ? '<i class="bi bi-sun"></i>'
                  : '<i class="bi bi-moon-stars"></i>';
                var langBtn = document.getElementById('app-lang-btn');
                var lang = localStorage.getItem('appLang') === 'en' ? 'en' : 'bg';
                if (langBtn) langBtn.textContent = lang === 'en' ? 'BG' : 'EN';
              })();
            `,
          }}
        />
        <div id="google_translate_element" style={{ display: 'none' }} />
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      </body>
    </html>
  )
}
