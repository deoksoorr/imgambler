import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import UtcClock from '@/components/UtcClock'
import SessionWrapper from '@/components/SessionWrapper' 
import { ReactNode } from 'react'
import CategoryMenu from '@/components/CategoryMenu'
import AuthButtons from '@/components/AuthButtons'
import Link from 'next/link'
import Footer from '@/components/Footer'
import BoardMenu from '@/components/BoardMenu'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "private casino review",
  description: "UTC+0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="bg-white font-sans" style={{ background: '#fff' }}>
        <SessionWrapper>
          <div className="w-full flex flex-col px-8">
            <div className="flex items-center justify-end py-2">
              <AuthButtons />
            </div>
            <div className="flex items-center gap-6 py-2">
              <Link href="/">
                <img src="/logo.png" alt="I'M GAMBLER" className="h-10 object-contain align-middle" style={{ height: 40 }} />
              </Link>
              <BoardMenu />
            </div>
          </div>
          <div className="w-full border-b border-gray-200 mt-8" />
          <main className="bg-white min-h-screen">
            {/* <CategoryMenu /> */}
            {children}
          </main>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  )
}




