"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CategoryMenu() {
  const [categories, setCategories] = useState<any[]>([])
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/categories')
      .then(async res => {
        if (!res.ok) return []
        try {
          return await res.json()
        } catch {
          return []
        }
      })
      .then(data => setCategories(Array.isArray(data) ? data : []))
  }, [])

  return (
    <nav className="w-full flex flex-wrap gap-4 items-center justify-center py-2 bg-white border-b">
      {categories.map(cat => (
        <div key={cat.id} className="relative group"
          onMouseEnter={() => setOpenId(cat.id)}
          onMouseLeave={() => setOpenId(null)}
        >
          <div>
            <button
              className="px-3 py-1 font-semibold text-gray-800 hover:text-blue-600 rounded focus:outline-none"
              tabIndex={-1}
            >
              {cat.name}
            </button>
          </div>
          {cat.boards && cat.boards.length > 0 && (
            <div className={`absolute left-0 top-full mt-0 bg-white border rounded shadow z-50 min-w-[160px] ${openId === cat.id ? '' : 'hidden'}`}>
              {cat.boards.map((board: any) => (
                <Link
                  key={board.id}
                  href={`/board/${cat.name.toLowerCase().replace(/\s+/g, '-')}/${board.slug}`}
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 whitespace-nowrap"
                  onClick={() => setOpenId(null)}
                >
                  {board.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
} 