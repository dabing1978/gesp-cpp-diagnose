import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GESP C++ 真题自测与 AI 错题诊断助手',
  description: '面向 GESP C++ 认证考生的在线真题自测与启发式 AI 错题找茬平台，包含考点溯源与算法推演动画演示。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-100/70 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
