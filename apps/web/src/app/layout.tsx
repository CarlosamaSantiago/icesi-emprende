import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { connection } from 'next/server';
import { Toaster } from 'sonner';
import './globals.css';

// Self-hosted variable font (OFL, from @fontsource): no third-party request at build or runtime (CSP font-src 'self').
const jakarta = localFont({
  src: './fonts/PlusJakartaSans-Variable.woff2',
  weight: '200 800',
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Emprende ICESI', template: '%s · Emprende ICESI' },
  description: 'Marketplace de emprendimientos de la comunidad Icesi',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render every page per request so Next can attach the CSP nonce (set in middleware) to its scripts.
  await connection();
  return (
    <html lang="es" className={jakarta.variable}>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
