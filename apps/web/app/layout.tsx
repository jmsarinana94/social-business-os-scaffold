export const metadata = {
  title: 'SBO',
  description: 'Social Business OS',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* keep markup simple to avoid hydration issues */}
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold">SBO</a>
            <nav className="flex gap-4 text-sm">
              <a href="/products" className="hover:underline">Products</a>
              <a href="/login" className="hover:underline">Login</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}