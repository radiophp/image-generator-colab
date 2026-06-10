export const metadata = {
  title: "AI Image Generator",
  description: "Generate images using AI via Colab GPU",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        {children}
      </body>
    </html>
  )
}
