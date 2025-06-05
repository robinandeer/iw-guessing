import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Sim Spotter",
  description: "Can you spot the AI transformation?",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </body>
    </html>
  )
}
