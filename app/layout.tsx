import './globals.css';

export const metadata = {
  title: 'Top Feud',
  description: 'Arabic Family Feud style game with auth and game sessions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}