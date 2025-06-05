import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Sim Spotter",
  description: "Can you spot the AI transformation?",
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="overflow-x-hidden">
        {children}
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </body>
    </html>
  )
}
