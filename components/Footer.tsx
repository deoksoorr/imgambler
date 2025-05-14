'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const [newsletterAgree, setNewsletterAgree] = useState(false)
  const pathname = usePathname()
  const isMain = pathname === '/'
  return (
    <>
      <div className={`w-full bg-[#181C20] py-10 flex justify-center items-center${isMain ? '' : ' mt-12 md:mt-16 lg:mt-24'}`}>
        <form
          className="max-w-2xl w-full flex flex-col gap-4 px-4"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            if (!newsletterAgree) return;
            await fetch('/api/newsletter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            alert('Subscribed!');
            form.reset();
            setNewsletterAgree(false);
          }}
        >
          <label className="text-gray-300 font-bold text-sm mb-1 tracking-widest uppercase">Subscribe to our newsletter</label>
          <div className="flex w-full gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="Insert your e-mail"
              className="flex-1 bg-[#23272F] border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg transition-all disabled:opacity-50"
              disabled={!newsletterAgree}
            >
              Subscribe
            </button>
          </div>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="agree"
              name="agree"
              className="w-5 h-5 mr-2 accent-blue-600 rounded border-gray-600"
              checked={newsletterAgree}
              onChange={e => setNewsletterAgree(e.target.checked)}
            />
            <label htmlFor="agree" className="text-gray-400 text-base select-none">
              I am at least 18 years old and legally allowed to play in a casino
            </label>
          </div>
        </form>
      </div>
      <footer className={`w-full bg-gray-100 border-t py-8 text-center text-gray-500 text-sm${isMain ? '' : ' mt-0'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="font-bold text-gray-700">I'M GAMBLER-FORUM</div>
          <div>&copy; {new Date().getFullYear()} I'M GAMBLER-FORUM. All rights reserved.</div>
        </div>
      </footer>
    </>
  )
} 