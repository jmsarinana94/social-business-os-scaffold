export const metadata = { title: 'Social Media Business OS' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </body>
    </html>
  );
}
