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
          <div className="w-full flex justify-end items-center px-4 py-4">
            <AuthButtons />
          </div>
          <div className="w-full flex justify-center items-center py-4">
            <Link href="/">
              <span className="text-2xl font-extrabold tracking-wide text-gray-900 cursor-pointer">I'M GAMBLER</span>
            </Link>
          </div>
          <div className="w-full h-4" />
          <CategoryMenu />
          {children}
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  )
}




