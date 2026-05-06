import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ZeroPay | Confidential AI Payroll Agent',
  description: 'Autonomous AI payroll workforce management built on 0G Labs Galileo Testnet with Arcium confidential compute',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-surface-50 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
