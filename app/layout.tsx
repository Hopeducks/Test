import type { Metadata, Viewport } from 'next';
import { Outfit, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '과학 마스터 도감 (Science Master Pokédex) - 초등 5학년 과학 복습',
  description: '2022 개정 교육과정 기반 초등학교 5학년 과학 전체 단원 복습 퀴즈 및 도감 수집 게임. 교실 빔프로젝터 및 태블릿 호환.',
  keywords: ['초등과학', '5학년과학', '2022개정교육과정', '과학복습', '과학게임', '포켓몬도감', '교육웹앱'],
  authors: [{ name: 'Antigravity AI' }],
  other: {
    'darkreader-lock': 'true',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${outfit.variable} ${notoSansKr.variable}`} suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className="antialiased projector-scanlines selection:bg-cyan-500 selection:text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
