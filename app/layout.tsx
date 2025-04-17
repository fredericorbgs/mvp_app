// app/layout.tsx
import "./globals.css";  // importa o tailwind + seu theme

export const metadata = {
  title: "Rivo MVP",
  description: "Upload e RAG",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}