// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <head />
      <body className="bg-gray-100 text-gray-900">{children}</body>
    </html>
  );
}
