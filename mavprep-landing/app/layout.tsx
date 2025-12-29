import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AmplifyProvider from '../lib/amplify-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MavPrep - Your Success Preparation Platform',
  description:
    'MavPrep helps you prepare for success with powerful tools and resources.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={inter.variable}>
      <body className='antialiased font-sans'>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
