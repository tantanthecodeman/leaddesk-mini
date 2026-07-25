export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="border-t border-stone-200 px-6 py-6 text-center text-sm text-stone-400">
          <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600">
            Built for Digital Heroes Training Task
          </a>
        </footer>
      </body>
    </html>
  )
}