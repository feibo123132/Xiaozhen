import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: '解忧小镇',
  description: '把真实烦恼种成树、化作动物，在一次次认真回答里慢慢生长。',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <div className="page-frame" aria-hidden="true" />
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <span>吉他声会停，认真说过的话留在这里。</span>
          <span>解忧小镇 · 青年思考计划</span>
        </footer>
      </body>
    </html>
  );
}
